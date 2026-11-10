import type { CountryId } from '../content/countries'
import type { Direction } from '../content/german/types'
import type { DailyGoal } from '../german/daily'
import type { CourseId } from '../lang/types'
import type { Key } from '../i18n/uz'

export const AGE = ['under18', '18-24', '25-30', '31-35', '36plus'] as const
export const EDUCATION = ['school', 'college', 'higher', 'studying'] as const
export const PROFESSION = ['electrician', 'welder', 'mechanic', 'nurse', 'cook', 'construction', 'other'] as const
export const GERMAN = ['none', 'a1', 'a2', 'b1'] as const
export const DAILY = ['15', '30', '60'] as const
export const DEPARTURE = ['unknown', '1y', '1-2y'] as const

export type Answers = {
  ageRange: (typeof AGE)[number]
  education: (typeof EDUCATION)[number]
  profession: (typeof PROFESSION)[number]
  professionOther?: string
  germanLevel: (typeof GERMAN)[number]
  dailyTime: (typeof DAILY)[number]
  departure: (typeof DEPARTURE)[number]
}
/** Saqlangan profil sxemasi versiyasi (localStorage va serverdagi jsonb uchun). Maydon qoʻshilganda oshiriladi. */
export const PROFILE_SCHEMA_VERSION = 1
export type Profile = Answers & {
  createdAt: string
  schemaVersion: number
  /** Nemis tili yoʻnalishi qoʻlda tanlangan boʻlsa (aks holda kasbdan avtomatik). */
  germanDirection?: Direction
  /** Tanlangan (ochiq) davlat; yoʻq boʻlsa Germaniya. */
  selectedCountry?: CountryId
  /** Kunlik maqsad (tugatilgan dars yoki takrorlash soni): 1 / 2 / 3; yoʻq boʻlsa 1. */
  dailyGoal?: DailyGoal
  /** Lugʻat mashq usuli va old tomoni (yoʻq boʻlsa: roʻyxat, oʻrganilayotgan til). */
  vocabMode?: VocabMode
  vocabFront?: VocabFront
  /** Joriy til kursi (hozir UI'da ishlatilmaydi; yoʻq boʻlsa 'de'). */
  activeCourse?: CourseId
  /** Ovoz effektlari (yoʻq boʻlsa yoqilgan). */
  soundEffects?: boolean
}
export const VOCAB_MODES = ['list', 'cards', 'test', 'build', 'listen', 'write', 'article', 'speak', 'mixed'] as const
export type VocabMode = (typeof VOCAB_MODES)[number]
/** Old tomon: 'target' — oʻrganilayotgan til (nemischa, koreyscha ...), 'tr' — tarjima. 0.10.0 gacha 'target' oʻrnida 'de' saqlangan. */
export const VOCAB_FRONTS = ['target', 'tr'] as const
export type VocabFront = (typeof VOCAB_FRONTS)[number]
export const DEFAULT_VOCAB_FRONT: VocabFront = 'target'

/** Saqlangan qiymat: eski 'de' → 'target'; notanish → undefined. */
export function normalizeVocabFront(v: unknown): VocabFront | undefined {
  if (v === 'de') return 'target'
  return (VOCAB_FRONTS as readonly unknown[]).includes(v) ? (v as VocabFront) : undefined
}
export type QuestionId = Exclude<keyof Answers, 'professionOther'>

/** Onboarding savollari tartibi. Matnlar lugʻatda: q.<lugʻat nomi>.<qiymat>. */
export const QUESTIONS: { id: QuestionId; dict: string; options: readonly string[]; hint?: boolean }[] = [
  { id: 'ageRange', dict: 'age', options: AGE },
  { id: 'education', dict: 'education', options: EDUCATION, hint: true },
  { id: 'profession', dict: 'profession', options: PROFESSION },
  { id: 'germanLevel', dict: 'germanLevel', options: GERMAN },
  { id: 'dailyTime', dict: 'dailyTime', options: DAILY },
  { id: 'departure', dict: 'departure', options: DEPARTURE }
]

export const qKey = (q: (typeof QUESTIONS)[number], part: string) => `q.${q.dict}.${part}` as Key

/** Javob matni uchun lugʻat kaliti. */
export function answerKey(id: QuestionId, value: string): Key {
  const q = QUESTIONS.find((x) => x.id === id)!
  return qKey(q, value)
}

/** Javoblar toʻliq va toʻgʻri qiymatlardan iboratmi (localStorage buzilgan boʻlishi mumkin). */
export function isComplete(a: Partial<Answers>): a is Answers {
  return QUESTIONS.every((q) => typeof a[q.id] === 'string' && q.options.includes(a[q.id] as string))
}
