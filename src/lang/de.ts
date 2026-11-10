import { DIRECTIONS, LESSONS, LEVELS, LEVEL_LOCKED, MODULES, exercisesOf } from '../content/german'
import { GAPS } from '../content/german/gaps'
import { VOCAB } from '../content/german/words'
import { normalizeDe } from '../german/answer'
import type { Course } from './types'

/** Nemis tili kursi: mavjud kontent aynan oʻzgarishsiz (id'lar prefikssiz). */
export const DE_COURSE: Course = {
  id: 'de',
  speechLang: 'de-DE',
  levels: LEVELS.map((id) => ({ id, locked: LEVEL_LOCKED[id] })),
  directions: DIRECTIONS,
  modules: MODULES,
  lessons: LESSONS,
  exercisesOf,
  vocab: VOCAB,
  gaps: GAPS,
  features: { article: true, write: true, build: 'letters' },
  normalize: normalizeDe,
  letterLocale: 'de'
}
