import type { Exercise } from '../german/types'
import { l3, letter, match, same, word } from './helpers'

/** Hangul · 1-modul · 5-dars: Y-li unlilar (ㅑ ㅕ ㅛ ㅠ) va ㅐ ㅔ. */
export const KO_H_M1_L5: Exercise[] = [
  letter({
    id: 'ko-h-m1-l5-e1',
    letters: [{ char: 'ㅑ', sound: 'ya' }, { char: 'ㅕ', sound: 'yeo' }, { char: 'ㅛ', sound: 'yo' }],
    note: l3(
      'Unliga ikkinchi chiziq qoʻshilsa, oldiga «y» qoʻshiladi: ㅏ → ㅑ, ㅓ → ㅕ, ㅗ → ㅛ.',
      'Унлига иккинчи чизиқ қўшилса, олдига «й» қўшилади: ㅏ → ㅑ, ㅓ → ㅕ, ㅗ → ㅛ.',
      'Вторая черта добавляет «й» перед гласной: ㅏ → ㅑ, ㅓ → ㅕ, ㅗ → ㅛ.'
    ),
    example: { term: '요리', pron: l3('yoʻ-ri', 'йў-ри', 'ё-ри'), tr: l3('taom pishirish', 'таом пишириш', 'готовка') }
  }),
  letter({
    id: 'ko-h-m1-l5-e2',
    letters: [{ char: 'ㅠ', sound: 'yu' }, { char: 'ㅐ', sound: 'ae' }, { char: 'ㅔ', sound: 'e' }],
    note: l3(
      'ㅠ — «yu» (ㅜ + y). ㅐ va ㅔ bugungi talaffuzda deyarli bir xil — «e».',
      'ㅠ — «ю» (ㅜ + й). ㅐ ва ㅔ бугунги талаффузда деярли бир хил — «е».',
      'ㅠ — «ю» (ㅜ + й). ㅐ и ㅔ в современном произношении почти одинаковы — «э».'
    ),
    example: { term: '노래', pron: l3('noʻ-re', 'нў-ре', 'но-рэ'), tr: l3('qoʻshiq', 'қўшиқ', 'песня') }
  }),
  word({ id: 'ko-h-m1-l5-e3', term: '우유', slug: 'uyu', icon: 'milk', tr: l3('sut', 'сут', 'молоко'), pron: l3('u-yu', 'у-ю', 'у-ю') }),
  word({ id: 'ko-h-m1-l5-e4', term: '여자', slug: 'yeoja', icon: 'gender-female', tr: l3('ayol', 'аёл', 'женщина'), pron: l3('yo-ja', 'ё-жа', 'ё-джа') }),
  word({ id: 'ko-h-m1-l5-e5', term: '요리', slug: 'yori', icon: 'chef-hat', tr: l3('taom pishirish', 'таом пишириш', 'готовка'), pron: l3('yoʻ-ri', 'йў-ри', 'ё-ри') }),
  word({ id: 'ko-h-m1-l5-e6', term: '휴지', slug: 'hyuji', icon: 'toilet-paper', tr: l3('salfetka', 'салфетка', 'салфетка'), pron: l3('hyu-ji', 'ҳю-жи', 'хю-джи') }),
  word({ id: 'ko-h-m1-l5-e7', term: '노래', slug: 'norae', icon: 'music', tr: l3('qoʻshiq', 'қўшиқ', 'песня'), pron: l3('noʻ-re', 'нў-ре', 'но-рэ') }),
  word({ id: 'ko-h-m1-l5-e8', term: '네', slug: 'ne', icon: 'check', tr: l3('ha', 'ҳа', 'да'), pron: l3('ne', 'не', 'нэ') }),
  word({ id: 'ko-h-m1-l5-e9', term: '개', slug: 'gae', icon: 'dog', tr: l3('it', 'ит', 'собака'), pron: l3('ge', 'ге', 'гэ') }),
  match('ko-h-m1-l5-e10', [
    ['ㅑ', same('ya')],
    ['ㅕ', same('yeo')],
    ['ㅛ', same('yo')],
    ['ㅠ', same('yu')]
  ])
]
