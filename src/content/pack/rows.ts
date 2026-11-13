import type { ContentStatus, L3 } from '../german/types.ts'
import { wordSlug } from '../../lang/words.ts'
import type { ContentPack, Issue, PackDialogLine, PackRules, PackWord } from './types.ts'
import { PACK_SCHEMA } from './types.ts'
import { validatePacks, wordIdOf, type ValidateOptions } from './validate.ts'

/**
 * Excel qatorlari → paketlar. Excel bilan ishlash (exceljs) skriptda; bu yerda faqat matn qatorlari — test qilish oson.
 * 1-qator — ustun nomlari, 2-qator — izoh (oʻtkaziladi), maʼlumot 3-qatordan. Boʻsh qatorlar skriptda tashlanadi.
 */
/** Bitta qator: ustun nomi → matn; __row — Excel qator raqami (matn sifatida). */
export type Row = Record<string, string>
/** dialogs — ixtiyoriy varaq (eski Excel fayllarda yoʻq). */
export type Sheets = { fields: Row[]; situations: Row[]; words: Row[]; dialogs?: Row[] }

export const SHEET = { fields: 'Sohalar', situations: 'Vaziyatlar', words: 'Sozlar', dialogs: 'Dialoglar' } as const

export const FIELD_COLUMNS = ['id', 'title_uz', 'title_cyrl', 'title_ru', 'order'] as const
export const SITUATION_COLUMNS = ['field', 'id', 'title_uz', 'title_cyrl', 'title_ru', 'order', 'level'] as const
export const WORD_COLUMNS = [
  'field', 'situation', 'level', 'article', 'term', 'plural', 'slug', 'icon',
  'uz', 'uz_cyrl', 'ru', 'pron_uz', 'pron_cyrl', 'pron_ru',
  'example_term', 'example_uz', 'example_cyrl', 'example_ru',
  'jobs', 'safety', 'image_file', 'image_source', 'image_license', 'image_author', 'image_checked', 'audio_file',
  'source', 'status', 'verified_by', 'verified_at'
] as const

/** Dialog: har qator — bitta replika; line — tartib (1, 2, 3 ...). Bitta vaziyatda bitta dialog. */
export const DIALOG_COLUMNS = [
  'field', 'situation', 'line', 'speaker_uz', 'speaker_cyrl', 'speaker_ru', 'de', 'uz', 'uz_cyrl', 'ru', 'status', 'verified_by', 'verified_at'
] as const

/** Holat: Excel'da oʻzbekcha (ochiladigan roʻyxat), JSON'da kod. */
export const STATUS_ALIASES: Record<string, ContentStatus> = {
  qoralama: 'draft', tekshiruvda: 'review', tasdiqlangan: 'approved',
  draft: 'draft', review: 'review', approved: 'approved'
}

const plain = (s: string | undefined) => (s ?? '').trim()
const key = (s: string | undefined) => plain(s).toLowerCase().replace(/[ʻʼ'‘’`]/g, '')
/** "ha" / "yoʻq" (yoki boʻsh = yoʻq). Boshqa qiymat — undefined. */
export const yesNo = (s: string | undefined): boolean | undefined => {
  const k = key(s)
  if (k === 'ha' || k === 'yes' || k === 'да') return true
  if (k === '' || k === 'yoq' || k === 'no' || k === 'нет') return false
  return undefined
}
const int = (s: string | undefined): number | undefined => (/^-?\d+$/.test(plain(s)) ? Number(plain(s)) : undefined)
const l3 = (uz: string | undefined, cyrl: string | undefined, ru: string | undefined): L3 => ({ uz: plain(uz), 'uz-Cyrl': plain(cyrl), ru: plain(ru) })
const opt = (s: string | undefined) => (plain(s) === '' ? undefined : plain(s))
const at = (sheet: string, r: Row) => `${sheet}, ${r.__row}-qator`

export type RowsResult = { packs: ContentPack[]; issues: Issue[] }

export function rowsToPacks(sheets: Sheets, rules: PackRules, opts: Omit<ValidateOptions, 'whereOfWord'> = {}): RowsResult {
  const issues: Issue[] = []
  const err = (where: string, message: string) => issues.push({ level: 'error', where, message })
  const packs = new Map<string, ContentPack>()

  for (const r of sheets.fields) {
    const id = plain(r.id)
    if (!rules.fields.includes(id)) {
      err(at(SHEET.fields, r), `nomaʼlum soha "${id}" (mumkin: ${rules.fields.join(', ')})`)
      continue
    }
    if (packs.has(id)) {
      err(at(SHEET.fields, r), `soha "${id}" ikki marta`)
      continue
    }
    const order = int(r.order)
    if (order === undefined) err(at(SHEET.fields, r), 'tartib (order) butun son boʻlsin')
    packs.set(id, { schema: PACK_SCHEMA, course: rules.course, field: id, title: l3(r.title_uz, r.title_cyrl, r.title_ru), order: order ?? 0, situations: [], words: [] })
  }

  for (const r of sheets.situations) {
    const p = packs.get(plain(r.field))
    if (!p) {
      err(at(SHEET.situations, r), `soha "${plain(r.field)}" "${SHEET.fields}" varagʻida yoʻq`)
      continue
    }
    const order = int(r.order)
    if (order === undefined) err(at(SHEET.situations, r), 'tartib (order) butun son boʻlsin')
    p.situations.push({ id: plain(r.id), title: l3(r.title_uz, r.title_cyrl, r.title_ru), order: order ?? 0, level: plain(r.level) })
  }

  const whereById = new Map<string, string>()
  for (const r of sheets.words) {
    const where = at(SHEET.words, r)
    const p = packs.get(plain(r.field))
    if (!p) {
      err(where, `soha "${plain(r.field)}" "${SHEET.fields}" varagʻida yoʻq`)
      continue
    }
    let term = plain(r.term)
    const article = opt(r.article)?.toLowerCase()
    // Faqat "der Hammer" kabi (artikl + bitta ot) xato; "Das ist im Gang drei." — ibora, artikl emas
    if (rules.article && /^(der|die|das)\s+\p{Lu}[\p{L}-]*$/iu.test(term)) {
      err(where, `"${term}": artiklni "article" ustuniga alohida yozing, "term" da faqat ot qolsin`)
      continue
    }
    if (article !== undefined && rules.article && term !== '') term = `${article} ${term}`
    const slug = plain(r.slug) || (rules.pron ? '' : wordSlug(plain(r.term)))
    if (slug === '') {
      err(where, rules.pron ? 'slug majburiy (lotin harflarida, masalan "chulgu")' : 'slug chiqmadi — "slug" ustunini yozing')
      continue
    }
    const situation = plain(r.situation)
    const safety = yesNo(r.safety)
    if (safety === undefined) err(where, `xavfsizlik (safety) "${plain(r.safety)}" — "ha" yoki "yoʻq"`)
    const status = STATUS_ALIASES[key(r.status)]
    if (!status) {
      err(where, `holat (status) "${plain(r.status)}" — qoralama, tekshiruvda yoki tasdiqlangan`)
      continue
    }

    const w: PackWord = {
      id: wordIdOf(rules, p.field, situation, slug),
      slug,
      term,
      ...(opt(r.icon) !== undefined && { icon: opt(r.icon) }),
      ...(article !== undefined && { article: article as PackWord['article'] }),
      ...(opt(r.plural) !== undefined && { plural: opt(r.plural) }),
      tr: l3(r.uz, r.uz_cyrl, r.ru),
      ...([r.pron_uz, r.pron_cyrl, r.pron_ru].some((v) => plain(v) !== '') && { pron: l3(r.pron_uz, r.pron_cyrl, r.pron_ru) }),
      level: plain(r.level),
      field: p.field,
      jobs: plain(r.jobs).split(/[,;]/).map((s) => s.trim()).filter(Boolean),
      situation,
      ...((plain(r.example_term) !== '' || plain(r.example_uz) !== '') && { example: { term: plain(r.example_term), tr: l3(r.example_uz, r.example_cyrl, r.example_ru) } }),
      safety: safety ?? false,
      status
    }
    const imageFile = opt(r.image_file)
    if (imageFile !== undefined) {
      const checked = yesNo(r.image_checked)
      if (checked === undefined) err(where, `image_checked "${plain(r.image_checked)}" — "ha" yoki "yoʻq"`)
      w.image = {
        src: `content/${rules.course}/img/${imageFile.replace(/^\/+/, '')}`,
        source: key(r.image_source) as 'ai' | 'own' | 'cc',
        ...(opt(r.image_license) !== undefined && { license: opt(r.image_license) }),
        ...(opt(r.image_author) !== undefined && { author: opt(r.image_author) }),
        checked: checked ?? false
      }
    }
    const audioFile = opt(r.audio_file)
    if (audioFile !== undefined) w.audio = `content/${rules.course}/audio/${audioFile.replace(/^\/+/, '')}`
    if (opt(r.source) !== undefined) w.source = opt(r.source)
    if (opt(r.verified_by) !== undefined) w.verifiedBy = opt(r.verified_by)
    if (opt(r.verified_at) !== undefined) w.verifiedAt = opt(r.verified_at)
    p.words.push(w)
    whereById.set(w.id, where)
  }

  // Dialoglar: vaziyat boʻyicha guruhlanadi, line tartibida; holat bir xil boʻlishi kerak
  const dialogRows = new Map<string, { line: number; row: Row }[]>()
  for (const r of sheets.dialogs ?? []) {
    const where = at(SHEET.dialogs, r)
    const p = packs.get(plain(r.field))
    if (!p) {
      err(where, `soha "${plain(r.field)}" "${SHEET.fields}" varagʻida yoʻq`)
      continue
    }
    const s = p.situations.find((x) => x.id === plain(r.situation))
    if (!s) {
      err(where, `vaziyat "${plain(r.situation)}" "${SHEET.situations}" varagʻida yoʻq`)
      continue
    }
    const line = int(r.line)
    if (line === undefined || line < 1) {
      err(where, 'replika tartibi (line) 1, 2, 3 ... boʻlsin')
      continue
    }
    const k = `${p.field}/${s.id}`
    const list = dialogRows.get(k) ?? []
    if (list.some((x) => x.line === line)) {
      err(where, `replika ${line} takrorlangan`)
      continue
    }
    list.push({ line, row: r })
    dialogRows.set(k, list)
  }
  for (const [k, list] of dialogRows) {
    const [field, sid] = k.split('/')
    const s = packs.get(field)!.situations.find((x) => x.id === sid)!
    list.sort((a, b) => a.line - b.line)
    const first = at(SHEET.dialogs, list[0].row)
    if (list.some((x, i) => x.line !== i + 1)) err(first, `"${sid}" dialogi: replikalar 1 dan ketma-ket raqamlansin`)
    const statuses = new Set(list.map((x) => STATUS_ALIASES[key(x.row.status)]))
    if (statuses.has(undefined as never) || statuses.size !== 1) {
      err(first, `"${sid}" dialogi: holat (status) hamma replikada bir xil boʻlsin — qoralama, tekshiruvda yoki tasdiqlangan`)
      continue
    }
    const lines: PackDialogLine[] = list.map(({ row }) => ({ speaker: l3(row.speaker_uz, row.speaker_cyrl, row.speaker_ru), de: plain(row.de), tr: l3(row.uz, row.uz_cyrl, row.ru) }))
    const by = list.map((x) => opt(x.row.verified_by)).find(Boolean)
    const atDate = list.map((x) => opt(x.row.verified_at)).find(Boolean)
    s.dialog = { lines, status: [...statuses][0], ...(by && { verifiedBy: by }), ...(atDate && { verifiedAt: atDate }) }
  }

  const out = [...packs.values()].sort((a, b) => a.order - b.order)
  for (const p of out) p.situations.sort((a, b) => a.order - b.order)
  issues.push(...validatePacks(out, rules, { ...opts, whereOfWord: (w) => whereById.get(w.id) }))
  return { packs: out, issues }
}
