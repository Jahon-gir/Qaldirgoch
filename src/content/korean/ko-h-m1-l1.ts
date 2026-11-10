import type { Exercise } from '../german/types'
import { l3, letter, match, pick, PROMPT_LETTER, same, word } from './helpers'

/** Hangul · 1-modul · 1-dars: Oddiy unlilar (ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ). ㅇ boʻgʻin boshida ovozsiz. */
export const KO_H_M1_L1: Exercise[] = [
  letter({
    id: 'ko-h-m1-l1-e1',
    letters: [{ char: 'ㅏ', sound: 'a' }, { char: 'ㅓ', sound: 'eo' }],
    note: l3(
      'ㅓ — oʻzbekcha «o» ga yaqin, ogʻiz ochiqroq. Unli yolgʻiz yozilmaydi: oldiga ovozsiz ㅇ qoʻyiladi (아 = a, 어 = o).',
      'ㅓ — ўзбекча «о» га яқин, оғиз очиқроқ. Унли ёлғиз ёзилмайди: олдига овозсиз ㅇ қўйилади (아 = а, 어 = о).',
      'ㅓ — близко к «о», рот открыт шире. Гласная не пишется одна: перед ней ставится немая ㅇ (아 = а, 어 = о).'
    ),
    example: { term: '아이', pron: l3('a-i', 'а-и', 'а-и'), tr: l3('bola', 'бола', 'ребёнок') }
  }),
  letter({
    id: 'ko-h-m1-l1-e2',
    letters: [{ char: 'ㅗ', sound: 'o' }, { char: 'ㅜ', sound: 'u' }],
    note: l3(
      'ㅗ — oʻzbekcha «oʻ» ga yaqin, lablar dumaloq. ㅜ — «u».',
      'ㅗ — ўзбекча «ў» га яқин, лаблар думалоқ. ㅜ — «у».',
      'ㅗ — округлённое «о». ㅜ — «у».'
    ),
    example: { term: '오이', pron: l3('oʻ-i', 'ў-и', 'о-и'), tr: l3('bodring', 'бодринг', 'огурец') }
  }),
  letter({
    id: 'ko-h-m1-l1-e3',
    letters: [{ char: 'ㅡ', sound: 'eu' }, { char: 'ㅣ', sound: 'i' }],
    note: l3(
      'ㅡ — «u» kabi, lekin lablar choʻzilmaydi (tabassumdagidek). ㅣ — «i».',
      'ㅡ — «у» каби, лекин лаблар чўзилмайди (табассумдагидек). ㅣ — «и».',
      'ㅡ — как «у», но губы не вытягиваются (как при улыбке). ㅣ — «и».'
    ),
    example: { term: '아이', pron: l3('a-i', 'а-и', 'а-и'), tr: l3('bola', 'бола', 'ребёнок') }
  }),
  word({ id: 'ko-h-m1-l1-e4', term: '아이', slug: 'ai', icon: 'mood-kid', tr: l3('bola', 'бола', 'ребёнок'), pron: l3('a-i', 'а-и', 'а-и') }),
  word({ id: 'ko-h-m1-l1-e5', term: '오이', slug: 'oi', icon: 'leaf', tr: l3('bodring', 'бодринг', 'огурец'), pron: l3('oʻ-i', 'ў-и', 'о-и') }),
  match('ko-h-m1-l1-e6', [
    ['ㅏ', same('a')],
    ['ㅓ', same('eo')],
    ['ㅗ', same('o')],
    ['ㅜ', same('u')]
  ]),
  pick({
    id: 'ko-h-m1-l1-e7', prompt: PROMPT_LETTER, translation: same('i'), options: ['ㅡ', 'ㅣ', 'ㅓ'], answer: 1,
    explain: l3('ㅣ — tik chiziq, «i» deb oʻqiladi.', 'ㅣ — тик чизиқ, «и» деб ўқилади.', 'ㅣ — вертикальная черта, читается «и».')
  }),
  pick({
    id: 'ko-h-m1-l1-e8', prompt: PROMPT_LETTER, translation: same('eu'), options: ['ㅜ', 'ㅗ', 'ㅡ'], answer: 2,
    explain: l3('ㅡ — yotiq chiziq, lablar choʻzilmagan «u».', 'ㅡ — ётиқ чизиқ, лаблар чўзилмаган «у».', 'ㅡ — горизонтальная черта, «у» без вытянутых губ.')
  }),
  match('ko-h-m1-l1-e9', [
    ['ㅡ', same('eu')],
    ['ㅣ', same('i')],
    ['아이', l3('bola', 'бола', 'ребёнок')],
    ['오이', l3('bodring', 'бодринг', 'огурец')]
  ])
]
