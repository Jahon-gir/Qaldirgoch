import { choice, l3, match, word } from './helpers'
import type { GermanExercise as Exercise } from './types'

/** A1 · 1-modul · 1-dars: Salomlashish */
export const A1_M1_L1: Exercise[] = [
  word({
    id: 'a1-m1-l1-e1', term: 'Hallo', icon: 'hand-stop',
    tr: l3('Salom', 'Салом', 'Привет'),
    pron: l3('ha-lo', 'ха-ло', 'ха-ло'),
    example: { term: 'Hallo, Anna!', tr: l3('Salom, Anna!', 'Салом, Анна!', 'Привет, Анна!') }
  }),
  word({
    id: 'a1-m1-l1-e2', term: 'Guten Morgen', icon: 'sunrise',
    tr: l3('Xayrli tong', 'Хайрли тонг', 'Доброе утро'),
    pron: l3('gu-ten mor-gen', 'гу-тен мор-ген', 'гу-тен мор-ген'),
    example: { term: 'Guten Morgen, Frau Schmidt!', tr: l3('Xayrli tong, Shmidt xonim!', 'Хайрли тонг, Шмидт хоним!', 'Доброе утро, госпожа Шмидт!') }
  }),
  word({
    id: 'a1-m1-l1-e3', term: 'Guten Tag', icon: 'sun',
    tr: l3('Xayrli kun', 'Хайрли кун', 'Добрый день'),
    pron: l3('gu-ten tak', 'гу-тен так', 'гу-тен так'),
    example: { term: 'Guten Tag, Herr Müller!', tr: l3('Xayrli kun, Myuller janob!', 'Хайрли кун, Мюллер жаноб!', 'Добрый день, господин Мюллер!') }
  }),
  word({
    id: 'a1-m1-l1-e4', term: 'Guten Abend', icon: 'sunset-2',
    tr: l3('Xayrli kech', 'Хайрли кеч', 'Добрый вечер'),
    pron: l3('gu-ten a-bent', 'гу-тен а-бент', 'гу-тен а-бент'),
    example: { term: 'Guten Abend, Frau Weber!', tr: l3('Xayrli kech, Veber xonim!', 'Хайрли кеч, Вебер хоним!', 'Добрый вечер, госпожа Вебер!') }
  }),
  choice({
    id: 'a1-m1-l1-e5', sentence: 'Es ist 8 Uhr morgens. Sie sagen: Guten ___!',
    translation: l3('Ertalab soat 8. Siz aytasiz: Xayrli tong!', 'Эрталаб соат 8. Сиз айтасиз: Хайрли тонг!', 'Сейчас 8 утра. Вы говорите: Доброе утро!'),
    options: ['Abend', 'Morgen', 'Tag'], answer: 1,
    explain: l3('«Morgen» — ertalab; ertalab «Guten Morgen» deyiladi.', '«Morgen» — эрталаб; эрталаб «Guten Morgen» дейилади.', '«Morgen» — утро; утром говорят «Guten Morgen».')
  }),
  choice({
    id: 'a1-m1-l1-e6', sentence: 'Mittags sagen Sie: Guten ___!',
    translation: l3('Tushda siz aytasiz: Xayrli kun!', 'Тушда сиз айтасиз: Хайрли кун!', 'В полдень вы говорите: Добрый день!'),
    options: ['Tag', 'Morgen', 'Nacht'], answer: 0,
    explain: l3('Kunduzi «Guten Tag» deyiladi; «Tag» — kun.', 'Кундузи «Guten Tag» дейилади; «Tag» — кун.', 'Днём говорят «Guten Tag»; «Tag» — день.')
  }),
  choice({
    id: 'a1-m1-l1-e7', sentence: '___ Abend, Herr Müller!',
    translation: l3('Xayrli kech, Myuller janob!', 'Хайрли кеч, Мюллер жаноб!', 'Добрый вечер, господин Мюллер!'),
    options: ['Gute', 'Guten', 'Gut'], answer: 1,
    explain: l3('Salomlashuvda «Guten Abend» deyiladi: «Abend» oldidan «Guten» keladi.', 'Саломлашувда «Guten Abend» дейилади: «Abend» олдидан «Guten» келади.', 'В приветствии говорят «Guten Abend»: перед «Abend» стоит «Guten».')
  }),
  match('a1-m1-l1-e8', [
    ['Hallo', l3('Salom', 'Салом', 'Привет')],
    ['Guten Morgen', l3('Xayrli tong', 'Хайрли тонг', 'Доброе утро')],
    ['Guten Tag', l3('Xayrli kun', 'Хайрли кун', 'Добрый день')],
    ['Guten Abend', l3('Xayrli kech', 'Хайрли кеч', 'Добрый вечер')]
  ])
]
