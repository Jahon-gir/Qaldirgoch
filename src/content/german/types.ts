import type { Lang } from '../../i18n/I18nProvider'

/** Har matn uch tilda: uz (lotin), uz-Cyrl (qoʻlda yozilgan kirill), ru. */
export type L3 = Record<Lang, string>

export type Level = 'A1' | 'A2' | 'B1'
export const LEVELS: readonly Level[] = ['A1', 'A2', 'B1']
/** Darajalar holati: B1 hozircha "keyin" (qulf). */
export const LEVEL_LOCKED: Record<Level, boolean> = { A1: false, A2: false, B1: true }

export type Direction = 'general' | 'technical' | 'care' | 'hospitality'
export const DIRECTIONS: readonly Direction[] = ['general', 'technical', 'care', 'hospitality']

/** Kontent holati: faqat approved — yakuniy. Bu versiyadagi darslar review. */
export type ContentStatus = 'draft' | 'review' | 'approved'

/** level — daraja id'si (nemischa: Level; boshqa kurslar: oʻz id'si, masalan "ko-T1"). */
export type Module = { id: string; level: string; direction: Direction; title: L3; order: number; status: ContentStatus }

export type LessonKind = 'words' | 'phrases' | 'grammar' | 'test'
export type Lesson = { id: string; moduleId: string; title: L3; kind: LessonKind; minutes: number; order: number }

/** Yangi soʻz: oʻrganilayotgan tilda, tarjima, talaffuz (tilga mos harflarda), Tabler ikonka nomi, misol gap. */
export type WordExercise = {
  type: 'word'
  id: string
  /** Oʻrganilayotgan tildagi soʻz (nemischa, koreyscha ...). */
  term: string
  /** Soʻz id'si uchun barqaror qism. Boʻlmasa — term'dan (wordSlug). Lotin boʻlmagan yozuvda (Hangul) MAJBURIY. */
  slug?: string
  tr: L3
  pron: L3
  icon: string
  example: { de: string; tr: L3 }
  audioUrl?: string
}

export type ChoiceOption = { id: string; text: string; correct: boolean }
/** Variant tanlash: `sentence` ichida ___ — boʻshliq; `full` — boʻshliq toʻldirilgan gap (xatolar roʻyxati uchun). */
export type ChoiceExercise = {
  type: 'choice'
  id: string
  prompt: L3
  sentence: string
  full: string
  translation: L3
  options: ChoiceOption[]
  /** Bir gaplik sabab (toʻgʻri ham, xato ham shu bilan izohlanadi). */
  explain: L3
}

export type MatchPair = { id: string; term: string; tr: L3 }
export type MatchExercise = { type: 'match'; id: string; prompt: L3; pairs: MatchPair[] }

export type Exercise = WordExercise | ChoiceExercise | MatchExercise
