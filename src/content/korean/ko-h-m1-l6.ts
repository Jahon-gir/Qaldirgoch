import type { Exercise } from '../german/types'
import { l3, match, pick, PROMPT_WORD, same, syllable } from './helpers'

/** Hangul · 1-modul · 6-dars: Modul testi — harf ↔ tovush, boʻgʻin yigʻish, soʻz tanlash (faqat oldingi darslardan). */
export const KO_H_M1_L6: Exercise[] = [
  match('ko-h-m1-l6-e1', [
    ['ㄱ', same('g / k')],
    ['ㄴ', same('n')],
    ['ㅁ', same('m')],
    ['ㅎ', same('h')]
  ]),
  match('ko-h-m1-l6-e2', [
    ['ㅏ', same('a')],
    ['ㅗ', same('o')],
    ['ㅜ', same('u')],
    ['ㅣ', same('i')]
  ]),
  syllable({ id: 'ko-h-m1-l6-e3', initial: 'ㄱ', vowel: 'ㅗ', pron: l3('goʻ', 'гў', 'го'), distractors: ['ㅋ', 'ㅓ'] }),
  syllable({ id: 'ko-h-m1-l6-e4', initial: 'ㅈ', vowel: 'ㅣ', pron: l3('ji', 'жи', 'джи'), distractors: ['ㅊ', 'ㅡ'] }),
  syllable({ id: 'ko-h-m1-l6-e5', initial: 'ㅌ', vowel: 'ㅗ', pron: l3('toʻ', 'тў', 'то'), distractors: ['ㄷ', 'ㅜ'] }),
  syllable({ id: 'ko-h-m1-l6-e6', initial: 'ㅊ', vowel: 'ㅏ', pron: l3('cha', 'ча', 'ча'), distractors: ['ㅈ', 'ㅓ'] }),
  pick({
    id: 'ko-h-m1-l6-e7', prompt: PROMPT_WORD, translation: l3('ona', 'она', 'мама'), options: ['아버지', '여자', '어머니'], answer: 2,
    explain: l3('어머니 — ona. 아버지 — ota, 여자 — ayol.', '어머니 — она. 아버지 — ота, 여자 — аёл.', '어머니 — мама. 아버지 — папа, 여자 — женщина.')
  }),
  pick({
    id: 'ko-h-m1-l6-e8', prompt: PROMPT_WORD, translation: l3('dengiz', 'денгиз', 'море'), options: ['바다', '나라', '포도'], answer: 0,
    explain: l3('바다 — dengiz. 나라 — mamlakat, 포도 — uzum.', '바다 — денгиз. 나라 — мамлакат, 포도 — узум.', '바다 — море. 나라 — страна, 포도 — виноград.')
  }),
  pick({
    id: 'ko-h-m1-l6-e9', prompt: PROMPT_WORD, translation: l3('sut', 'сут', 'молоко'), options: ['오이', '우유', '아이'], answer: 1,
    explain: l3('우유 — sut. 오이 — bodring, 아이 — bola.', '우유 — сут. 오이 — бодринг, 아이 — бола.', '우유 — молоко. 오이 — огурец, 아이 — ребёнок.')
  }),
  pick({
    id: 'ko-h-m1-l6-e10', prompt: PROMPT_WORD, translation: l3('qoʻshiq', 'қўшиқ', 'песня'), options: ['나라', '요리', '노래'], answer: 2,
    explain: l3('노래 — qoʻshiq. 나라 — mamlakat, 요리 — taom pishirish.', '노래 — қўшиқ. 나라 — мамлакат, 요리 — таом пишириш.', '노래 — песня. 나라 — страна, 요리 — готовка.')
  })
]
