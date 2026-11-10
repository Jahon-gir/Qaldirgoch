import type { Exercise } from '../german/types'
import { l3, letter, match, pick, PROMPT_WORD, syllable, word } from './helpers'

/** Hangul · 1-modul · 4-dars: Nafasli undoshlar (ㅋ ㅌ ㅍ ㅊ) — havo chiqarib aytiladi. */
export const KO_H_M1_L4: Exercise[] = [
  letter({
    id: 'ko-h-m1-l4-e1',
    letters: [{ char: 'ㅋ', sound: 'k' }, { char: 'ㅌ', sound: 't' }],
    note: l3(
      'Nafasli undoshlar: kuchli havo chiqarib aytiladi (kaftni ogʻiz oldiga qoʻysangiz, havoni sezasiz). ㅋ — ㄱ ga bitta chiziq qoʻshilgan.',
      'Нафасли ундошлар: кучли ҳаво чиқариб айтилади (кафтни оғиз олдига қўйсангиз, ҳавони сезасиз). ㅋ — ㄱ га битта чизиқ қўшилган.',
      'Придыхательные согласные: произносятся с сильным выдохом (поднесите ладонь ко рту — почувствуете воздух). ㅋ — это ㄱ с ещё одной чертой.'
    ),
    example: { term: '커피', pron: l3('ko-pi', 'ко-пи', 'ко-пи'), tr: l3('qahva', 'қаҳва', 'кофе') }
  }),
  letter({
    id: 'ko-h-m1-l4-e2',
    letters: [{ char: 'ㅍ', sound: 'p' }, { char: 'ㅊ', sound: 'ch' }],
    note: l3(
      'ㅍ — havo bilan «p». ㅊ — havo bilan «ch» (ㅈ ning nafasli juftligi).',
      'ㅍ — ҳаво билан «п». ㅊ — ҳаво билан «ч» (ㅈ нинг нафасли жуфтлиги).',
      'ㅍ — «п» с выдохом. ㅊ — «ч» с выдохом (придыхательная пара ㅈ).'
    ),
    example: { term: '기차', pron: l3('ki-cha', 'ки-ча', 'ки-ча'), tr: l3('poyezd', 'поезд', 'поезд') }
  }),
  word({ id: 'ko-h-m1-l4-e3', term: '커피', slug: 'keopi', icon: 'coffee', tr: l3('qahva', 'қаҳва', 'кофе'), pron: l3('ko-pi', 'ко-пи', 'ко-пи') }),
  word({ id: 'ko-h-m1-l4-e4', term: '토마토', slug: 'tomato', icon: 'salad', tr: l3('pomidor', 'помидор', 'помидор'), pron: l3('toʻ-ma-toʻ', 'тў-ма-тў', 'то-ма-то') }),
  word({ id: 'ko-h-m1-l4-e5', term: '포도', slug: 'podo', icon: 'grape', tr: l3('uzum', 'узум', 'виноград'), pron: l3('poʻ-doʻ', 'пў-дў', 'по-до') }),
  word({ id: 'ko-h-m1-l4-e6', term: '기차', slug: 'gicha', icon: 'train', tr: l3('poyezd', 'поезд', 'поезд'), pron: l3('ki-cha', 'ки-ча', 'ки-ча') }),
  match('ko-h-m1-l4-e7', [
    ['ㅋ', l3('k', 'k', 'k')],
    ['ㅌ', l3('t', 't', 't')],
    ['ㅍ', l3('p', 'p', 'p')],
    ['ㅊ', l3('ch', 'ch', 'ch')]
  ]),
  syllable({ id: 'ko-h-m1-l4-e8', initial: 'ㅋ', vowel: 'ㅓ', pron: l3('ko', 'ко', 'ко'), distractors: ['ㄱ', 'ㅗ'] }),
  pick({
    id: 'ko-h-m1-l4-e9', prompt: PROMPT_WORD, translation: l3('uzum', 'узум', 'виноград'), options: ['토마토', '포도', '커피'], answer: 1,
    explain: l3('포도 (poʻ-doʻ) — uzum. 토마토 — pomidor, 커피 — qahva.', '포도 (пў-дў) — узум. 토마토 — помидор, 커피 — қаҳва.', '포도 (по-до) — виноград. 토마토 — помидор, 커피 — кофе.')
  })
]
