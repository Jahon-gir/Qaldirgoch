import { DE_COURSE } from './de'
import { KO_COURSE } from './ko'
import { testResultId } from './courseIds'
import type { Course, CourseId } from './types'

/** Reyestrdagi kurslar. */
export const COURSES: readonly Course[] = [DE_COURSE, KO_COURSE]

/** Kurs (reyestrda boʻlmasa — standart nemis kursi). */
export const courseOf = (id: CourseId): Course => COURSES.find((c) => c.id === id) ?? DE_COURSE

export { courseIdOfLesson, courseIdOfWord, testResultId } from './courseIds'

type ResultSource = Pick<Course, 'lessons' | 'modules' | 'levels'> & Partial<Pick<Course, 'directions'>>

/** Kursning saqlanadigan natija id'lari: darslar + modul testlari + daraja testlari + soha testlari ("test:field-care"). */
export function resultIdsOf(c: ResultSource): string[] {
  const fields = (c.directions ?? []).filter((d) => d !== 'general').map((d) => testResultId(`field-${d}`))
  return [...c.lessons.map((l) => l.id), ...c.modules.map((m) => testResultId(m.id)), ...c.levels.map((lv) => testResultId(`level-${lv.id}`)), ...fields]
}
export const wordIdsOf = (c: Pick<Course, 'vocab'>): string[] => c.vocab.map((w) => w.id)

/** Bir nechta kurs id'lari birlashmasi (sanitize va record tekshiruvi uchun; testda soxta kurs bilan ham chaqiriladi). */
export const unionResultIds = (courses: readonly ResultSource[]): ReadonlySet<string> => new Set(courses.flatMap(resultIdsOf))
export const unionWordIds = (courses: readonly Pick<Course, 'vocab'>[]): ReadonlySet<string> => new Set(courses.flatMap(wordIdsOf))

/**
 * Reyestrdagi BARCHA kurslarning natija va soʻz id'lari: bitta kursga "qulflanmagan".
 * Ilova ishga tushganda (provayderlar) bularning nusxasi — `ids.ts` (ids.gen.json) ishlatiladi; ids.test.ts ular tengligini tekshiradi.
 */
export const ALL_RESULT_IDS: ReadonlySet<string> = unionResultIds(COURSES)
export const ALL_WORD_IDS: ReadonlySet<string> = unionWordIds(COURSES)
