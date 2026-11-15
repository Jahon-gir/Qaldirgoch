import type { CourseId } from './types'

/* Id'dan kursni aniqlash — sof funksiyalar (kurs kontentini yuklamaydi; registry.ts ham shulardan foydalanadi). */

/** Id prefiksi boʻyicha kurs: "ko-" — 'ko', aks holda (prefikssiz) — 'de'. */
const byPrefix = (id: string): CourseId => (id.startsWith('ko-') ? 'ko' : 'de')
/** Dars id'si ("ko-h-m1-l1") yoki test natijasi id'si ("test:ko-t1-m1", "test:level-ko-T1"; soha testi "test:field-care" — nemischa). */
export const courseIdOfLesson = (lessonId: string): CourseId => byPrefix(lessonId.replace(/^test:(level-)?/, ''))
export const courseIdOfWord = (wordId: string): CourseId => byPrefix(wordId)

/** Yakuniy test natijasi id'si: "test:<modul id>" yoki "test:level-<daraja id>". */
export const testResultId = (scope: string) => `test:${scope}`
