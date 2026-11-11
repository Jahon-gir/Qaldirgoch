import type { Exercise } from '../german/types'
import { l3, letter, match, pick, PROMPT_LETTER, same, word } from './helpers'

/** Hangul · 2-modul · 1-dars: Qattiq undoshlar (ㄲ ㄸ ㅃ ㅆ ㅉ) — yumshoq va nafasli bilan solishtirish. */
export const KO_H_M2_L1: Exercise[] = [
  letter({
    id: 'ko-h-m2-l1-e1',
    letters: [{ char: 'ㄲ', sound: 'kk' }, { char: 'ㄸ', sound: 'tt' }, { char: 'ㅃ', sound: 'pp' }, { char: 'ㅆ', sound: 'ss' }, { char: 'ㅉ', sound: 'jj' }],
    note: l3(
      'Qattiq undoshlar: boʻgʻiz siqiladi, havo chiqmaydi, tovush qisqa va keskin. Yumshoq harfning ikkitasi yonma-yon yoziladi: ㄱ → ㄲ, ㄷ → ㄸ, ㅂ → ㅃ, ㅅ → ㅆ, ㅈ → ㅉ.',
      'Қаттиқ ундошлар: бўғиз сиқилади, ҳаво чиқмайди, товуш қисқа ва кескин. Юмшоқ ҳарфнинг иккитаси ёнма-ён ёзилади: ㄱ → ㄲ, ㄷ → ㄸ, ㅂ → ㅃ, ㅅ → ㅆ, ㅈ → ㅉ.',
      'Напряжённые согласные: горло сжато, воздуха почти нет, звук короткий и резкий. Это удвоенная мягкая буква: ㄱ → ㄲ, ㄷ → ㄸ, ㅂ → ㅃ, ㅅ → ㅆ, ㅈ → ㅉ.'
    ),
    example: { term: '아빠', pron: l3('a-ppa', 'а-ппа', 'а-ппа'), tr: l3('dadajon', 'дадажон', 'папа') }
  }),
  letter({
    id: 'ko-h-m2-l1-e2',
    letters: [
      { char: '가', sound: 'ga' }, { char: '카', sound: 'ka' }, { char: '까', sound: 'kka' },
      { char: '다', sound: 'da' }, { char: '타', sound: 'ta' }, { char: '따', sound: 'tta' },
      { char: '바', sound: 'ba' }, { char: '파', sound: 'pa' }, { char: '빠', sound: 'ppa' }
    ],
    note: l3(
      'Har qatorda uchta tovush: yumshoq (ga), nafasli — havo bilan (ka), qattiq — havosiz (kka). Ular turli soʻz yasaydi, shuning uchun farqini eshiting.',
      'Ҳар қаторда учта товуш: юмшоқ (га), нафасли — ҳаво билан (ка), қаттиқ — ҳавосиз (кка). Улар турли сўз ясайди, шунинг учун фарқини эшитинг.',
      'В каждой строке три звука: мягкий (га), придыхательный — с воздухом (ка), напряжённый — без воздуха (кка). Они различают слова, поэтому слушайте разницу.'
    )
  }),
  word({ id: 'ko-h-m2-l1-e3', term: '아빠', slug: 'appa', icon: 'man', tr: l3('dadajon', 'дадажон', 'папа'), pron: l3('a-ppa', 'а-ппа', 'а-ппа') }),
  word({ id: 'ko-h-m2-l1-e4', term: '오빠', slug: 'oppa', icon: 'man', tr: l3('aka (qiz tilidan)', 'ака (қиз тилидан)', 'старший брат (в речи девушки)'), pron: l3('oʻ-ppa', 'ў-ппа', 'о-ппа') }),
  word({ id: 'ko-h-m2-l1-e5', term: '토끼', slug: 'tokki', icon: 'paw', tr: l3('quyon', 'қуён', 'кролик'), pron: l3('toʻ-kki', 'тў-кки', 'то-кки') }),
  word({ id: 'ko-h-m2-l1-e6', term: '꼬리', slug: 'kkori', icon: 'paw', tr: l3('dum', 'дум', 'хвост'), pron: l3('kkoʻ-ri', 'ккў-ри', 'кко-ри') }),
  word({ id: 'ko-h-m2-l1-e7', term: '어깨', slug: 'eokkae', icon: 'user', tr: l3('yelka', 'елка', 'плечо'), pron: l3('o-kke', 'о-кке', 'о-ккэ') }),
  word({
    id: 'ko-h-m2-l1-e8', term: '아저씨', slug: 'ajeossi', icon: 'mood-smile',
    tr: l3('amaki (katta yoshli erkakka murojaat)', 'амаки (катта ёшли эркакка мурожаат)', 'дядя (обращение к взрослому мужчине)'),
    pron: l3('a-jo-ssi', 'а-жо-сси', 'а-джо-сси')
  }),
  word({ id: 'ko-h-m2-l1-e9', term: '뿌리', slug: 'ppuri', icon: 'plant', tr: l3('ildiz', 'илдиз', 'корень'), pron: l3('ppu-ri', 'ппу-ри', 'ппу-ри') }),
  word({ id: 'ko-h-m2-l1-e10', term: '가짜', slug: 'gajja', icon: 'alert-triangle', tr: l3('soxta', 'сохта', 'поддельный'), pron: l3('ga-jja', 'га-жжа', 'га-дджа') }),
  pick({
    id: 'ko-h-m2-l1-e11', prompt: PROMPT_LETTER, translation: same('kka'), options: ['가', '카', '까'], answer: 2,
    explain: l3(
      '까 — qattiq: ㄱ ning ikkitasi, havosiz va keskin. 가 — yumshoq, 카 — havo bilan.',
      '까 — қаттиқ: ㄱ нинг иккитаси, ҳавосиз ва кескин. 가 — юмшоқ, 카 — ҳаво билан.',
      '까 — напряжённый: двойная ㄱ, без воздуха и резко. 가 — мягкий, 카 — с воздухом.'
    )
  }),
  match('ko-h-m2-l1-e12', [
    ['ㄲ', same('kk')],
    ['ㄸ', same('tt')],
    ['ㅃ', same('pp')],
    ['ㅉ', same('jj')]
  ])
]
