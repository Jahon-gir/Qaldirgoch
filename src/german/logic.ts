import { LESSONS, MODULES, type ChoiceExercise, type DialogExercise, type Direction, type Exercise, type Lesson, type MatchExercise, type Module, type SyllableExercise } from '../content/german'
import { COURSES } from '../lang/registry'
import type { Results } from './results'

/* Yoʻnalish (direction.ts) va natijalar (results.ts) yengil modullarda — ilova ishga tushganda butun kurs kerak boʻlmasin (0.28.0). */
export * from './direction'
export * from './results'

/* ---------- Kontent tanlash ---------- */

/** Daraja tartibi (kurs ichidagi oʻrni: A1 < A2 < B1, ko-H < ko-T1 < ko-T2); notanish daraja id'si — oxirida. */
const LEVEL_ORDER: Record<string, number> = Object.fromEntries(COURSES.flatMap((c) => c.levels.map((lv, i) => [lv.id, i])))
const levelOrder = (level: string) => LEVEL_ORDER[level] ?? Number.MAX_SAFE_INTEGER

/** Umumiy modullar hammaga, kasbiy modullar faqat oʻz yoʻnalishiga. Daraja va tartib boʻyicha. */
export function visibleModules(direction: Direction, modules: readonly Module[] = MODULES): Module[] {
  return modules
    .filter((m) => m.direction === 'general' || m.direction === direction)
    .sort((a, b) => levelOrder(a.level) - levelOrder(b.level) || a.order - b.order)
}

/**
 * Modulning ekrandagi raqami: shu guruhdagi (umumiy yoki shu kasb), shu darajadagi modullar ichidagi oʻrni (1 dan).
 * order emas — kasbiy paket modullarining order'i katta (101, 201 ...), ekranda esa 1, 2, 3 ... chiqishi kerak.
 */
export function moduleNumber(moduleId: string, _direction: Direction, modules: readonly Module[] = MODULES): number {
  const m = modules.find((x) => x.id === moduleId)
  if (!m) return 0
  return visibleModules(m.direction, modules).filter((x) => x.level === m.level && x.direction === m.direction).findIndex((x) => x.id === moduleId) + 1
}

export const lessonsOf = (moduleId: string, lessons: readonly Lesson[] = LESSONS): Lesson[] =>
  lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order)

export function moduleProgress(moduleId: string, results: Results, lessons: readonly Lesson[] = LESSONS) {
  const list = lessonsOf(moduleId, lessons)
  const done = list.filter((l) => l.id in results).length
  return { done, total: list.length, percent: list.length ? Math.round((done / list.length) * 100) : 0 }
}

/** level — daraja id'si (string: nemischa "A1", boshqa kurslar "ko-T1"). */
export function levelProgress(level: string, direction: Direction, results: Results, modules: readonly Module[] = MODULES, lessons: readonly Lesson[] = LESSONS) {
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
export function visibleLessons(direction: Direction, modules: readonly Module[] = MODULES, lessons: readonly Lesson[] = LESSONS): Lesson[] {
  return visibleModules(direction, modules).flatMap((m) => lessonsOf(m.id, lessons))
}

/** Keyingi tugallanmagan dars ("Davom eting"); hammasi tugagan boʻlsa null. */
export function nextUnfinished(direction: Direction, results: Results, modules: readonly Module[] = MODULES, lessons: readonly Lesson[] = LESSONS): Lesson | null {
  return visibleLessons(direction, modules, lessons).find((l) => !(l.id in results)) ?? null
}

/** Modul ichida joriy dars: birinchi tugallanmagani. */
export const currentInModule = (moduleId: string, results: Results, lessons: readonly Lesson[] = LESSONS): Lesson | null =>
  lessonsOf(moduleId, lessons).find((l) => !(l.id in results)) ?? null

/** Shu darsdan keyingi dars (modul ichida, keyin keyingi modulning birinchisi); oxirgisi boʻlsa null. */
export function nextLessonAfter(lessonId: string, direction: Direction, modules: readonly Module[] = MODULES, lessons: readonly Lesson[] = LESSONS): Lesson | null {
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

/** Dialog: savoli boʻlmasa ball yoʻq (soʻz kartasi kabi); boʻlsa — 1 ball. Xato: savol va toʻgʻri javob birga (xatolar roʻyxati uchun). */
export function dialogOutcome(ex: DialogExercise, picked?: number): Outcome {
  if (!ex.check) return { total: 0, correct: 0, mistakes: [] }
  const ok = picked === ex.check.answer
  const q = ex.lines[ex.check.ask]
  const a = ex.lines[ex.check.answer]
  const tr = (Object.keys(q.tr) as (keyof typeof q.tr)[]).reduce((o, k) => ({ ...o, [k]: `${q.tr[k]} — ${a.tr[k]}` }), {} as typeof q.tr)
  return { total: 1, correct: ok ? 1 : 0, mistakes: ok ? [] : [{ key: ex.id, de: `${q.text} — ${a.text}`, tr }] }
}

export function choiceOutcome(ex: ChoiceExercise, optionId: string): Outcome {
  const ok = isCorrectOption(ex, optionId)
  return { total: 1, correct: ok ? 1 : 0, mistakes: ok ? [] : [{ key: ex.id, de: ex.full, tr: ex.translation }] }
}

/** wrongLeft — xato juftlashda bosilgan chap elementlar id'lari: har biri alohida xato juft. */
export function matchOutcome(ex: MatchExercise, wrongLeft: Iterable<string>): Outcome {
  const wrong = new Set(wrongLeft)
  const mistakes = ex.pairs.filter((p) => wrong.has(p.id)).map<Mistake>((p) => ({ key: p.id, de: p.term, tr: p.tr }))
  return { total: ex.pairs.length, correct: ex.pairs.length - mistakes.length, mistakes }
}

/** Boʻgʻin yigʻish: 1 birlik; xato boʻlsa toʻgʻri boʻgʻin va oʻqilishi xatolar roʻyxatiga. */
export function syllableOutcome(ex: SyllableExercise, target: string, ok: boolean): Outcome {
  return { total: 1, correct: ok ? 1 : 0, mistakes: ok ? [] : [{ key: ex.id, de: target, tr: ex.pron }] }
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

