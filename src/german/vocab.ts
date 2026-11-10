import type { Direction, Lesson, Module } from '../content/german'
import { VOCAB, type VocabWord } from '../content/german/words'
import { DE_COURSE } from '../lang/de'
import type { Course } from '../lang/types'
import type { Lang } from '../i18n/I18nProvider'
import type { VocabFront } from '../profile/questions'
import { lessonsOf, visibleModules, type Results } from './logic'
import { sessionAnswer, sessionCurrent, startSession, type Session } from './srs'

/** Lugʻat ekranidagi "aralash" mashq: dars id oʻrnida. */
export const MIXED = 'aralash'

/** Darsdagi barcha soʻzlar (holatidan qatʼi nazar), dars tartibida. course — standart nemis kursi. */
export function lessonWords(lessonId: string, course: Course = DE_COURSE): VocabWord[] {
  return course.wordIdsOfLesson(lessonId).flatMap((id) => course.wordById(id) ?? [])
}

/** Faqat word mashqi bor darslar (modul testi chiqmaydi). */
export const hasWords = (lessonId: string, course: Course = DE_COURSE) => course.exercisesOf(lessonId).some((e) => e.type === 'word')

/** Dars ochiqmi: oxirigacha tugatilgan (user_lessons da bor). */
export const isUnlocked = (lessonId: string, results: Results) => lessonId in results

export type VocabGroup = { module: Module; lessons: { lesson: Lesson; words: VocabWord[]; unlocked: boolean }[] }

/** Modul → darslar (faqat soʻzi bor darslar; soʻzi yoʻq modul chiqmaydi). */
export function vocabGroups(direction: Direction, results: Results, course: Course = DE_COURSE): VocabGroup[] {
  return visibleModules(direction, course.modules)
    .map((module) => ({
      module,
      lessons: lessonsOf(module.id, course.lessons)
        .filter((l) => hasWords(l.id, course))
        .map((lesson) => ({ lesson, words: lessonWords(lesson.id, course), unlocked: isUnlocked(lesson.id, results) }))
    }))
    .filter((g) => g.lessons.length > 0)
}

/** Ochilgan barcha darslar soʻzlari (bir soʻz ikki marta chiqmaydi). */
export function unlockedWords(groups: VocabGroup[]): VocabWord[] {
  const seen = new Set<string>()
  const out: VocabWord[] = []
  for (const g of groups) for (const l of g.lessons) if (l.unlocked) for (const w of l.words) if (!seen.has(w.id)) (seen.add(w.id), out.push(w))
  return out
}

export const vocabTotal = (groups: VocabGroup[]) => groups.reduce((n, g) => n + g.lessons.reduce((m, l) => m + l.words.length, 0), 0)

export function shuffled<T>(items: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Soʻzning koʻrinadigan matni: nemischa yoki tarjima. */
export const faceText = (w: VocabWord, side: VocabFront, lang: Lang) => (side === 'target' ? w.term : w.tr[lang])

/* ---------- Test variantlari ---------- */

export type VocabOption = { id: string; text: string; correct: boolean }

/**
 * 4 variant: 1 toʻgʻri + 3 notoʻgʻri. Notoʻgʻrilari avval shu darsdan, yetmasa shu moduldan, yana yetmasa boshqa modullardan.
 * Matni (shu tilda) toʻgʻrisi bilan yoki bir-biri bilan bir xil variantlar olinmaydi. Tartib aralash.
 * front = savol tomoni: 'target' — savol oʻrganilayotgan tilda (nemischa), variantlar tarjima; 'tr' — savol tarjima, variantlar nemischa.
 */
export function pickVocabOptions(word: VocabWord, front: VocabFront, lang: Lang, rand: () => number = Math.random, vocab: readonly VocabWord[] = VOCAB, count = 4): VocabOption[] {
  const answerSide: VocabFront = front === 'target' ? 'tr' : 'target'
  const text = (w: VocabWord) => faceText(w, answerSide, lang)
  const used = new Set([text(word)])
  const take = (pool: readonly VocabWord[], need: number) => {
    const out: VocabWord[] = []
    for (const w of shuffled(pool, rand)) {
      if (out.length >= need) break
      if (w.id === word.id || used.has(text(w))) continue
      used.add(text(w))
      out.push(w)
    }
    return out
  }
  const need = count - 1
  const fromLesson = take(vocab.filter((w) => w.lessonId === word.lessonId), need)
  const fromModule = take(vocab.filter((w) => w.moduleId === word.moduleId && w.lessonId !== word.lessonId), need - fromLesson.length)
  const rest = take(vocab.filter((w) => w.moduleId !== word.moduleId), need - fromLesson.length - fromModule.length)
  return shuffled(
    [{ id: word.id, text: text(word), correct: true }, ...[...fromLesson, ...fromModule, ...rest].map((w) => ({ id: w.id, text: text(w), correct: false }))],
    rand
  )
}

/* ---------- Sessiya (Kartochka va Test) ---------- */

/** Lugʻat sessiyasi srs.ts dagi Session bilan bir xil shaklda, lekin xato soʻz FAQAT BIR MARTA oxiriga qaytadi. */
export const startVocabSession = (ids: string[]): Session => startSession(ids)

export function vocabAnswer(s: Session, correct: boolean): Session {
  const id = sessionCurrent(s)
  if (!id) return s
  const firstTime = !(id in s.first)
  const next = sessionAnswer(s, correct)
  // srs.sessionAnswer xatoda har safar qaytaradi; bu yerda faqat birinchi xatoda
  return !correct && !firstTime ? { ...next, queue: s.queue } : next
}

/** Natija: birinchi urinish boʻyicha ("N tadan M tasini bildingiz") va bilmaganlar. */
export function vocabSummary(s: Session) {
  const ids = Object.keys(s.first)
  const wrongIds = ids.filter((id) => !s.first[id])
  return { total: ids.length, known: ids.length - wrongIds.length, wrongIds }
}

/** Lugʻat darsini id boʻyicha topish (mavjud va soʻzi bor boʻlsa). */
export const vocabLesson = (id: string, course: Course = DE_COURSE) => {
  const l = course.lessonById(id)
  return l && hasWords(l.id, course) ? l : undefined
}
