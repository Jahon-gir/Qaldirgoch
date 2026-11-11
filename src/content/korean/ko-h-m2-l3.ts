import type { Exercise } from '../german/types'
import { l3, letter, syllable, word } from './helpers'

/** Hangul · 2-modul · 3-dars: Pastki harf (batchim) — boʻgʻin oxiridagi harf; 7 tovush. */
export const KO_H_M2_L3: Exercise[] = [
  letter({
    id: 'ko-h-m2-l3-e1',
    letters: [
      { char: 'ㄱ', sound: 'k' }, { char: 'ㄴ', sound: 'n' }, { char: 'ㄷ', sound: 't' }, { char: 'ㄹ', sound: 'l' },
      { char: 'ㅁ', sound: 'm' }, { char: 'ㅂ', sound: 'p' }, { char: 'ㅇ', sound: 'ng' }
    ],
    note: l3(
      'Pastki harf (batchim) — boʻgʻin oxiridagi harf. Boʻgʻin oxirida faqat 7 tovush chiqadi: k, n, t, l, m, p, ng. Boshqa harflar ham shularga oʻxshab oʻqiladi: oxirida ㅅ ㅈ ㅊ ㅌ ㅎ — «t», ㅋ ㄲ — «k», ㅍ — «p». Masalan 옷 — «ot».',
      'Пастки ҳарф (батчим) — бўғин охиридаги ҳарф. Бўғин охирида фақат 7 товуш чиқади: к, н, т, л, м, п, нг. Бошқа ҳарфлар ҳам шуларга ўхшаб ўқилади: охирида ㅅ ㅈ ㅊ ㅌ ㅎ — «т», ㅋ ㄲ — «к», ㅍ — «п». Масалан 옷 — «от».',
      'Нижняя буква (патчим) — буква в конце слога. В конце слога слышны только 7 звуков: к, н, т, л, м, п, нг. Остальные буквы читаются как они: в конце ㅅ ㅈ ㅊ ㅌ ㅎ — «т», ㅋ ㄲ — «к», ㅍ — «п». Например, 옷 — «от».'
    ),
    example: { term: '밥', pron: l3('bap', 'бап', 'бап'), tr: l3('guruch, ovqat', 'гуруч, овқат', 'рис, еда') }
  }),
  word({ id: 'ko-h-m2-l3-e2', term: '밥', slug: 'bap', icon: 'bowl', tr: l3('guruch, ovqat', 'гуруч, овқат', 'рис, еда'), pron: l3('bap', 'бап', 'бап') }),
  word({ id: 'ko-h-m2-l3-e3', term: '물', slug: 'mul', icon: 'droplet', tr: l3('suv', 'сув', 'вода'), pron: l3('mul', 'мул', 'мул') }),
  word({ id: 'ko-h-m2-l3-e4', term: '산', slug: 'san', icon: 'mountain', tr: l3('togʻ', 'тоғ', 'гора'), pron: l3('san', 'сан', 'сан') }),
  word({ id: 'ko-h-m2-l3-e5', term: '강', slug: 'gang', icon: 'wave-sine', tr: l3('daryo', 'дарё', 'река'), pron: l3('gang', 'ганг', 'ганг') }),
  word({ id: 'ko-h-m2-l3-e6', term: '집', slug: 'jip', icon: 'home', tr: l3('uy', 'уй', 'дом'), pron: l3('jip', 'жип', 'джип') }),
  word({ id: 'ko-h-m2-l3-e7', term: '문', slug: 'mun', icon: 'door', tr: l3('eshik', 'эшик', 'дверь'), pron: l3('mun', 'мун', 'мун') }),
  word({ id: 'ko-h-m2-l3-e8', term: '책', slug: 'chaek', icon: 'book', tr: l3('kitob', 'китоб', 'книга'), pron: l3('chek', 'чек', 'чэк') }),
  word({ id: 'ko-h-m2-l3-e9', term: '옷', slug: 'ot', icon: 'shirt', tr: l3('kiyim', 'кийим', 'одежда'), pron: l3('ot', 'от', 'от') }),
  word({ id: 'ko-h-m2-l3-e10', term: '가방', slug: 'gabang', icon: 'backpack', tr: l3('sumka', 'сумка', 'сумка'), pron: l3('ga-bang', 'га-банг', 'га-банг') }),
  word({ id: 'ko-h-m2-l3-e11', term: '사람', slug: 'saram', icon: 'user', tr: l3('odam', 'одам', 'человек'), pron: l3('sa-ram', 'са-рам', 'са-рам') }),
  word({ id: 'ko-h-m2-l3-e12', term: '김치', slug: 'gimchi', icon: 'soup', tr: l3('kimchi', 'кимчи', 'кимчи'), pron: l3('gim-chi', 'гим-чи', 'гим-чи') }),
  word({ id: 'ko-h-m2-l3-e13', term: '한국', slug: 'hanguk', icon: 'flag', tr: l3('Koreya', 'Корея', 'Корея'), pron: l3('han-guk', 'ҳан-гук', 'хан-гук') }),
  // Pastki harfli boʻgʻin: ㅂ + ㅏ + ㅂ = 밥 (3 katak)
  syllable({ id: 'ko-h-m2-l3-e14', initial: 'ㅂ', vowel: 'ㅏ', final: 'ㅂ', pron: l3('bap', 'бап', 'бап'), distractors: ['ㅁ', 'ㅗ'] })
]
