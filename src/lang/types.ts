import type { CountryId } from '../content/countries'
import type { GapItem } from '../content/german/gaps'
import type { Direction, Exercise, L3, Lesson, Module } from '../content/german/types'

/**
 * Til kurslari: nemis ('de') va koreys ('ko'). Qulfli tillar (yapon, ingliz) CourseId emas — faqat katalogda (LANGUAGE_CATALOG).
 *
 * ID QOIDASI (serverda saqlanadi — bir marta berilgach oʻzgarmaydi):
 * - Nemischa id'lar prefikssiz va AYNAN avvalgidek: dars "a1-m1-l1", soʻz "a1-m1-guten-morgen",
 *   test "test:a1-m1", daraja testi "test:level-A1".
 * - Boshqa kurslarning BARCHA id'lari kurs prefiksi bilan boshlanadi: dars "ko-h-m1-l1",
 *   soʻz "ko-t1-m1-annyeonghaseyo", test "test:ko-t1-m1", daraja "ko-T1" → daraja testi "test:level-ko-T1".
 * - Prefiks boʻyicha kurs aniqlanadi (courseIdOfLesson, courseIdOfWord): "ko-" — 'ko', qolgani — 'de'.
 * - Supabase'da lesson_id ≤ 64, word_id ≤ 96 belgi: prefiks bilan ham yetadi (migratsiya kerak emas).
 */
export type CourseId = 'de' | 'ko'
export const COURSE_IDS: readonly CourseId[] = ['de', 'ko']
export const isCourseId = (v: unknown): v is CourseId => typeof v === 'string' && (COURSE_IDS as readonly string[]).includes(v)

/** Lugʻatdagi soʻz: faqat darslardagi "word" mashqlaridan olinadi (yangi soʻz toʻqilmaydi). term — oʻrganilayotgan tilda. */
export type VocabWord = { id: string; moduleId: string; lessonId: string; exerciseId: string; term: string; tr: L3; pron: L3 }

/** Daraja: label boʻlmasa ekranda id koʻrsatiladi (nemischa "A1"). */
export type CourseLevel = { id: string; locked: boolean; label?: L3 }

export type CourseFeatures = {
  /** Artikl mashqi (der/die/das) bormi. */
  article: boolean
  /** Yozish mashqi bormi (yoʻq boʻlsa Aralash, takrorlash va yakuniy test oʻrniga yigʻish/test tanlaydi). */
  write: boolean
  /** Yigʻish: harflardan yoki boʻgʻinlardan ('syllables' — keyingi versiyada). */
  build: 'letters' | 'syllables'
  /** Lugʻat Roʻyxati va Kartochkasida oʻqilishi (pron) koʻrsatiladimi (lotin boʻlmagan yozuv — koreyscha). */
  pron: boolean
}

/** Kurs taʼrifi (kontent). Qidiruv funksiyalari makeCourse() da qoʻshiladi. */
export type CourseDef = {
  id: CourseId
  /** Tanlash ekrani va sarlavhadagi bayroq. */
  flag: CountryId
  /** Ovoz (speechSynthesis va SpeechRecognition) tili. */
  speechLang: 'de-DE' | 'ko-KR'
  levels: readonly CourseLevel[]
  /** Kasbiy yoʻnalishlar (faqat yoʻnalishli kurslarda). */
  directions?: readonly Direction[]
  modules: readonly Module[]
  lessons: readonly Lesson[]
  exercisesOf: (lessonId: string) => Exercise[]
  vocab: readonly VocabWord[]
  gaps: readonly GapItem[]
  features: CourseFeatures
  /** Yozma javobni solishtirish uchun normallashtirish (answer.ts). */
  normalize: (s: string) => string
  /** Harflarni katta-kichik farqsiz solishtirish uchun locale (toLocaleLowerCase). */
  letterLocale: string
}

/** Kurs: taʼrif + tez qidiruv (Map bilan). */
export type Course = CourseDef & {
  moduleById: (id: string) => Module | undefined
  lessonById: (id: string) => Lesson | undefined
  wordById: (id: string) => VocabWord | undefined
  wordOfExercise: (exerciseId: string) => VocabWord | undefined
  gapById: (id: string) => GapItem | undefined
  /** Dars tugaganda takrorlash qutisiga tushadigan soʻzlar. */
  wordIdsOfLesson: (lessonId: string) => string[]
}
