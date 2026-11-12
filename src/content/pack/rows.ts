import type { ContentStatus, L3 } from '../german/types.ts'
import { wordSlug } from '../../lang/words.ts'
import type { ContentPack, Issue, PackRules, PackWord } from './types.ts'
import { PACK_SCHEMA } from './types.ts'
import { validatePacks, wordIdOf, type ValidateOptions } from './validate.ts'

/**
 * Excel qatorlari → paketlar. Excel bilan ishlash (exceljs) skriptda; bu yerda faqat matn qatorlari — test qilish oson.
 * 1-qator — ustun nomlari, 2-qator — izoh (oʻtkaziladi), maʼlumot 3-qatordan. Boʻsh qatorlar skriptda tashlanadi.
 */
/** Bitta qator: ustun nomi → matn; __row — Excel qator raqami (matn sifatida). */
export type Row = Record<string, string>
export type Sheets = { fields: Row[]; situations: Row[]; words: Row[] }

export const SHEET = { fields: 'Sohalar', situations: 'Vaziyatlar', words: 'Sozlar' } as const

export const FIELD_COLUMNS = ['id', 'title_uz', 'title_cyrl', 'title_ru', 'order'] as const
export const SITUATION_COLUMNS = ['field', 'id', 'title_uz', 'title_cyrl', 'title_ru', 'order', 'level'] as const
export const WORD_COLUMNS = [
  'field', 'situation', 'level', 'article', 'term', 'plural', 'slug',
  'uz', 'uz_cyrl', 'ru', 'pron_uz', 'pron_cyrl', 'pron_ru',
  'example_term', 'example_uz', 'example_cyrl', 'example_ru',
  'jobs', 'safety', 'image_file', 'image_source', 'image_license', 'image_author', 'image_checked', 'audio_file',
  'source', 'status', 'verified_by', 'verified_at'
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
    if (rules.article && /^(der|die|das)\s/i.test(term)) {
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

  const out = [...packs.values()].sort((a, b) => a.order - b.order)
  for (const p of out) p.situations.sort((a, b) => a.order - b.order)
  issues.push(...validatePacks(out, rules, { ...opts, whereOfWord: (w) => whereById.get(w.id) }))
  return { packs: out, issues }
}
