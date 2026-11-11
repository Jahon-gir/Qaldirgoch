import type { Exercise } from '../german/types'
import { l3, match, pick, PROMPT_LETTER, PROMPT_READ, PROMPT_SIGN, same, syllable } from './helpers'

/** Hangul · 2-modul · 6-dars: Modul testi — qattiq/nafasli/yumshoq, murakkab unli, pastki harf, oʻqilishi, belgilar (faqat oldingi darslardan). */
export const KO_H_M2_L6: Exercise[] = [
  pick({
    id: 'ko-h-m2-l6-e1', prompt: PROMPT_LETTER, translation: same('kka'), options: ['카', '까', '가'], answer: 1,
    explain: l3('까 — qattiq, havosiz. 카 — havo bilan, 가 — yumshoq.', '까 — қаттиқ, ҳавосиз. 카 — ҳаво билан, 가 — юмшоқ.', '까 — напряжённый, без воздуха. 카 — с воздухом, 가 — мягкий.')
  }),
  pick({
    id: 'ko-h-m2-l6-e2', prompt: PROMPT_LETTER, translation: same('tta'), options: ['따', '다', '타'], answer: 0,
    explain: l3('따 — qattiq ㄸ. 다 — yumshoq, 타 — havo bilan.', '따 — қаттиқ ㄸ. 다 — юмшоқ, 타 — ҳаво билан.', '따 — напряжённый ㄸ. 다 — мягкий, 타 — с воздухом.')
  }),
  pick({
    id: 'ko-h-m2-l6-e3', prompt: PROMPT_LETTER, translation: same('pa'), options: ['빠', '바', '파'], answer: 2,
    explain: l3('파 — havo bilan ㅍ. 바 — yumshoq, 빠 — qattiq.', '파 — ҳаво билан ㅍ. 바 — юмшоқ, 빠 — қаттиқ.', '파 — ㅍ с воздухом. 바 — мягкий, 빠 — напряжённый.')
  }),
  syllable({ id: 'ko-h-m2-l6-e4', initial: 'ㄱ', vowel: 'ㅘ', pron: l3('gva', 'гва', 'гва'), distractors: ['ㅝ', 'ㅏ'] }),
  syllable({ id: 'ko-h-m2-l6-e5', initial: 'ㅇ', vowel: 'ㅢ', pron: l3('ui', 'уи', 'уи'), distractors: ['ㅣ', 'ㅡ'] }),
  syllable({ id: 'ko-h-m2-l6-e6', initial: 'ㄱ', vowel: 'ㅏ', final: 'ㅇ', pron: l3('gang', 'ганг', 'ганг'), distractors: ['ㄴ', 'ㅗ'] }),
  syllable({ id: 'ko-h-m2-l6-e7', initial: 'ㅅ', vowel: 'ㅏ', final: 'ㄴ', pron: l3('san', 'сан', 'сан'), distractors: ['ㅁ', 'ㅓ'] }),
  // Pastki harf yoʻq: 3 katak, "Yoʻq" tugmasi
  syllable({ id: 'ko-h-m2-l6-e8', initial: 'ㅅ', vowel: 'ㅏ', showFinal: true, pron: l3('sa', 'са', 'са'), distractors: ['ㄴ', 'ㅜ'] }),
  pick({
    id: 'ko-h-m2-l6-e9', prompt: PROMPT_READ, translation: same('한국어'), options: ['한국어', '한구어', '한구거'], answer: 2,
    explain: l3('한국어 — [한구거]: ㄱ keyingi ㅇ ning oʻrniga oʻtadi.', '한국어 — [한구거]: ㄱ кейинги ㅇ нинг ўрнига ўтади.', '한국어 — [한구거]: ㄱ переходит на место немой ㅇ.')
  }),
  pick({
    id: 'ko-h-m2-l6-e10', prompt: PROMPT_READ, translation: same('직업'), options: ['직업', '지겁', '지어'], answer: 1,
    explain: l3('직업 — [지겁]: ㄱ keyingi boʻgʻinga oʻtadi.', '직업 — [지겁]: ㄱ кейинги бўғинга ўтади.', '직업 — [지겁]: ㄱ переходит в следующий слог.')
  }),
  match('ko-h-m2-l6-e11', [
    ['출구', l3('chiqish', 'чиқиш', 'выход')],
    ['입구', l3('kirish', 'кириш', 'вход')],
    ['위험', l3('xavf, xavfli', 'хавф, хавфли', 'опасность, опасно')],
    ['금연', l3('chekish mumkin emas', 'чекиш мумкин эмас', 'курить запрещено')]
  ]),
  pick({
    id: 'ko-h-m2-l6-e12', prompt: PROMPT_SIGN, translation: l3('Chekish mumkin emas', 'Чекиш мумкин эмас', 'Курить запрещено'), options: ['위험', '금연', '입구'], answer: 1,
    explain: l3('금연 — chekish mumkin emas. 위험 — xavf, 입구 — kirish.', '금연 — чекиш мумкин эмас. 위험 — хавф, 입구 — кириш.', '금연 — курить запрещено. 위험 — опасность, 입구 — вход.')
  })
]
