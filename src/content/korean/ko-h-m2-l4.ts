import type { Exercise } from '../german/types'
import { l3, letter, pick, PROMPT_READ, same, word } from './helpers'

/** Hangul · 2-modul · 4-dars: Bogʻlanib oʻqish — pastki harf keyingi ㅇ boʻgʻinga oʻtadi. pron — HAQIQIY talaffuz. */
export const KO_H_M2_L4: Exercise[] = [
  letter({
    id: 'ko-h-m2-l4-e1',
    letters: [{ char: '한', sound: 'han' }, { char: '국', sound: 'guk' }, { char: '어', sound: 'eo' }],
    note: l3(
      'Pastki harfdan keyin ㅇ bilan boshlangan boʻgʻin kelsa (ㅇ bu yerda ovozsiz), pastki harf keyingi boʻgʻinga oʻtib oʻqiladi: 한국어 = 한 + 국 + 어 → [한구거]. Yozuv oʻzgarmaydi — faqat oʻqilishi.',
      'Пастки ҳарфдан кейин ㅇ билан бошланган бўғин келса (ㅇ бу ерда овозсиз), пастки ҳарф кейинги бўғинга ўтиб ўқилади: 한국어 = 한 + 국 + 어 → [한구거]. Ёзув ўзгармайди — фақат ўқилиши.',
      'Если после нижней буквы идёт слог, начинающийся с ㅇ (здесь она немая), нижняя буква переходит в следующий слог: 한국어 = 한 + 국 + 어 → [한구거]. Написание не меняется — только чтение.'
    ),
    example: { term: '한국어', pron: l3('han-gu-go', 'ҳан-гу-го', 'хан-гу-го'), tr: l3('koreys tili', 'корейс тили', 'корейский язык') }
  }),
  letter({
    id: 'ko-h-m2-l4-e2',
    letters: [{ char: '음', sound: 'eum' }, { char: '악', sound: 'ak' }],
    note: l3(
      'Xuddi shunday: 음악 = 음 + 악 → [으막]. ㅁ keyingi boʻgʻinga oʻtadi, shuning uchun «eum-ak» emas, «eu-mak» deb oʻqiladi.',
      'Худди шундай: 음악 = 음 + 악 → [으막]. ㅁ кейинги бўғинга ўтади, шунинг учун «эум-ак» эмас, «эу-мак» деб ўқилади.',
      'Так же: 음악 = 음 + 악 → [으막]. ㅁ переходит в следующий слог, поэтому читается не «ым-ак», а «ы-мак».'
    ),
    example: { term: '음악', pron: l3('eu-mak', 'эу-мак', 'ы-мак'), tr: l3('musiqa', 'мусиқа', 'музыка') }
  }),
  word({ id: 'ko-h-m2-l4-e3', term: '한국어', slug: 'hangugeo', icon: 'language', tr: l3('koreys tili', 'корейс тили', 'корейский язык'), pron: l3('han-gu-go', 'ҳан-гу-го', 'хан-гу-го') }),
  word({ id: 'ko-h-m2-l4-e4', term: '음악', slug: 'eumak', icon: 'music', tr: l3('musiqa', 'мусиқа', 'музыка'), pron: l3('eu-mak', 'эу-мак', 'ы-мак') }),
  word({ id: 'ko-h-m2-l4-e5', term: '단어', slug: 'daneo', icon: 'abc', tr: l3('soʻz', 'сўз', 'слово'), pron: l3('da-no', 'да-но', 'да-но') }),
  word({ id: 'ko-h-m2-l4-e6', term: '발음', slug: 'bareum', icon: 'volume', tr: l3('talaffuz', 'талаффуз', 'произношение'), pron: l3('ba-reum', 'ба-рэум', 'ба-рым') }),
  word({ id: 'ko-h-m2-l4-e7', term: '직업', slug: 'jigeop', icon: 'briefcase', tr: l3('kasb', 'касб', 'профессия'), pron: l3('ji-gop', 'жи-гоп', 'джи-гоп') }),
  word({ id: 'ko-h-m2-l4-e8', term: '일요일', slug: 'iryoil', icon: 'calendar-event', tr: l3('yakshanba', 'якшанба', 'воскресенье'), pron: l3('i-ryoʻ-il', 'и-рйў-ил', 'и-рё-ил') }),
  word({ id: 'ko-h-m2-l4-e9', term: '목요일', slug: 'mogyoil', icon: 'calendar-event', tr: l3('payshanba', 'пайшанба', 'четверг'), pron: l3('moʻ-gyoʻ-il', 'мў-гйў-ил', 'мо-гё-ил') }),
  pick({
    id: 'ko-h-m2-l4-e10', prompt: PROMPT_READ, translation: same('단어'), options: ['단어', '다너', '다어'], answer: 1,
    explain: l3(
      '단어 — [다너]: ㄴ keyingi ㅇ ning oʻrniga oʻtadi (단 + 어).',
      '단어 — [다너]: ㄴ кейинги ㅇ нинг ўрнига ўтади (단 + 어).',
      '단어 — [다너]: ㄴ переходит на место немой ㅇ (단 + 어).'
    )
  }),
  pick({
    id: 'ko-h-m2-l4-e11', prompt: PROMPT_READ, translation: same('발음'), options: ['발음', '바음', '바름'], answer: 2,
    explain: l3(
      '발음 — [바름]: ㄹ keyingi boʻgʻinga oʻtadi (발 + 음).',
      '발음 — [바름]: ㄹ кейинги бўғинга ўтади (발 + 음).',
      '발음 — [바름]: ㄹ переходит в следующий слог (발 + 음).'
    )
  }),
  pick({
    id: 'ko-h-m2-l4-e12', prompt: PROMPT_READ, translation: same('직업'), options: ['지겁', '직업', '지어'], answer: 0,
    explain: l3(
      '직업 — [지겁]: ㄱ keyingi boʻgʻinga oʻtadi (직 + 업), ㅂ esa oxirida «p» boʻlib qoladi.',
      '직업 — [지겁]: ㄱ кейинги бўғинга ўтади (직 + 업), ㅂ эса охирида «п» бўлиб қолади.',
      '직업 — [지겁]: ㄱ переходит в следующий слог (직 + 업), а ㅂ остаётся в конце как «п».'
    )
  })
]
