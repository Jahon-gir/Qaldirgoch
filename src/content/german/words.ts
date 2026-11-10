import { buildVocab, lessonWordIds, wordId, wordSlug } from '../../lang/words'
import type { VocabWord } from '../../lang/types'
import { exercisesOf, LESSONS } from './index'

export type { VocabWord }
export { wordId, wordSlug }

/** Nemis tili lugʻati: faqat darslardagi "word" mashqlaridan (yangi soʻz toʻqilmaydi). Id'lar prefikssiz ("a1-m1-guten-morgen"). */
export const VOCAB: VocabWord[] = buildVocab({ lessons: LESSONS, exercisesOf })
export const WORD_IDS: ReadonlySet<string> = new Set(VOCAB.map((w) => w.id))
const BY_ID = new Map(VOCAB.map((w) => [w.id, w]))
const BY_EXERCISE = new Map(VOCAB.map((w) => [w.exerciseId, w]))
export const wordById = (id: string) => BY_ID.get(id)
/** Darsdagi word mashqiga mos lugʻat soʻzi. */
export const wordOfExercise = (exerciseId: string) => BY_EXERCISE.get(exerciseId)
/** Dars tugaganda takrorlash qutisiga tushadigan soʻzlar. */
export const wordIdsOfLesson = (lessonId: string): string[] => lessonWordIds({ lessons: LESSONS, exercisesOf }, lessonId)
