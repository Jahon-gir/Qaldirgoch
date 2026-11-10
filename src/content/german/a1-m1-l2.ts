import { choice, l3, match, word } from './helpers'
import type { Exercise } from './types'

/** A1 · 1-modul · 2-dars: Xayrlashish */
export const A1_M1_L2: Exercise[] = [
  word({
    id: 'a1-m1-l2-e1', term: 'Tschüss', icon: 'door-exit',
    tr: l3('Xayr', 'Хайр', 'Пока'),
    pron: l3('chyus', 'чюс', 'чюс'),
    example: { de: 'Tschüss, Anna!', tr: l3('Xayr, Anna!', 'Хайр, Анна!', 'Пока, Анна!') }
  }),
  word({
    id: 'a1-m1-l2-e2', term: 'Auf Wiedersehen', icon: 'heart-handshake',
    tr: l3('Koʻrishguncha', 'Кўришгунча', 'До свидания'),
    pron: l3('auf vi-der-ze-en', 'ауф ви-дер-зе-ен', 'ауф ви-дер-зе-ен'),
    example: { de: 'Auf Wiedersehen, Herr Müller!', tr: l3('Koʻrishguncha, Myuller janob!', 'Кўришгунча, Мюллер жаноб!', 'До свидания, господин Мюллер!') }
  }),
  word({
    id: 'a1-m1-l2-e3', term: 'Bis morgen', icon: 'calendar-event',
    tr: l3('Ertagacha', 'Эртагача', 'До завтра'),
    pron: l3('bis mor-gen', 'бис мор-ген', 'бис мор-ген'),
    example: { de: 'Bis morgen, Anna!', tr: l3('Ertagacha, Anna!', 'Эртагача, Анна!', 'До завтра, Анна!') }
  }),
  word({
    id: 'a1-m1-l2-e4', term: 'Gute Nacht', icon: 'moon-stars',
    tr: l3('Xayrli tun', 'Хайрли тун', 'Спокойной ночи'),
    pron: l3('gu-te naxt', 'гу-те нахт', 'гу-те нахт'),
    example: { de: 'Gute Nacht, Anna!', tr: l3('Xayrli tun, Anna!', 'Хайрли тун, Анна!', 'Спокойной ночи, Анна!') }
  }),
  choice({
    id: 'a1-m1-l2-e5', sentence: 'Zum Chef sagen Sie: Auf ___!',
    translation: l3('Boshligʻingizga aytasiz: Koʻrishguncha!', 'Бошлиғингизга айтасиз: Кўришгунча!', 'Начальнику вы говорите: До свидания!'),
    options: ['Tschüss', 'Wiedersehen', 'Morgen'], answer: 1,
    explain: l3('«Auf Wiedersehen» — rasmiy xayrlashuv; boshliq bilan shunday deyiladi.', '«Auf Wiedersehen» — расмий хайрлашув; бошлиқ билан шундай дейилади.', '«Auf Wiedersehen» — вежливое прощание; с начальником говорят так.')
  }),
  choice({
    id: 'a1-m1-l2-e6', sentence: 'Vor dem Schlafen sagen Sie: ___ Nacht!',
    translation: l3('Uxlashdan oldin aytasiz: Xayrli tun!', 'Ухлашдан олдин айтасиз: Хайрли тун!', 'Перед сном вы говорите: Спокойной ночи!'),
    options: ['Guten', 'Guter', 'Gute'], answer: 2,
    explain: l3('«Nacht» — «die» soʻzi, shuning «Gute Nacht» deyiladi.', '«Nacht» — «die» сўзи, шунинг учун «Gute Nacht» дейилади.', '«Nacht» — слово с артиклем «die», поэтому говорят «Gute Nacht».')
  }),
  choice({
    id: 'a1-m1-l2-e7', sentence: 'Bis ___, Anna!',
    translation: l3('Ertagacha, Anna!', 'Эртагача, Анна!', 'До завтра, Анна!'),
    options: ['Hallo', 'Tschüss', 'morgen'], answer: 2,
    explain: l3('«Bis morgen» — ertagacha; bu yerda «morgen» kichik harf bilan yoziladi.', '«Bis morgen» — эртагача; бу ерда «morgen» кичик ҳарф билан ёзилади.', '«Bis morgen» — до завтра; здесь «morgen» пишется с маленькой буквы.')
  }),
  match('a1-m1-l2-e8', [
    ['Tschüss', l3('Xayr', 'Хайр', 'Пока')],
    ['Auf Wiedersehen', l3('Koʻrishguncha', 'Кўришгунча', 'До свидания')],
    ['Bis morgen', l3('Ertagacha', 'Эртагача', 'До завтра')],
    ['Gute Nacht', l3('Xayrli tun', 'Хайрли тун', 'Спокойной ночи')]
  ])
]
