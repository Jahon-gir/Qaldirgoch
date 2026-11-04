import type { ChoiceExercise, ContentStatus, L3, MatchExercise, MatchPair, WordExercise } from './types'

export const l3 = (uz: string, uzCyrl: string, ru: string): L3 => ({ uz, 'uz-Cyrl': uzCyrl, ru })

export const PROMPT_FILL = l3('Boʻshliqni toʻldiring', 'Бўшлиқни тўлдиринг', 'Заполните пропуск')
export const PROMPT_MATCH = l3(
  'Juftlarni toping: avval chapdan, keyin oʻngdan tanlang',
  'Жуфтларни топинг: аввал чапдан, кейин ўнгдан танланг',
  'Найдите пары: сначала слева, потом справа'
)

type WordArgs = Omit<WordExercise, 'type'>
export const word = (a: WordArgs): WordExercise => ({ type: 'word', ...a })

type ChoiceArgs = {
  id: string
  /** Boʻshliqli gap, masalan "Ich ___ Anna." */
  sentence: string
  translation: L3
  /** Variantlar (aralash tartibda) va toʻgʻrisining indeksi. */
  options: string[]
  answer: number
  explain: L3
}
export const choice = (a: ChoiceArgs): ChoiceExercise => ({
  type: 'choice',
  id: a.id,
  prompt: PROMPT_FILL,
  sentence: a.sentence,
  full: a.sentence.replace('___', a.options[a.answer]),
  translation: a.translation,
  options: a.options.map((text, i) => ({ id: `${a.id}-o${i + 1}`, text, correct: i === a.answer })),
  explain: a.explain
})

export const match = (id: string, pairs: [de: string, tr: L3][]): MatchExercise => ({
  type: 'match',
  id,
  prompt: PROMPT_MATCH,
  pairs: pairs.map<MatchPair>(([de, tr], i) => ({ id: `${id}-p${i + 1}`, de, tr }))
})

export const REVIEW: ContentStatus = 'review'
