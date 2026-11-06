import { DIRECTIONS, RESULT_IDS, LESSONS, MODULES, type ChoiceExercise, type Direction, type Exercise, type Lesson, type Level, type MatchExercise, type Module } from '../content/german'
import type { Answers } from '../profile/questions'

/* ---------- Yoʻnalish ---------- */

/** Profildagi kasbdan yoʻnalish: elektrik/payvandchi/mexanik → technical; hamshira → care; oshpaz/mehmonxona → hospitality; qolgani → general. */
export function directionFromProfession(profession: Answers['profession'] | undefined): Direction {
  switch (profession) {
    case 'electrician':
    case 'welder':
    case 'mechanic':
      return 'technical'
    case 'nurse':
      return 'care'
    case 'cook':
      return 'hospitality'
    default:
      return 'general'
  }
}

export const isDirection = (v: unknown): v is Direction => typeof v === 'string' && (DIRECTIONS as readonly string[]).includes(v)

/** Qoʻlda tanlangan yoʻnalish ustun; yoʻq boʻlsa kasbdan avtomatik. */
export function effectiveDirection(p: { profession: Answers['profession']; germanDirection?: Direction } | null): Direction {
  return p?.germanDirection ?? directionFromProfession(p?.profession)
}

/* ---------- Kontent tanlash ---------- */

export type Result = { lessonId: string; score: number; total: number; completedAt: string }
export type Results = Record<string, Result>

const LEVEL_ORDER: Record<Level, number> = { A1: 0, A2: 1, B1: 2 }

/** Umumiy modullar hammaga, kasbiy modullar faqat oʻz yoʻnalishiga. Daraja va tartib boʻyicha. */
export function visibleModules(direction: Direction, modules: Module[] = MODULES): Module[] {
  return modules
    .filter((m) => m.direction === 'general' || m.direction === direction)
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.order - b.order)
}

export const lessonsOf = (moduleId: string, lessons: Lesson[] = LESSONS): Lesson[] =>
  lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order)

export function moduleProgress(moduleId: string, results: Results, lessons: Lesson[] = LESSONS) {
  const list = lessonsOf(moduleId, lessons)
  const done = list.filter((l) => l.id in results).length
  return { done, total: list.length, percent: list.length ? Math.round((done / list.length) * 100) : 0 }
}

export function levelProgress(level: Level, direction: Direction, results: Results, modules: Module[] = MODULES, lessons: Lesson[] = LESSONS) {
  let done = 0
  let total = 0
  for (const m of visibleModules(direction, modules).filter((x) => x.level === level)) {
    const p = moduleProgress(m.id, results, lessons)
    done += p.done
    total += p.total
  }
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

/** Koʻrinadigan darslar tartibli roʻyxati (daraja → modul → dars). */
export function visibleLessons(direction: Direction, modules: Module[] = MODULES, lessons: Lesson[] = LESSONS): Lesson[] {
  return visibleModules(direction, modules).flatMap((m) => lessonsOf(m.id, lessons))
}

/** Keyingi tugallanmagan dars ("Davom eting"); hammasi tugagan boʻlsa null. */
export function nextUnfinished(direction: Direction, results: Results, modules: Module[] = MODULES, lessons: Lesson[] = LESSONS): Lesson | null {
  return visibleLessons(direction, modules, lessons).find((l) => !(l.id in results)) ?? null
}

/** Modul ichida joriy dars: birinchi tugallanmagani. */
export const currentInModule = (moduleId: string, results: Results, lessons: Lesson[] = LESSONS): Lesson | null =>
  lessonsOf(moduleId, lessons).find((l) => !(l.id in results)) ?? null

/** Shu darsdan keyingi dars (modul ichida, keyin keyingi modulning birinchisi); oxirgisi boʻlsa null. */
export function nextLessonAfter(lessonId: string, direction: Direction, modules: Module[] = MODULES, lessons: Lesson[] = LESSONS): Lesson | null {
  const list = visibleLessons(direction, modules, lessons)
  const i = list.findIndex((l) => l.id === lessonId)
  return i >= 0 ? (list[i + 1] ?? null) : null
}

/* ---------- Mashq tekshiruvi ---------- */

export const isCorrectOption = (ex: ChoiceExercise, optionId: string): boolean => ex.options.some((o) => o.id === optionId && o.correct)
export const correctOption = (ex: ChoiceExercise) => ex.options.find((o) => o.correct)

/** Juftlash: chapdagi va oʻngdagi element bir juftga tegishlimi. */
export const isMatchingPair = (ex: MatchExercise, leftId: string, rightId: string): boolean => leftId === rightId && ex.pairs.some((p) => p.id === leftId)

/** Tasodifiy emas, mashq id'siga bogʻliq tartib: qayta chizilganda joylar sakramasin. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  const rand = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Match ustunlari: ikkala tomon aralashtirilgan, oʻng ustun chap bilan bir xil tartibda emas. */
export function matchColumns(ex: MatchExercise) {
  const left = seededShuffle(ex.pairs, ex.id + ':L')
  let right = seededShuffle(ex.pairs, ex.id + ':R')
  if (right.length > 1 && right.every((p, i) => p.id === left[i].id)) right = [...right.slice(1), right[0]]
  return { left, right }
}

/* ---------- Ball ---------- */

export type Mistake = { key: string; de: string; tr: ChoiceExercise['translation'] }
/** Bitta qadam natijasi: total — hisoblanadigan birliklar (variant: 1, juftlash: juftlar soni, soʻz: 0). */
export type Outcome = { total: number; correct: number; mistakes: Mistake[] }

export const wordOutcome = (): Outcome => ({ total: 0, correct: 0, mistakes: [] })

export function choiceOutcome(ex: ChoiceExercise, optionId: string): Outcome {
  const ok = isCorrectOption(ex, optionId)
  return { total: 1, correct: ok ? 1 : 0, mistakes: ok ? [] : [{ key: ex.id, de: ex.full, tr: ex.translation }] }
}

/** wrongLeft — xato juftlashda bosilgan chap elementlar id'lari: har biri alohida xato juft. */
export function matchOutcome(ex: MatchExercise, wrongLeft: Iterable<string>): Outcome {
  const wrong = new Set(wrongLeft)
  const mistakes = ex.pairs.filter((p) => wrong.has(p.id)).map<Mistake>((p) => ({ key: p.id, de: p.de, tr: p.tr }))
  return { total: ex.pairs.length, correct: ex.pairs.length - mistakes.length, mistakes }
}

export function summarize(exercises: Exercise[], outcomes: Outcome[]) {
  const seen = new Set<string>()
  const mistakes: Mistake[] = []
  for (const m of outcomes.flatMap((o) => o.mistakes)) {
    if (!seen.has(m.key)) {
      seen.add(m.key)
      mistakes.push(m)
    }
  }
  return {
    score: outcomes.reduce((s, o) => s + o.correct, 0),
    total: outcomes.reduce((s, o) => s + o.total, 0),
    newWords: exercises.filter((e) => e.type === 'word').length,
    mistakes
  }
}

/* ---------- Natijalarni saqlash va birlashtirish ---------- */

/** Tashqaridan (localStorage/server) kelgan qiymatni tozalaydi: maʼlum dars yoki test, butun ball, yaroqli sana. */
export function sanitizeResults(raw: unknown, known: ReadonlySet<string> = RESULT_IDS): Results {
  const out: Results = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!known.has(id) || !v || typeof v !== 'object') continue
    const r = v as Record<string, unknown>
    const { score, total, completedAt } = r
    if (Number.isInteger(score) && Number.isInteger(total) && (score as number) >= 0 && (total as number) > 0 && (score as number) <= (total as number) && typeof completedAt === 'string' && !Number.isNaN(Date.parse(completedAt))) {
      out[id] = { lessonId: id, score: score as number, total: total as number, completedAt }
    }
  }
  return out
}

/** Ikki natijadan yuqorisi (ulush boʻyicha). Teng boʻlsa — avval tugatilgani. */
export function pickBetter(a: Result, b: Result): Result {
  const diff = a.score * b.total - b.score * a.total // a/total_a - b/total_b ishorasi
  if (diff > 0) return a
  if (diff < 0) return b
  return Date.parse(a.completedAt) <= Date.parse(b.completedAt) ? a : b
}

/** Dars topshirildi: mavjud natija bilan solishtirib eng yuqorisi qoladi. */
export function recordResult(results: Results, incoming: Result): Results {
  const cur = results[incoming.lessonId]
  const best = cur ? pickBetter(cur, incoming) : incoming
  return best === cur ? results : { ...results, [incoming.lessonId]: best }
}

/** Mehmon va akkaunt natijalari: har dars boʻyicha yuqori ball, dialogsiz. */
export function mergeResults(a: Results, b: Results): Results {
  let out = a
  for (const r of Object.values(b)) out = recordResult(out, r)
  return out
}

const same = (a: Result | undefined, b: Result) => !!a && a.score === b.score && a.total === b.total && a.completedAt === b.completedAt

/** Serverga yuboriladiganlar (oflayn navbat): birlashtirilgan natijalardan serverda yoʻq yoki boshqacha boʻlganlari. */
export function resultsToPush(merged: Results, server: Results): Result[] {
  return Object.values(merged).filter((r) => !same(server[r.lessonId], r))
}
