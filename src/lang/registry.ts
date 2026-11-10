import { DE_COURSE } from './de'
import { KO_COURSE } from './ko'
import type { Course, CourseId } from './types'

/** Reyestrdagi kurslar. */
export const COURSES: readonly Course[] = [DE_COURSE, KO_COURSE]

/** Kurs (reyestrda boʻlmasa — standart nemis kursi). */
export const courseOf = (id: CourseId): Course => COURSES.find((c) => c.id === id) ?? DE_COURSE

/** Id prefiksi boʻyicha kurs: "ko-" — 'ko', aks holda (prefikssiz) — 'de'. */
const byPrefix = (id: string): CourseId => (id.startsWith('ko-') ? 'ko' : 'de')
/** Dars id'si ("ko-h-m1-l1") yoki test natijasi id'si ("test:ko-t1-m1", "test:level-ko-T1"). */
export const courseIdOfLesson = (lessonId: string): CourseId => byPrefix(lessonId.replace(/^test:(level-)?/, ''))
export const courseIdOfWord = (wordId: string): CourseId => byPrefix(wordId)

/** Yakuniy test natijasi id'si: "test:<modul id>" yoki "test:level-<daraja id>". */
export const testResultId = (scope: string) => `test:${scope}`

/** Kursning saqlanadigan natija id'lari: darslar + modul testlari + daraja testlari. */
export function resultIdsOf(c: Pick<Course, 'lessons' | 'modules' | 'levels'>): string[] {
  return [...c.lessons.map((l) => l.id), ...c.modules.map((m) => testResultId(m.id)), ...c.levels.map((lv) => testResultId(`level-${lv.id}`))]
}
export const wordIdsOf = (c: Pick<Course, 'vocab'>): string[] => c.vocab.map((w) => w.id)

/** Bir nechta kurs id'lari birlashmasi (sanitize va record tekshiruvi uchun; testda soxta kurs bilan ham chaqiriladi). */
export const unionResultIds = (courses: readonly Pick<Course, 'lessons' | 'modules' | 'levels'>[]): ReadonlySet<string> => new Set(courses.flatMap(resultIdsOf))
export const unionWordIds = (courses: readonly Pick<Course, 'vocab'>[]): ReadonlySet<string> => new Set(courses.flatMap(wordIdsOf))

/** Reyestrdagi BARCHA kurslarning natija va soʻz id'lari: bitta kursga "qulflanmagan". */
export const ALL_RESULT_IDS: ReadonlySet<string> = unionResultIds(COURSES)
export const ALL_WORD_IDS: ReadonlySet<string> = unionWordIds(COURSES)
