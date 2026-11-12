import { l3 } from '../german/helpers'
import type { ChoiceExercise, L3, LetterExercise, MatchExercise, MatchPair, SyllableExercise, WordExercise } from '../german/types'

export { l3 }

/** Tovush (lotincha, Revised Romanization) uch tilda bir xil koʻrinadi. */
export const same = (s: string): L3 => l3(s, s, s)

/** Yangi soʻz: slug MAJBURIY (Hangul wordSlug'da oʻchadi). Misol gap yoʻq — yangi koreyscha gap toʻqilmaydi. */
type WordArgs = Omit<WordExercise, 'type' | 'slug' | 'example'> & { slug: string }
export const word = (a: WordArgs): WordExercise => ({ type: 'word', ...a })

export const letter = (a: Omit<LetterExercise, 'type'>): LetterExercise => ({ type: 'letter', ...a })

export const syllable = (a: Omit<SyllableExercise, 'type'>): SyllableExercise => ({ type: 'syllable', ...a })

/** Murakkab unli (ㅘ ㅝ ㅚ ...) syllable mashqida BITTA tugma: qismlarga boʻlinmaydi (compose/decompose shunday ishlaydi). */

export const PROMPT_MATCH = l3('Juftlarni toping: avval chapdan, keyin oʻngdan tanlang', 'Жуфтларни топинг: аввал чапдан, кейин ўнгдан танланг', 'Найдите пары: сначала слева, потом справа')

export const match = (id: string, pairs: [term: string, tr: L3][]): MatchExercise => ({
  type: 'match',
  id,
  prompt: PROMPT_MATCH,
  pairs: pairs.map<MatchPair>(([term, tr], i) => ({ id: `${id}-p${i + 1}`, term, tr }))
})

/** Tanlash: savol (prompt) va "___" — bitta boʻshliq; variantlar FAQAT darslardagi harf yoki soʻzlar. */
type PickArgs = { id: string; prompt: L3; translation: L3; options: string[]; answer: number; explain: L3 }
export const pick = (a: PickArgs): ChoiceExercise => ({
  type: 'choice',
  id: a.id,
  prompt: a.prompt,
  sentence: '___',
  full: a.options[a.answer],
  translation: a.translation,
  options: a.options.map((text, i) => ({ id: `${a.id}-o${i + 1}`, text, correct: i === a.answer })),
  explain: a.explain
})

export const PROMPT_LETTER = l3('Tovushga mos harfni tanlang', 'Товушга мос ҳарфни танланг', 'Выберите букву для звука')
export const PROMPT_WORD = l3('Tarjimaga mos soʻzni tanlang', 'Таржимага мос сўзни танланг', 'Выберите слово по переводу')

export const PROMPT_READ = l3('Qanday oʻqiladi?', 'Қандай ўқилади?', 'Как это читается?')
export const PROMPT_SIGN = l3('Qaysi yozuv shu maʼnoni bildiradi?', 'Қайси ёзув шу маънони билдиради?', 'Какая надпись означает это?')
