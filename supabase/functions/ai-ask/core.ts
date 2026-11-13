/**
 * AI maslahatchining sof mantiqi (Deno ham, vitest ham ishlata oladi): savolni tekshirish,
 * bilim bazasidan parcha tanlash, modelga xabar, javobni tozalash.
 */
export type Source = { title: string; url: string; checkedAt: string }
export type Chunk = { id: string; title: string; uz: string; ru: string; sources: Source[] }
export type Lang = 'uz' | 'uz-Cyrl' | 'ru'
export type Msg = { role: 'system' | 'user'; content: string }
export type AskResult = { answer: string; found: boolean; sources: Source[] }

export const MAX_QUESTION = 500
export const DAILY_LIMIT = 20
/** Mehmon (kirmagan): bitta IP'dan kuniga; hamma mehmonlar birga kuniga (pulni himoya qilish). */
export const GUEST_LIMIT = 10
export const GUEST_TOTAL = 300
export const TOP_K = 6

/** Savol: matn, 3..500 belgi. Xato boʻlsa kod qaytaradi. */
export function checkQuestion(q: unknown): { ok: true; q: string } | { ok: false; code: 'empty' | 'long' } {
  if (typeof q !== 'string') return { ok: false, code: 'empty' }
  const s = q.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (s.length < 3) return { ok: false, code: 'empty' }
  if (s.length > MAX_QUESTION) return { ok: false, code: 'long' }
  return { ok: true, q: s }
}

export const asLang = (l: unknown): Lang => (l === 'ru' || l === 'uz-Cyrl' ? l : 'uz')

const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 's', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu',
  я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h'
}
/** Kichik harf, oʻ/gʻ belgilarsiz; oʻzbek kirili lotinga (rus soʻzlari ham — ular ru matn bilan solishtiriladi). */
function words(s: string): string[] {
  const low = s.toLowerCase().replace(/[ʻʼ'`’‘]/g, '')
  const out: string[] = []
  for (const w of low.split(/[^\p{L}\p{N}]+/u)) {
    if (w.length < 3) continue
    out.push(w)
    if (/[а-яёўқғҳ]/.test(w)) out.push([...w].map((c) => CYR[c] ?? c).join(''))
  }
  return out
}
const stem = (w: string) => w.slice(0, 5)
const STOP = new Set(['qanda', 'qanday', 'nima', 'kerak', 'uchun', 'bilan', 'qaysi', 'qancha', 'mumki', 'kak', 'chto', 'kakoi', 'kakie', 'nuzhn', 'как', 'что', 'какой', 'какие', 'нужно', 'для', 'это', 'germa', 'герма'])

/** Kalit soʻz qidiruvi: soʻz oʻzaklari (5 harf) mos kelgan sari ball; sarlavhadagi moslik ikki baravar. */
export function rank(question: string, kb: Chunk[], k = TOP_K): Chunk[] {
  const q = [...new Set(words(question).map(stem))].filter((w) => !STOP.has(w))
  const scored = kb.map((c, i) => {
    const body = new Set(words(`${c.uz} ${c.ru}`).map(stem))
    const title = new Set(words(c.title).map(stem))
    let s = 0
    for (const w of q) s += (body.has(w) ? 1 : 0) + (title.has(w) ? 2 : 0)
    return { c, s, i }
  })
  scored.sort((a, b) => b.s - a.s || a.i - b.i)
  return scored.slice(0, k).map((x) => x.c)
}

const LANG_NAME: Record<Lang, string> = { uz: 'oʻzbek tilida (lotin yozuvi)', 'uz-Cyrl': 'oʻzbek tilida (kirill yozuvi)', ru: 'rus tilida' }

export function buildMessages(question: string, chunks: Chunk[], lang: Lang): Msg[] {
  const ctx = chunks.map((c) => `[${c.id}] ${c.title}\n${lang === 'ru' ? c.ru : c.uz}`).join('\n\n---\n\n')
  const system = [
    'Sen Migra ilovasining maslahatchisisan. Foydalanuvchi — chet elda (hozir Germaniyada) QONUNIY ishlashni xohlagan Oʻzbekiston fuqarosi.',
    'QOIDALAR:',
    '1. Faqat quyidagi TASDIQLANGAN MATNLAR asosida javob ber. Oʻzingdan raqam, muddat, narx, manzil yoki havola qoʻshma.',
    '2. Javob matnlarda boʻlmasa: found=false va qisqa ayt: tasdiqlangan maʼlumot yoʻq, rasmiy manbaga yoki Migratsiya agentligining 1282 ishonch telefoniga murojaat qilsin.',
    '3. Noqonuniy yoʻllarga (soxta hujjat, turist vizasida ishlash, chegarani noqonuniy kesish, pora, hujjatsiz ishlash) hech qachon yordam berma: rad et, xavfini ayt va qonuniy yoʻlni tavsiya qil; found=false.',
    '4. Javob qisqa: 2–6 jumla yoki roʻyxat, oddiy soʻzlar bilan. HTML va markdown sarlavhalar ishlatma.',
    `5. Javobni ${LANG_NAME[lang]} yoz.`,
    '6. Faqat JSON qaytar: {"answer": "...", "found": true|false, "sources": ["foydalanilgan matn id", ...]}. sources — faqat quyidagi [id] lardan.',
    '',
    'TASDIQLANGAN MATNLAR:',
    ctx
  ].join('\n')
  return [
    { role: 'system', content: system },
    { role: 'user', content: question }
  ]
}

/** Javobdagi HTML teglar, boshqaruv belgilari olib tashlanadi; uzunlik chegaralanadi. Ekranda matn sifatida chiqadi. */
export function sanitize(s: string, max = 2000): string {
  return s
    .replace(/<[^>]*>?/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)
}

const NO_INFO: Record<Lang, string> = {
  uz: 'Bu savol boʻyicha tasdiqlangan maʼlumot yoʻq. Rasmiy manbaga yoki Migratsiya agentligining 1282 ishonch telefoniga murojaat qiling.',
  'uz-Cyrl': 'Бу савол бўйича тасдиқланган маълумот йўқ. Расмий манбага ёки Миграция агентлигининг 1282 ишонч телефонига мурожаат қилинг.',
  ru: 'По этому вопросу нет проверенной информации. Обратитесь к официальному источнику или на телефон доверия Агентства миграции 1282.'
}
export const noInfo = (lang: Lang): AskResult => ({ answer: NO_INFO[lang], found: false, sources: [] })

/** Model javobini (JSON) oʻqiydi. Manbasiz "topildi" javobi qabul qilinmaydi. */
export function parseAnswer(raw: string, chunks: Chunk[], lang: Lang): AskResult {
  let j: { answer?: unknown; found?: unknown; sources?: unknown }
  try {
    j = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  } catch {
    return noInfo(lang)
  }
  const answer = typeof j.answer === 'string' ? sanitize(j.answer) : ''
  if (!answer) return noInfo(lang)
  const ids = Array.isArray(j.sources) ? j.sources.filter((x): x is string => typeof x === 'string') : []
  const used = chunks.filter((c) => ids.includes(c.id))
  if (j.found !== true || used.length === 0) return { answer, found: false, sources: [] }
  const seen = new Set<string>()
  const sources = used.flatMap((c) => c.sources).filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)))
  return { answer, found: true, sources }
}
