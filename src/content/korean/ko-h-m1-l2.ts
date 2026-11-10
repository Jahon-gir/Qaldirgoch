import type { Exercise } from '../german/types'
import { l3, letter, match, word } from './helpers'

/** Hangul · 1-modul · 2-dars: Asosiy undoshlar (ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅈ ㅎ). Harf kartasida 2–3 harf. */
export const KO_H_M1_L2: Exercise[] = [
  letter({
    id: 'ko-h-m1-l2-e1',
    letters: [{ char: 'ㄱ', sound: 'g / k' }, { char: 'ㄷ', sound: 'd / t' }, { char: 'ㅂ', sound: 'b / p' }],
    note: l3(
      'Soʻz boshida yumshoq k, t, p ga yaqin; unlilar orasida g, d, b boʻlib eshitiladi.',
      'Сўз бошида юмшоқ к, т, п га яқин; унлилар орасида г, д, б бўлиб эшитилади.',
      'В начале слова близки к мягким к, т, п; между гласными звучат как г, д, б.'
    ),
    example: { term: '고기', pron: l3('goʻ-gi', 'гў-ги', 'го-ги'), tr: l3('goʻsht', 'гўшт', 'мясо') }
  }),
  letter({
    id: 'ko-h-m1-l2-e2',
    letters: [{ char: 'ㄴ', sound: 'n' }, { char: 'ㅁ', sound: 'm' }, { char: 'ㄹ', sound: 'r / l' }],
    note: l3(
      'ㄹ unlidan oldin yumshoq «r», boʻgʻin oxirida «l» boʻladi.',
      'ㄹ унлидан олдин юмшоқ «р», бўғин охирида «л» бўлади.',
      'ㄹ перед гласной — мягкое «р», в конце слога — «л».'
    ),
    example: { term: '나라', pron: l3('na-ra', 'на-ра', 'на-ра'), tr: l3('mamlakat', 'мамлакат', 'страна') }
  }),
  letter({
    id: 'ko-h-m1-l2-e3',
    letters: [{ char: 'ㅅ', sound: 's' }, { char: 'ㅈ', sound: 'j' }, { char: 'ㅎ', sound: 'h' }],
    note: l3(
      'ㅈ — oʻzbekcha «j» (jon) ga yaqin. ㅎ — yengil «h».',
      'ㅈ — ўзбекча «ж» (жон) га яқин. ㅎ — енгил «ҳ».',
      'ㅈ — близко к «дж». ㅎ — лёгкое «х».'
    ),
    example: { term: '모자', pron: l3('moʻ-ja', 'мў-жа', 'мо-джа'), tr: l3('shapka', 'шапка', 'шапка') }
  }),
  word({ id: 'ko-h-m1-l2-e4', term: '나', slug: 'na', icon: 'user', tr: l3('men', 'мен', 'я'), pron: l3('na', 'на', 'на') }),
  word({ id: 'ko-h-m1-l2-e5', term: '나라', slug: 'nara', icon: 'flag', tr: l3('mamlakat', 'мамлакат', 'страна'), pron: l3('na-ra', 'на-ра', 'на-ра') }),
  word({ id: 'ko-h-m1-l2-e6', term: '어머니', slug: 'eomeoni', icon: 'woman', tr: l3('ona', 'она', 'мама'), pron: l3('o-mo-ni', 'о-мо-ни', 'о-мо-ни') }),
  word({ id: 'ko-h-m1-l2-e7', term: '아버지', slug: 'abeoji', icon: 'man', tr: l3('ota', 'ота', 'папа'), pron: l3('a-bo-ji', 'а-бо-жи', 'а-бо-джи') }),
  word({ id: 'ko-h-m1-l2-e8', term: '고기', slug: 'gogi', icon: 'meat', tr: l3('goʻsht', 'гўшт', 'мясо'), pron: l3('goʻ-gi', 'гў-ги', 'го-ги') }),
  word({ id: 'ko-h-m1-l2-e9', term: '바다', slug: 'bada', icon: 'ripple', tr: l3('dengiz', 'денгиз', 'море'), pron: l3('ba-da', 'ба-да', 'ба-да') }),
  word({ id: 'ko-h-m1-l2-e10', term: '모자', slug: 'moja', icon: 'hanger', tr: l3('shapka', 'шапка', 'шапка'), pron: l3('moʻ-ja', 'мў-жа', 'мо-джа') }),
  word({ id: 'ko-h-m1-l2-e11', term: '지도', slug: 'jido', icon: 'map', tr: l3('xarita', 'харита', 'карта'), pron: l3('ji-doʻ', 'жи-дў', 'джи-до') }),
  match('ko-h-m1-l2-e12', [
    ['ㄱ', l3('g / k', 'g / k', 'g / k')],
    ['ㄴ', l3('n', 'n', 'n')],
    ['ㄹ', l3('r / l', 'r / l', 'r / l')],
    ['ㅎ', l3('h', 'h', 'h')]
  ])
]
