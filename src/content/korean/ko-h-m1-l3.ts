import type { Exercise } from '../german/types'
import { l3, letter, syllable, word } from './helpers'

/** Hangul · 1-modul · 3-dars: Boʻgʻin yasash. Tik unlilar (ㅏ ㅓ ㅣ) undoshning oʻngida, yotiq unlilar (ㅗ ㅜ ㅡ) ostida. */
export const KO_H_M1_L3: Exercise[] = [
  letter({
    id: 'ko-h-m1-l3-e1',
    letters: [{ char: '나', sound: 'n + a' }, { char: '노', sound: 'n + o' }],
    note: l3(
      'Boʻgʻin — bitta blok. Tik unlilar (ㅏ ㅓ ㅣ) undoshning oʻngiga, yotiq unlilar (ㅗ ㅜ ㅡ) ostiga yoziladi.',
      'Бўғин — битта блок. Тик унлилар (ㅏ ㅓ ㅣ) ундошнинг ўнгига, ётиқ унлилар (ㅗ ㅜ ㅡ) остига ёзилади.',
      'Слог — один блок. Вертикальные гласные (ㅏ ㅓ ㅣ) пишутся справа от согласной, горизонтальные (ㅗ ㅜ ㅡ) — под ней.'
    ),
    example: { term: '하나', pron: l3('ha-na', 'ҳа-на', 'ха-на'), tr: l3('bir', 'бир', 'один') }
  }),
  syllable({ id: 'ko-h-m1-l3-e2', initial: 'ㄴ', vowel: 'ㅏ', pron: l3('na', 'на', 'на'), distractors: ['ㅗ', 'ㄹ'] }),
  syllable({ id: 'ko-h-m1-l3-e3', initial: 'ㄷ', vowel: 'ㅜ', pron: l3('du', 'ду', 'ду'), distractors: ['ㅗ', 'ㅈ'] }),
  syllable({ id: 'ko-h-m1-l3-e4', initial: 'ㄷ', vowel: 'ㅣ', pron: l3('di', 'ди', 'ди'), distractors: ['ㅏ', 'ㄹ'] }),
  syllable({ id: 'ko-h-m1-l3-e5', initial: 'ㅈ', vowel: 'ㅏ', pron: l3('ja', 'жа', 'джа'), distractors: ['ㅗ', 'ㅅ'] }),
  syllable({ id: 'ko-h-m1-l3-e6', initial: 'ㅂ', vowel: 'ㅜ', pron: l3('bu', 'бу', 'бу'), distractors: ['ㅏ', 'ㄷ'] }),
  word({ id: 'ko-h-m1-l3-e7', term: '하나', slug: 'hana', icon: 'number-1', tr: l3('bir', 'бир', 'один'), pron: l3('ha-na', 'ҳа-на', 'ха-на') }),
  word({ id: 'ko-h-m1-l3-e8', term: '두부', slug: 'dubu', icon: 'square', tr: l3('tofu', 'тофу', 'тофу'), pron: l3('du-bu', 'ду-бу', 'ду-бу') }),
  word({ id: 'ko-h-m1-l3-e9', term: '라디오', slug: 'radio', icon: 'radio', tr: l3('radio', 'радио', 'радио'), pron: l3('ra-di-oʻ', 'ра-ди-ў', 'ра-ди-о') }),
  word({ id: 'ko-h-m1-l3-e10', term: '사자', slug: 'saja', icon: 'paw', tr: l3('sher', 'шер', 'лев'), pron: l3('sa-ja', 'са-жа', 'са-джа') })
]
