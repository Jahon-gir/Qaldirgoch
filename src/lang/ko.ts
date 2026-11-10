import { KO_LESSONS, KO_LEVELS, KO_MODULES, koExercisesOf } from '../content/korean'
import { normalizeKo } from '../german/answer'
import { makeCourse } from './course'
import { buildVocab } from './words'

/** Koreys tili kursi: Hangul (1-modul), TOPIK 1 (darslar keyin). Yoʻnalish yoʻq, yozish va artikl yoʻq, yigʻish — boʻgʻinlardan. */
export const KO_COURSE = makeCourse({
  id: 'ko',
  flag: 'kr',
  speechLang: 'ko-KR',
  levels: KO_LEVELS,
  modules: KO_MODULES,
  lessons: KO_LESSONS,
  exercisesOf: koExercisesOf,
  vocab: buildVocab({ lessons: KO_LESSONS, exercisesOf: koExercisesOf }),
  gaps: [],
  features: { article: false, write: false, build: 'syllables', pron: true },
  normalize: normalizeKo,
  letterLocale: 'ko'
})
