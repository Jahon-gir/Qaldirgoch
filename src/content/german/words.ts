import { exercisesOf, LESSONS } from './index'
import type { L3 } from './types'

/** Lugʻatdagi soʻz: faqat darslardagi "word" mashqlaridan olinadi (yangi soʻz toʻqilmaydi). */
export type VocabWord = { id: string; moduleId: string; lessonId: string; exerciseId: string; de: string; tr: L3 }

/** Barqaror qism: nemischa soʻzdan (umlaut → ae/oe/ue, ß → ss), masalan "Guten Morgen" → "guten-morgen". */
export function wordSlug(de: string): string {
  return de
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Soʻz id: modul + slug, masalan "a1-m1-guten-morgen". Bir marta berilgach oʻzgarmaydi (serverda saqlanadi). */
export const wordId = (moduleId: string, de: string) => `${moduleId}-${wordSlug(de)}`

function build(): VocabWord[] {
  const out: VocabWord[] = []
  const seen = new Set<string>()
  for (const l of [...LESSONS].sort((a, b) => a.moduleId.localeCompare(b.moduleId) || a.order - b.order)) {
    for (const ex of exercisesOf(l.id)) {
      if (ex.type !== 'word') continue
      const id = wordId(l.moduleId, ex.de)
      if (seen.has(id)) continue // bir soʻz ikki darsda boʻlsa — birinchisi
      seen.add(id)
      out.push({ id, moduleId: l.moduleId, lessonId: l.id, exerciseId: ex.id, de: ex.de, tr: ex.tr })
    }
  }
  return out
}

export const VOCAB: VocabWord[] = build()
export const WORD_IDS: ReadonlySet<string> = new Set(VOCAB.map((w) => w.id))
const BY_ID = new Map(VOCAB.map((w) => [w.id, w]))
const BY_EXERCISE = new Map(VOCAB.map((w) => [w.exerciseId, w]))
export const wordById = (id: string) => BY_ID.get(id)
/** Darsdagi word mashqiga mos lugʻat soʻzi. */
export const wordOfExercise = (exerciseId: string) => BY_EXERCISE.get(exerciseId)
/** Dars tugaganda takrorlash qutisiga tushadigan soʻzlar. */
export function wordIdsOfLesson(lessonId: string): string[] {
  const l = LESSONS.find((x) => x.id === lessonId)
  if (!l) return []
  return exercisesOf(l.id).flatMap((ex) => (ex.type === 'word' ? [wordId(l.moduleId, ex.de)] : []))
}
