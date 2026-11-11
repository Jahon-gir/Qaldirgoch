import type { Exercise } from '../german/types'
import { l3, letter, match, pick, PROMPT_SIGN, word } from './helpers'

/** Hangul · 2-modul · 5-dars: Birinchi soʻzlar va belgilar — koʻchada va ish joyida koʻriladigan yozuvlar. */
export const KO_H_M2_L5: Exercise[] = [
  letter({
    id: 'ko-h-m2-l5-e1',
    letters: [{ char: '입구', sound: 'ip-kku' }, { char: '감사합니다', sound: 'gam-sa-ham-ni-da' }],
    note: l3(
      'Yozuv va talaffuz farq qilishi mumkin: 입구 da ㄱ «kk» boʻlib, 감사합니다 da ㅂ «m» boʻlib oʻqiladi. Tinglab oʻrganing.',
      'Ёзув ва талаффуз фарқ қилиши мумкин: 입구 да ㄱ «кк» бўлиб, 감사합니다 да ㅂ «м» бўлиб ўқилади. Тинглаб ўрганинг.',
      'Написание и произношение могут различаться: в 입구 буква ㄱ читается как «кк», а в 감사합니다 буква ㅂ — как «м». Учите на слух.'
    )
  }),
  word({ id: 'ko-h-m2-l5-e2', term: '출구', slug: 'chulgu', icon: 'door-exit', tr: l3('chiqish', 'чиқиш', 'выход'), pron: l3('chul-gu', 'чул-гу', 'чул-гу') }),
  word({ id: 'ko-h-m2-l5-e3', term: '입구', slug: 'ipgu', icon: 'door-enter', tr: l3('kirish', 'кириш', 'вход'), pron: l3('ip-kku', 'ип-кку', 'ип-кку') }),
  word({ id: 'ko-h-m2-l5-e4', term: '비상구', slug: 'bisanggu', icon: 'run', tr: l3('favqulodda chiqish', 'фавқулодда чиқиш', 'аварийный выход'), pron: l3('bi-sang-gu', 'би-санг-гу', 'би-санг-гу') }),
  word({ id: 'ko-h-m2-l5-e5', term: '화장실', slug: 'hwajangsil', icon: 'toilet-paper', tr: l3('hojatxona', 'ҳожатхона', 'туалет'), pron: l3('hva-jang-sil', 'ҳва-жанг-сил', 'хва-джанг-сил') }),
  word({ id: 'ko-h-m2-l5-e6', term: '위험', slug: 'wiheom', icon: 'alert-triangle', tr: l3('xavf, xavfli', 'хавф, хавфли', 'опасность, опасно'), pron: l3('vi-hom', 'ви-ҳом', 'ви-хом') }),
  word({ id: 'ko-h-m2-l5-e7', term: '금연', slug: 'geumyeon', icon: 'smoking-no', tr: l3('chekish mumkin emas', 'чекиш мумкин эмас', 'курить запрещено'), pron: l3('geu-myon', 'гэу-мён', 'гы-мён') }),
  word({ id: 'ko-h-m2-l5-e8', term: '안녕하세요', slug: 'annyeonghaseyo', icon: 'hand-stop', tr: l3('salom', 'салом', 'здравствуйте'), pron: l3('an-nyong-ha-se-yoʻ', 'ан-нён-ҳа-се-йў', 'ан-нён-ха-сэ-ё') }),
  word({ id: 'ko-h-m2-l5-e9', term: '감사합니다', slug: 'gamsahamnida', icon: 'heart-handshake', tr: l3('rahmat', 'раҳмат', 'спасибо'), pron: l3('gam-sa-ham-ni-da', 'гам-са-ҳам-ни-да', 'гам-са-хам-ни-да') }),
  pick({
    id: 'ko-h-m2-l5-e10', prompt: PROMPT_SIGN, translation: l3('Chiqish', 'Чиқиш', 'Выход'), options: ['입구', '출구', '비상구'], answer: 1,
    explain: l3(
      '출구 — chiqish. 입구 — kirish, 비상구 — favqulodda chiqish.',
      '출구 — чиқиш. 입구 — кириш, 비상구 — фавқулодда чиқиш.',
      '출구 — выход. 입구 — вход, 비상구 — аварийный выход.'
    )
  }),
  match('ko-h-m2-l5-e11', [
    ['출구', l3('chiqish', 'чиқиш', 'выход')],
    ['입구', l3('kirish', 'кириш', 'вход')],
    ['비상구', l3('favqulodda chiqish', 'фавқулодда чиқиш', 'аварийный выход')],
    ['화장실', l3('hojatxona', 'ҳожатхона', 'туалет')]
  ]),
  match('ko-h-m2-l5-e12', [
    ['위험', l3('xavf, xavfli', 'хавф, хавфли', 'опасность, опасно')],
    ['금연', l3('chekish mumkin emas', 'чекиш мумкин эмас', 'курить запрещено')],
    ['안녕하세요', l3('salom', 'салом', 'здравствуйте')],
    ['감사합니다', l3('rahmat', 'раҳмат', 'спасибо')]
  ])
]
