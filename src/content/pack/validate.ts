import type { ContentStatus } from '../german/types.ts'
import type { ContentPack, FileInfo, Issue, PackRules, PackWord } from './types.ts'

/** Id va slug: kichik lotin harf, raqam, bitta chiziqcha bilan ajratilgan qismlar. */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
/** Supabase'da word_id ≤ 96 belgi. */
export const MAX_WORD_ID = 96
/** Rasm: 60 KB dan katta — xato, 30 KB dan katta — ogohlantirish (arzon telefon, sekin 3G). */
export const IMAGE_MAX_BYTES = 60 * 1024
export const IMAGE_WARN_BYTES = 30 * 1024
export const ARTICLES = ['der', 'die', 'das'] as const
export const STATUSES: readonly ContentStatus[] = ['draft', 'review', 'approved']
export const IMAGE_SOURCES = ['ai', 'own', 'cc'] as const
const AUDIO_RE = /\.(mp3|ogg|m4a)$/i

export const wordIdOf = (rules: Pick<PackRules, 'prefix'>, field: string, situation: string, slug: string) => `${rules.prefix}${field}-${situation}-${slug}`

export const isIsoDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

const filled = (s: string | undefined) => typeof s === 'string' && s.trim() !== ''
const isInt = (n: unknown) => typeof n === 'number' && Number.isInteger(n)

export type ValidateOptions = {
  fileInfo?: FileInfo
  /** Ilovadagi mavjud soʻz id'lari (ALL_WORD_IDS) — toʻqnashuv xato. */
  existingWordIds?: ReadonlySet<string>
  /** Xato qayerda: Excel'dan import qilinganda "Sozlar, 7-qator". */
  whereOfWord?: (w: PackWord) => string | undefined
}

/**
 * Paketlarni tekshiradi (Excel importidan keyin ham, tayyor JSON'lar uchun ham — bir xil qoidalar).
 * Xabarlar oʻzbekcha: jamoa Excel'ni shu xabarlar boʻyicha tuzatadi.
 */
export function validatePacks(packs: readonly ContentPack[], rules: PackRules, opts: ValidateOptions = {}): Issue[] {
  const issues: Issue[] = []
  const seenFields = new Set<string>()
  const seenWords = new Set<string>()

  for (const p of packs) {
    const at = `${p.course}/${p.field}.json`
    const err = (message: string, where = at) => issues.push({ level: 'error', where, message })
    if (p.schema !== 1) err(`schema ${String(p.schema)} — faqat 1 qoʻllab-quvvatlanadi`)
    if (p.course !== rules.course) err(`kurs "${p.course}", kutilgan "${rules.course}"`)
    if (!rules.fields.includes(p.field)) err(`nomaʼlum soha "${p.field}" (mumkin: ${rules.fields.join(', ')})`)
    if (seenFields.has(p.field)) err(`soha "${p.field}" ikki marta`)
    seenFields.add(p.field)
    if (!filled(p.title?.uz)) err('soha nomi (title_uz) boʻsh')
    if (!isInt(p.order)) err('soha tartibi (order) butun son emas')

    const sit = new Set<string>()
    for (const s of p.situations) {
      const w = `${at} → vaziyat "${s.id}"`
      if (!SLUG_RE.test(s.id)) err('vaziyat id faqat kichik lotin harf, raqam va chiziqcha boʻlsin', w)
      if (sit.has(s.id)) err('vaziyat id takrorlangan', w)
      sit.add(s.id)
      if (!filled(s.title?.uz)) err('vaziyat nomi (title_uz) boʻsh', w)
      if (!isInt(s.order)) err('tartib (order) butun son emas', w)
      if (!rules.levels.includes(s.level)) err(`daraja "${s.level}" notoʻgʻri (mumkin: ${rules.levels.join(', ')})`, w)
    }

    for (const word of p.words) checkWord(word, p, sit, rules, opts, seenWords, issues, at)
  }
  return issues
}

function checkWord(w: PackWord, p: ContentPack, situations: ReadonlySet<string>, rules: PackRules, opts: ValidateOptions, seen: Set<string>, issues: Issue[], at: string) {
  const where = opts.whereOfWord?.(w) ?? `${at} → ${w.id}`
  const err = (message: string) => issues.push({ level: 'error', where, message })
  const warn = (message: string) => issues.push({ level: 'warning', where, message })

  // Id
  if (!SLUG_RE.test(w.slug)) err(`slug "${w.slug}" — faqat kichik lotin harf, raqam va chiziqcha`)
  const expected = wordIdOf(rules, w.field, w.situation, w.slug)
  if (w.id !== expected) err(`id "${w.id}" kutilgan "${expected}" ga teng emas`)
  if (w.id.length > MAX_WORD_ID) err(`id ${w.id.length} belgi (≤ ${MAX_WORD_ID}) — slug yoki vaziyat id'sini qisqartiring`)
  if (seen.has(w.id)) err(`id "${w.id}" takrorlangan (bir vaziyatda bir xil slug)`)
  seen.add(w.id)
  if (opts.existingWordIds?.has(w.id)) err(`id "${w.id}" ilovadagi mavjud soʻz bilan bir xil`)

  // Joyi
  if (w.field !== p.field) err(`soha "${w.field}", fayl sohasi "${p.field}"`)
  if (!situations.has(w.situation)) err(`vaziyat "${w.situation}" "Vaziyatlar" varagʻida yoʻq`)
  if (!rules.levels.includes(w.level)) err(`daraja "${w.level}" notoʻgʻri (mumkin: ${rules.levels.join(', ')})`)
  for (const j of w.jobs) if (!SLUG_RE.test(j)) err(`kasb "${j}" — faqat kichik lotin harf, raqam va chiziqcha (vergul bilan ajrating)`)

  // Matn
  if (!filled(w.term)) err('soʻz (term) boʻsh')
  if (w.icon !== undefined && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(w.icon)) err(`ikonka "${w.icon}" — Tabler nomi (masalan tools, first-aid-kit)`)
  if (!filled(w.tr?.uz)) err('tarjima (uz) boʻsh')
  const needAll = w.status !== 'draft'
  const missing3 = (l: { 'uz-Cyrl'?: string; ru?: string } | undefined, what: string) => {
    const miss = [!filled(l?.['uz-Cyrl']) && 'kirill', !filled(l?.ru) && 'rus'].filter(Boolean)
    if (miss.length === 0) return
    const msg = `${what}: ${miss.join(' va ')} tarjimasi yoʻq`
    if (needAll) err(`${msg} (qoralamadan boshqa holatda majburiy)`)
    else warn(msg)
  }
  missing3(w.tr, 'soʻz')

  // Artikl va koʻplik
  if (w.article !== undefined) {
    if (!rules.article) err('bu kursda artikl ustuni ishlatilmaydi')
    else if (!(ARTICLES as readonly string[]).includes(w.article)) err(`artikl "${w.article}" — faqat der, die yoki das`)
    else if (!new RegExp(`^${w.article} \\p{Lu}`, 'u').test(w.term)) err(`"${w.term}": artikldan keyin ot bosh harf bilan boʻlishi kerak`)
  }
  if (w.plural !== undefined) {
    if (!rules.article) err('bu kursda koʻplik ustuni ishlatilmaydi')
    else {
      if (w.article === undefined) err('koʻplik yozilgan, lekin artikl yoʻq')
      if (w.plural !== '—' && !/^die \p{Lu}/u.test(w.plural)) err(`koʻplik "${w.plural}" — "die ..." shaklida yoki koʻpligi yoʻq boʻlsa "—"`)
    }
  }
  if (rules.article && w.article === undefined && /^\p{Lu}[\p{L}-]+$/u.test(w.term)) warn(`"${w.term}" ot boʻlsa, artiklni yozing`)

  // Oʻqilishi
  const pronParts = w.pron ? [w.pron.uz, w.pron['uz-Cyrl'], w.pron.ru].filter(filled).length : 0
  if (rules.pron && pronParts < 3) err('oʻqilishi (pron_uz, pron_cyrl, pron_ru) bu kursda majburiy')
  else if (w.status !== 'draft' && pronParts < 3) err('oʻqilishi (pron_uz, pron_cyrl, pron_ru) qoralamadan boshqa holatda majburiy — dars kartasida chiqadi')
  else if (pronParts > 0 && pronParts < 3) err('oʻqilishi uch tilda toʻliq boʻlsin (pron_uz, pron_cyrl, pron_ru)')

  // Misol
  if (w.example) {
    if (!filled(w.example.term) || !filled(w.example.tr?.uz)) err('misol: gap (example_term) va tarjimasi (example_uz) birga yoziladi')
    else missing3(w.example.tr, 'misol')
  }

  // Rasm
  if (w.image) {
    const { src, source, license, author, checked } = w.image
    if (!/\.webp$/i.test(src)) err(`rasm "${src}" — faqat .webp`)
    if (!(IMAGE_SOURCES as readonly string[]).includes(source)) err(`rasm manbai "${source}" — ai, own yoki cc`)
    if (source === 'cc' && (!filled(license) || !filled(author))) err('cc rasm uchun litsenziya (image_license) va muallif (image_author) majburiy')
    if (w.status === 'approved' && !checked) err('tasdiqlangan soʻzning rasmi odam tomonidan koʻrib chiqilmagan (image_checked = ha)')
    if (opts.fileInfo) {
      const f = opts.fileInfo(src)
      if (!f) err(`rasm fayli topilmadi: public/${src}`)
      else if (f.size > IMAGE_MAX_BYTES) err(`rasm ${Math.round(f.size / 1024)} KB — ${IMAGE_MAX_BYTES / 1024} KB dan oshmasin`)
      else if (f.size > IMAGE_WARN_BYTES) warn(`rasm ${Math.round(f.size / 1024)} KB — ~${IMAGE_WARN_BYTES / 1024} KB tavsiya etiladi`)
    }
  }

  // Audio
  if (w.audio !== undefined) {
    if (!AUDIO_RE.test(w.audio)) err(`audio "${w.audio}" — mp3, ogg yoki m4a`)
    else if (opts.fileInfo && !opts.fileInfo(w.audio)) err(`audio fayli topilmadi: public/${w.audio}`)
  }

  // Holat
  if (!STATUSES.includes(w.status)) err(`holat "${String(w.status)}" — qoralama, tekshiruvda yoki tasdiqlangan`)
  if (w.status === 'approved') {
    if (!filled(w.verifiedBy)) err('tasdiqlangan soʻzda tekshiruvchi (verified_by) majburiy')
    if (!filled(w.verifiedAt) || !isIsoDate(w.verifiedAt!)) err('tasdiqlangan soʻzda sana (verified_at) YYYY-MM-DD shaklida majburiy')
  } else if (w.verifiedAt !== undefined && !isIsoDate(w.verifiedAt)) err('sana (verified_at) YYYY-MM-DD shaklida boʻlsin')
}

/** Qisqa hisobot: soha boʻyicha soʻzlar, rasm/audio/misol bor-yoʻqligi, holatlar. */
export function packReport(packs: readonly ContentPack[]): string[] {
  const lines: string[] = []
  for (const p of packs) {
    const n = p.words.length
    const c = (f: (w: PackWord) => boolean) => p.words.filter(f).length
    const st = STATUSES.map((s) => `${s} ${c((w) => w.status === s)}`).join(', ')
    lines.push(
      `${p.course}/${p.field}: ${p.situations.length} vaziyat, ${n} soʻz · rasm ${c((w) => !!w.image)}/${n} · audio ${c((w) => !!w.audio)}/${n} · misol ${c((w) => !!w.example)}/${n} · xavfsizlik ${c((w) => w.safety)} · ${st}`
    )
  }
  return lines
}
