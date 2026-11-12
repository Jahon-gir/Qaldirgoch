import type { Exercise } from '../german/types'
import { l3, letter, syllable, word } from './helpers'

/** Hangul · 2-modul · 2-dars: Murakkab unlilar (ㅘ ㅝ ㅙ ㅞ ㅚ ㅟ ㅢ ㅒ ㅖ). ㅗ/ㅜ + boshqa unli = tez qoʻshilgan bitta boʻgʻin. */
export const KO_H_M2_L2: Exercise[] = [
  letter({
    id: 'ko-h-m2-l2-e1',
    letters: [{ char: 'ㅘ', sound: 'wa' }, { char: 'ㅝ', sound: 'wo' }, { char: 'ㅙ', sound: 'wae' }, { char: 'ㅞ', sound: 'we' }, { char: 'ㅚ', sound: 'oe' }],
    note: l3(
      'ㅗ yoki ㅜ ga boshqa unli qoʻshilsa, ikkalasi tez qoʻshilib bitta boʻgʻin boʻladi. Lablar yumaloq, tez oʻtiladi — oʻzbekcha «v» dan yumshoq (ㅘ ≈ «va»). ㅚ, ㅙ va ㅞ bugun deyarli bir xil — «ve».',
      'ㅗ ёки ㅜ га бошқа унли қўшилса, иккаласи тез қўшилиб битта бўғин бўлади. Лаблар юмалоқ, тез ўтилади — ўзбекча «в» дан юмшоқ (ㅘ ≈ «ва»). ㅚ, ㅙ ва ㅞ бугун деярли бир хил — «ве».',
      'Если к ㅗ или ㅜ добавить другую гласную, они быстро сливаются в один слог. Губы округлены, переход быстрый — мягче русского «в» (ㅘ ≈ «ва»). ㅚ, ㅙ и ㅞ сегодня звучат почти одинаково — «ве».'
    ),
    example: { term: '사과', pron: l3('sa-gva', 'са-гва', 'са-гва'), tr: l3('olma', 'олма', 'яблоко') }
  }),
  letter({
    id: 'ko-h-m2-l2-e2',
    letters: [{ char: 'ㅟ', sound: 'wi' }, { char: 'ㅢ', sound: 'ui' }, { char: 'ㅒ', sound: 'yae' }, { char: 'ㅖ', sound: 'ye' }],
    note: l3(
      'ㅟ — «vi». ㅢ — «ui»: ikki tovush tez aytiladi. ㅒ va ㅖ — «ye», deyarli bir xil. 시계 kabi soʻzlarda ㅖ undoshdan keyin oddiy «e» boʻlib oʻqiladi: «si-ge».',
      'ㅟ — «ви». ㅢ — «уи»: икки товуш тез айтилади. ㅒ ва ㅖ — «йе», деярли бир хил. 시계 каби сўзларда ㅖ ундошдан кейин оддий «е» бўлиб ўқилади: «си-ге».',
      'ㅟ — «ви». ㅢ — «ui»: два звука произносятся быстро. ㅒ и ㅖ — «йэ», почти одинаковы. В словах вроде 시계 ㅖ после согласной читается как обычное «э»: «си-гэ».'
    ),
    example: { term: '의사', pron: l3('ui-sa', 'уи-са', 'уи-са'), tr: l3('shifokor', 'шифокор', 'врач') }
  }),
  word({ id: 'ko-h-m2-l2-e3', term: '사과', slug: 'sagwa', icon: 'apple', tr: l3('olma', 'олма', 'яблоко'), pron: l3('sa-gva', 'са-гва', 'са-гва') }),
  word({ id: 'ko-h-m2-l2-e4', term: '과자', slug: 'gwaja', icon: 'cookie', tr: l3('pechenye', 'печенье', 'печенье'), pron: l3('gva-ja', 'гва-жа', 'гва-джа') }),
  word({ id: 'ko-h-m2-l2-e5', term: '회사', slug: 'hoesa', icon: 'building', tr: l3('kompaniya', 'компания', 'компания'), pron: l3('hve-sa', 'ҳве-са', 'хве-са') }),
  word({ id: 'ko-h-m2-l2-e6', term: '의사', slug: 'uisa', icon: 'stethoscope', tr: l3('shifokor', 'шифокор', 'врач'), pron: l3('ui-sa', 'уи-са', 'уи-са') }),
  word({ id: 'ko-h-m2-l2-e7', term: '의자', slug: 'uija', icon: 'armchair', tr: l3('stul', 'стул', 'стул'), pron: l3('ui-ja', 'уи-жа', 'уи-джа') }),
  word({ id: 'ko-h-m2-l2-e8', term: '쥐', slug: 'jwi', icon: 'paw', tr: l3('sichqon', 'сичқон', 'мышь'), pron: l3('jvi', 'жви', 'джви') }),
  word({ id: 'ko-h-m2-l2-e9', term: '시계', slug: 'sigye', icon: 'clock', tr: l3('soat', 'соат', 'часы'), pron: l3('si-ge', 'си-ге', 'си-гэ') }),
  word({ id: 'ko-h-m2-l2-e10', term: '돼지', slug: 'dwaeji', icon: 'pig', tr: l3('choʻchqa', 'чўчқа', 'свинья'), pron: l3('dve-ji', 'две-жи', 'двэ-джи') }),
  word({ id: 'ko-h-m2-l2-e11', term: '예', slug: 'ye', icon: 'check', tr: l3('ha (rasmiy)', 'ҳа (расмий)', 'да (вежливо)'), pron: l3('ye', 'йе', 'йэ') }),
  // Murakkab unli — bitta tugma (ㅘ qismlarga boʻlinmaydi)
  syllable({ id: 'ko-h-m2-l2-e12', initial: 'ㄱ', vowel: 'ㅘ', pron: l3('gva', 'гва', 'гва'), distractors: ['ㅝ', 'ㅏ'] })
]
