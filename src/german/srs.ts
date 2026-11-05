import type { Lang } from '../i18n/I18nProvider'
import type { VocabWord } from '../content/german/words'

/* ---------- Kunlar (foydalanuvchining mahalliy kuni) ---------- */

/** Kun: "YYYY-MM-DD", foydalanuvchining mahalliy vaqti boʻyicha (UTC emas). */
export type Day = string

const pad = (n: number) => String(n).padStart(2, '0')

/** Mahalliy kun. toISOString() UTC beradi va Toshkentda tun yarmidan keyin kechagi kunni koʻrsatadi — shuning uchun ishlatilmaydi. */
export function localDay(d: Date = new Date()): Day {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const isDay = (v: unknown): v is Day => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && localDayValid(v)
function localDayValid(v: string) {
  const [y, m, d] = v.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

/** Kunga n kun qoʻshish. Kalendar hisobi UTC'da: yozgi/qishki vaqt oʻtishi kunni surib yubormaydi. */
export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** a dan b gacha necha kun (b − a). */
export function daysBetween(a: Day, b: Day): number {
  const ms = (s: Day) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((ms(b) - ms(a)) / 86400000)
}

/* ---------- Oraliqli takrorlash ---------- */

export const INTERVALS = [1, 3, 7, 14, 30] as const
export const STRONG_FROM = 14

/** Soʻz holati. interval — kun; xatolar — jami xato javoblar. */
export type WordState = { due: Day; interval: number; mistakes: number; updatedAt: string }
export type Words = Record<string, WordState>
export type WordStatus = 'new' | 'learning' | 'strong'

/** Yangi soʻz ertasiga keladi. */
export const newWordState = (today: Day, nowIso: string): WordState => ({ due: addDays(today, 1), interval: INTERVALS[0], mistakes: 0, updatedAt: nowIso })

/** Qutiga yangi soʻzlar (bor boʻlsa — tegilmaydi). Oʻzgarmasa oʻsha obyekt qaytadi. */
export function addNewWords(words: Words, ids: Iterable<string>, today: Day, nowIso: string, known?: ReadonlySet<string>): Words {
  let out = words
  for (const id of ids) {
    if (out[id] || (known && !known.has(id))) continue
    if (out === words) out = { ...words }
    out[id] = newWordState(today, nowIso)
  }
  return out
}

/** Keyingi oraliq: 1 → 3 → 7 → 14 → 30 → 30. */
export function nextInterval(interval: number): number {
  return INTERVALS.find((i) => i > interval) ?? INTERVALS[INTERVALS.length - 1]
}

/** Javob: toʻgʻri — keyingi oraliq; xato — 1-oraliqqa qaytadi, xatolar +1. */
export function answerWord(s: WordState, correct: boolean, today: Day, nowIso: string): WordState {
  if (correct) {
    const interval = nextInterval(s.interval)
    return { due: addDays(today, interval), interval, mistakes: s.mistakes, updatedAt: nowIso }
  }
  return { due: addDays(today, INTERVALS[0]), interval: INTERVALS[0], mistakes: s.mistakes + 1, updatedAt: nowIso }
}

/**
 * Holat: Yangi — hali takrorlanmagan (1-oraliq va xatosiz; toʻgʻri javobdan keyin oraliq 3 ga oʻtadi, xatodan keyin xato > 0);
 * Mustahkam — oraliq ≥ 14; qolgani — Oʻrganilmoqda.
 */
export function wordStatus(s: WordState): WordStatus {
  if (s.interval >= STRONG_FROM) return 'strong'
  if (s.interval <= INTERVALS[0] && s.mistakes === 0) return 'new'
  return 'learning'
}

export function statusCounts(words: Words) {
  const c = { new: 0, learning: 0, strong: 0, total: 0 }
  for (const s of Object.values(words)) {
    c[wordStatus(s)]++
    c.total++
  }
  return c
}

/** Bugun (yoki oʻtib ketgan) takrorlanadiganlar: avval eng eskisi. */
export function dueWordIds(words: Words, today: Day): string[] {
  return Object.entries(words)
    .filter(([, s]) => s.due <= today)
    .sort(([a, x], [b, y]) => (x.due < y.due ? -1 : x.due > y.due ? 1 : a < b ? -1 : 1))
    .map(([id]) => id)
}

/** Bugundan keyingi eng yaqin takrorlash kuni (yoʻq boʻlsa null). */
export function nextDueDay(words: Words, today: Day): Day | null {
  let best: Day | null = null
  for (const s of Object.values(words)) if (s.due > today && (!best || s.due < best)) best = s.due
  return best
}

/* ---------- Variantlar ---------- */

export type ReviewOption = { id: string; text: string; correct: boolean }

function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 4 variant: 1 toʻgʻri + 3 notoʻgʻri. Notoʻgʻrilari imkon boʻlsa shu moduldan, yetmasa boshqa modullardan.
 * Matni (shu tilda) toʻgʻrisi bilan yoki bir-biri bilan bir xil soʻzlar olinmaydi. Tartib aralash.
 */
export function pickOptions(word: VocabWord, vocab: readonly VocabWord[], lang: Lang, rand: () => number = Math.random, count = 4): ReviewOption[] {
  const used = new Set([word.tr[lang]])
  const take = (pool: readonly VocabWord[], need: number) => {
    const out: VocabWord[] = []
    for (const w of shuffle(pool, rand)) {
      if (out.length >= need) break
      if (w.id === word.id || used.has(w.tr[lang])) continue
      used.add(w.tr[lang])
      out.push(w)
    }
    return out
  }
  const same = take(vocab.filter((w) => w.moduleId === word.moduleId), count - 1)
  const other = take(vocab.filter((w) => w.moduleId !== word.moduleId), count - 1 - same.length)
  const options: ReviewOption[] = [{ id: word.id, text: word.tr[lang], correct: true }, ...[...same, ...other].map((w) => ({ id: w.id, text: w.tr[lang], correct: false }))]
  return shuffle(options, rand)
}

/* ---------- Sessiya ---------- */

/** Navbat: xato javob berilgan soʻz oxiriga yana qoʻshiladi. first — har soʻzning birinchi javobi (natija va jadval shu boʻyicha). */
export type Session = { queue: string[]; pos: number; first: Record<string, boolean> }

export const startSession = (ids: string[]): Session => ({ queue: [...ids], pos: 0, first: {} })

export const sessionCurrent = (s: Session): string | null => s.queue[s.pos] ?? null
export const sessionDone = (s: Session) => s.pos >= s.queue.length
/** Shu javob soʻzning sessiyadagi birinchi javobimi (jadval faqat birinchisida oʻzgaradi). */
export const isFirstAttempt = (s: Session, id: string) => !(id in s.first)

export function sessionAnswer(s: Session, correct: boolean): Session {
  const id = sessionCurrent(s)
  if (!id) return s
  return {
    queue: correct ? s.queue : [...s.queue, id],
    pos: s.pos + 1,
    first: id in s.first ? s.first : { ...s.first, [id]: correct }
  }
}

export function sessionSummary(s: Session) {
  const ids = Object.keys(s.first)
  const wrong = ids.filter((id) => !s.first[id])
  return { reviewed: ids.length, correct: ids.length - wrong.length, wrongIds: wrong }
}

/* ---------- Saqlash va birlashtirish ---------- */

/** Tashqaridan (localStorage/server) kelgan qiymat: maʼlum soʻz, yaroqli kun, musbat oraliq. */
export function sanitizeWords(raw: unknown, known?: ReadonlySet<string>): Words {
  const out: Words = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if ((known && !known.has(id)) || !v || typeof v !== 'object') continue
    const { due, interval, mistakes, updatedAt } = v as Record<string, unknown>
    if (!isDay(due) || !Number.isInteger(interval) || (interval as number) < 1 || (interval as number) > 365 || !Number.isInteger(mistakes) || (mistakes as number) < 0) continue
    const at = typeof updatedAt === 'string' && !Number.isNaN(Date.parse(updatedAt)) ? updatedAt : new Date(0).toISOString()
    out[id] = { due, interval: interval as number, mistakes: mistakes as number, updatedAt: at }
  }
  return out
}

const time = (s: WordState) => Date.parse(s.updatedAt)

/**
 * Ikki nusxa birlashtiriladi.
 * - migrate (mehmon akkauntga birinchi kirganda): keyinroq `due` yutadi, teng boʻlsa yangiroq updatedAt.
 * - sync (keyingi sinxronlar): yangiroq updatedAt yutadi — xato javob (muddat yaqinlashadi) yoʻqolib qolmasin.
 */
export function pickWord(a: WordState, b: WordState, mode: 'migrate' | 'sync'): WordState {
  if (mode === 'migrate' && a.due !== b.due) return a.due > b.due ? a : b
  if (time(a) !== time(b)) return time(a) > time(b) ? a : b
  if (a.due !== b.due) return a.due > b.due ? a : b
  return a.mistakes >= b.mistakes ? a : b
}

export function mergeWords(local: Words, server: Words, mode: 'migrate' | 'sync'): Words {
  const out: Words = { ...local }
  for (const [id, s] of Object.entries(server)) out[id] = out[id] ? pickWord(out[id], s, mode) : s
  return out
}

const sameWord = (a: WordState | undefined, b: WordState) => !!a && a.due === b.due && a.interval === b.interval && a.mistakes === b.mistakes && time(a) === time(b)

/** Serverga yuboriladiganlar (oflayn navbat): serverda yoʻq yoki boshqacha boʻlganlari. */
export function wordsToPush(merged: Words, server: Words): [string, WordState][] {
  return Object.entries(merged).filter(([id, s]) => !sameWord(server[id], s))
}
