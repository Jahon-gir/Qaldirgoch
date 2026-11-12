import type { Lang } from '../../i18n/I18nProvider'

/** Har matn uch tilda: uz (lotin), uz-Cyrl (qoʻlda yozilgan kirill), ru. */
export type L3 = Record<Lang, string>

export type Level = 'A1' | 'A2' | 'B1'
export const LEVELS: readonly Level[] = ['A1', 'A2', 'B1']
/** Darajalar holati: B1 hozircha "keyin" (qulf). */
export const LEVEL_LOCKED: Record<Level, boolean> = { A1: false, A2: false, B1: true }

/** Yoʻnalish (kasbiy soha). logistics va metal — 2-toʻlqin (0.14.0). */
export type Direction = 'general' | 'technical' | 'care' | 'hospitality' | 'logistics' | 'metal'
export const DIRECTIONS: readonly Direction[] = ['general', 'technical', 'care', 'hospitality', 'logistics', 'metal']

/** Kontent holati: faqat approved — yakuniy. Bu versiyadagi darslar review. */
export type ContentStatus = 'draft' | 'review' | 'approved'

/** level — daraja id'si (nemischa: Level; boshqa kurslar: oʻz id'si, masalan "ko-T1"). */
export type Module = { id: string; level: string; direction: Direction; title: L3; order: number; status: ContentStatus }

export type LessonKind = 'words' | 'phrases' | 'grammar' | 'test' | 'letters'
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
  /** Misol gap (darslardan). Koreys 1-modulida yoʻq (yangi gap toʻqilmaydi). */
  example?: { term: string; tr: L3 }
  audioUrl?: string
  /** Koʻplik shakli (nemischa otlarda, masalan "die Hämmer"; koʻpligi yoʻq — "—"). Kasbiy kontent (0.12.0) uchun; hozir ekranda yoʻq. */
  plural?: string
  /** Soʻz rasmi (kasbiy kontent). Hozir ekranda yoʻq. */
  image?: ContentImage
  /** Xavfsizlik soʻzi (Vorsicht, Notausgang ...). */
  safety?: boolean
}

/**
 * Kontent rasmi: src — public/ ichidagi yoʻl (masalan "content/de/img/technical/hammer.webp").
 * source: ai — AI chizgan, own — jamoa chizgan/suratga olgan, cc — erkin litsenziya (license va author majburiy).
 * checked — odam koʻrib chiqqan (tasdiqlangan soʻzda majburiy).
 */
export type ContentImage = { src: string; source: 'ai' | 'own' | 'cc'; license?: string; author?: string; checked: boolean }

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

/**
 * Yangi harf(lar) kartochkasi (koreys alifbosi): 1–3 harf, har birining lotincha tovushi, qisqa izoh, ixtiyoriy misol soʻz.
 * Lugʻatga TUSHMAYDI (soʻz emas).
 */
export type LetterExercise = {
  type: 'letter'
  id: string
  letters: { char: string; sound: string }[]
  note: L3
  example?: { term: string; pron: L3; tr: L3 }
}

/**
 * Boʻgʻin yigʻish: undosh + unli (+ ixtiyoriy pastki harf) katakchalari; pastda harf tugmalari (toʻgʻrilari + chalgʻituvchilar shu darsdan).
 * Javob: compose(initial, vowel, final) — Unicode boʻgʻin.
 */
export type SyllableExercise = {
  type: 'syllable'
  id: string
  initial: string
  vowel: string
  /** Pastki harf (batchim). Berilsa 3 katak chiqadi: undosh + unli + pastki harf. */
  final?: string
  /** Pastki harf yoʻq, lekin 3 katak va "Yoʻq" tugmasi chiqadi (pastki harf yoʻqligini tanlash mashqi). */
  showFinal?: boolean
  /** Oʻqilishi (masalan «na»). */
  pron: L3
  distractors: string[]
}

export type Exercise = WordExercise | ChoiceExercise | MatchExercise | LetterExercise | SyllableExercise
/** Nemis darslaridagi mashqlar (harf va boʻgʻin mashqlari yoʻq). */
export type GermanExercise = WordExercise | ChoiceExercise | MatchExercise
