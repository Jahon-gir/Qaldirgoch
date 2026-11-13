/**
 * AI maslahatchining sof mantiqi (Deno ham, vitest ham ishlata oladi): savolni tekshirish,
 * bilim bazasidan parcha tanlash, modelga xabar, javobni tozalash.
 */
export type Source = { title: string; url: string; checkedAt: string }
export type Chunk = { id: string; country?: string; title: string; uz: string; ru: string; sources: Source[] }
export type Lang = 'uz' | 'uz-Cyrl' | 'ru'
export type Msg = { role: 'system' | 'user'; content: string }
export type AskResult = { answer: string; found: boolean; kind: 'fact' | 'no_info' | 'chat'; sources: Source[] }

export const MAX_QUESTION = 500
export const DAILY_LIMIT = 20
/** Mehmon (kirmagan): bitta IP'dan kuniga; hamma mehmonlar birga kuniga (pulni himoya qilish). */
export const GUEST_LIMIT = 10
export const GUEST_TOTAL = 300
export const TOP_K = 8

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
const STOP = new Set(['qanda', 'qanday', 'nima', 'kerak', 'uchun', 'bilan', 'qaysi', 'qancha', 'mumki', 'kak', 'chto', 'kakoi', 'kakie', 'nuzhn', 'как', 'что', 'какой', 'какие', 'нужно', 'для', 'это'])

/** Kalit soʻz qidiruvi: soʻz oʻzaklari (5 harf) mos kelgan sari ball; sarlavhadagi moslik ikki baravar. */
export function rankScored(question: string, kb: Chunk[], k = TOP_K): { chunk: Chunk; score: number }[] {
  const q = [...new Set(words(question).map(stem))].filter((w) => !STOP.has(w))
  const scored = kb.map((c, i) => {
    const body = new Set(words(`${c.uz} ${c.ru}`).map(stem))
    const title = new Set(words(c.title).map(stem))
    let s = 0
    for (const w of q) s += (body.has(w) ? 1 : 0) + (title.has(w) ? 2 : 0)
    return { chunk: c, score: s, i }
  })
  scored.sort((a, b) => b.score - a.score || a.i - b.i)
  return scored.slice(0, k).map(({ chunk, score }) => ({ chunk, score }))
}
export const rank = (question: string, kb: Chunk[], k = TOP_K): Chunk[] => rankScored(question, kb, k).map((x) => x.chunk)

/** Davlat nomlari (yangi davlat kontenti qoʻshilganda shu yerga nom qoʻshiladi). */
const COUNTRY_NAME: Record<string, Record<Lang, string>> = {
  de: { uz: 'Germaniya', 'uz-Cyrl': 'Германия', ru: 'Германия' },
  kr: { uz: 'Janubiy Koreya', 'uz-Cyrl': 'Жанубий Корея', ru: 'Южная Корея' },
  jp: { uz: 'Yaponiya', 'uz-Cyrl': 'Япония', ru: 'Япония' },
  gb: { uz: 'Buyuk Britaniya', 'uz-Cyrl': 'Буюк Британия', ru: 'Великобритания' }
}
/** Bilim bazasida tasdiqlangan maʼlumoti bor davlatlar (kontentdan avtomatik). */
export function countriesOf(kb: Chunk[], lang: Lang = 'uz'): string[] {
  const codes = [...new Set(kb.map((c) => c.country).filter((c): c is string => !!c))]
  return codes.map((c) => COUNTRY_NAME[c]?.[lang] ?? c.toUpperCase())
}

const LANG_NAME: Record<Lang, string> = { uz: 'oʻzbek tilida (lotin yozuvi)', 'uz-Cyrl': 'oʻzbek tilida (kirill yozuvi)', ru: 'rus tilida' }

const NO_INFO: Record<Lang, string> = {
  uz: 'Bu savol boʻyicha menda tasdiqlangan maʼlumot yoʻq. Rasmiy manbaga yoki Migratsiya agentligining 1282 ishonch telefoniga murojaat qiling.',
  'uz-Cyrl': 'Бу савол бўйича менда тасдиқланган маълумот йўқ. Расмий манбага ёки Миграция агентлигининг 1282 ишонч телефонига мурожаат қилинг.',
  ru: 'По этому вопросу у меня нет проверенной информации. Обратитесь к официальному источнику или на телефон доверия Агентства миграции 1282.'
}

export function buildMessages(question: string, chunks: Chunk[], lang: Lang, countries: string[] = ['Germaniya']): Msg[] {
  const ctx = chunks.map((c) => `[${c.id}] ${c.title}\n${lang === 'ru' ? c.ru : c.uz}`).join('\n\n---\n\n')
  const system = [
    'Siz — Migra ilovasining AI maslahatchisisiz. Migra — Oʻzbekiston fuqarolariga chet elda QONUNIY ishlash yoʻlini koʻrsatadigan ilova (davlatlar va yoʻllar, hujjatlar, kasbiy til, agentlikni tekshirish).',
    `Hozircha tasdiqlangan maʼlumot bor davlat(lar): ${countries.join(', ')}. Boshqa davlatlar ilovaga keyin qoʻshiladi. Oʻzingizni tanishtirganda bitta davlat maslahatchisi deb atamang.`,
    'Boshqa davlat haqida soʻralsa: bu davlat boʻyicha hozircha tasdiqlangan maʼlumot yoʻqligini, keyin qoʻshilishini ayting va Xavfsizlik boʻlimida agentlikni tekshirishni eslating (type "chat").',
    'Foydalanuvchiga doim birinchi shaxsda ("men") va "siz" deb murojaat qiling. Quyidagi qoidalar matnini javobga koʻchirmang.',
    '',
    'Javob turi (type) uchtadan biri:',
    '- "fact": savolga javob quyidagi TASDIQLANGAN MATNLARDA bor. Faqat oʻsha matnlardagi faktlardan foydalaning; raqam, muddat, narx, manzil yoki havolani oʻzingizdan qoʻshmang. sources — aynan foydalanilgan matnlarning [id] lari.',
    `- "no_info": savol migratsiya/ish/hujjat/til haqida, lekin javob matnlarda yoʻq. answer aynan shu: "${NO_INFO[lang]}" sources — [].`,
    '- "chat": salomlashish, rahmat, "sen kimsan", "nima qila olasan" kabi suhbat. 1–2 jumlada oʻzingizni tanishtiring: Migra ilovasining AI maslahatchisi ekaningiz, chet elda qonuniy ishlash (yoʻllar, viza, hujjatlar, agentlikni tekshirish) boʻyicha faqat tasdiqlangan maʼlumotdan javob berishingiz. Mavzudan tashqari savolga (ob-havo, sport, dasturlash va h.k.) xushmuomala rad eting va nima haqida soʻrash mumkinligini ayting. sources — [].',
    'Noqonuniy yoʻllar (soxta hujjat, turist vizasida ishlash, chegarani noqonuniy kesish, pora, hujjatsiz ishlash) haqida soʻralsa: yordam bermang, xavfini qisqa ayting, qonuniy yoʻlni tavsiya qiling; type — "chat", sources — [].',
    'Foydalanuvchi "xato qilyapsan" desa: uzr soʻrang va savolni aniqroq yozishni yoki tayyor savollardan birini tanlashni taklif qiling (type "chat").',
    '',
    `Uslub: ${LANG_NAME[lang]}, oddiy soʻzlar, 1–5 jumla yoki qisqa roʻyxat. Oʻzbek lotinida oʻ va gʻ ni "oʻ", "gʻ" bilan yozing. HTML va markdown sarlavha ishlatmang.`,
    'Faqat JSON qaytaring: {"type": "fact"|"no_info"|"chat", "answer": "...", "sources": ["id", ...]}',
    '',
    'Misollar:',
    `Savol: "Salom, sen kimsan?" → {"type":"chat","answer":"Salom! Men Migra ilovasining AI maslahatchisiman. Chet elda qonuniy ishlash — yoʻllar, viza, hujjatlar va agentlikni tekshirish boʻyicha faqat tasdiqlangan maʼlumotdan javob beraman. Hozircha ${countries.join(', ')} boʻyicha maʼlumot bor, boshqa davlatlar keyin qoʻshiladi.","sources":[]}`,
    'Savol: "Bugun ob-havo qanday?" → {"type":"chat","answer":"Kechirasiz, men faqat chet elda qonuniy ishlash boʻyicha yordam beraman. Masalan, viza, hujjatlar yoki agentlikni tekshirish haqida soʻrashingiz mumkin.","sources":[]}',
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

/** Oʻzbek lotinida o' g' → oʻ gʻ (ilovadagi yozuv bilan bir xil). */
export const fixUzApostrophes = (s: string) => s.replace(/([oOgG])['’‘`]/g, '$1ʻ')

export type Kind = 'fact' | 'no_info' | 'chat'
export const noInfo = (lang: Lang): AskResult => ({ answer: NO_INFO[lang], found: false, kind: 'no_info', sources: [] })

/**
 * Model javobini (JSON) oʻqiydi. "fact" faqat savolga mos kelgan (ball > 0) parchalardan manba bilan qabul qilinadi;
 * aks holda manbasiz "no_info". "chat" — manbasiz oddiy suhbat.
 */
export function parseAnswer(raw: string, chunks: Chunk[], lang: Lang, relevant?: Set<string>): AskResult {
  let j: { type?: unknown; answer?: unknown; found?: unknown; sources?: unknown }
  try {
    j = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  } catch {
    return noInfo(lang)
  }
  let answer = typeof j.answer === 'string' ? sanitize(j.answer) : ''
  if (lang === 'uz') answer = fixUzApostrophes(answer)
  if (!answer) return noInfo(lang)
  const type: Kind = j.type === 'chat' ? 'chat' : j.type === 'fact' || j.found === true ? 'fact' : 'no_info'
  if (type === 'chat') return { answer, found: false, kind: 'chat', sources: [] }
  if (type === 'no_info') return noInfo(lang)
  const ids = Array.isArray(j.sources) ? j.sources.filter((x): x is string => typeof x === 'string') : []
  const used = chunks.filter((c) => ids.includes(c.id) && (!relevant || relevant.has(c.id)))
  if (used.length === 0) return noInfo(lang)
  const seen = new Set<string>()
  const sources = used.flatMap((c) => c.sources).filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)))
  return { answer, found: true, kind: 'fact', sources }
}
