import { choice, l3, match, word } from './helpers'
import type { GermanExercise as Exercise } from './types'

/** A1 · 1-modul · 4-dars: Ismingiz va kasbingiz */
export const A1_M1_L4: Exercise[] = [
  word({
    id: 'a1-m1-l4-e1', term: 'der Elektriker', icon: 'bolt',
    tr: l3('elektrik', 'электрик', 'электрик'),
    pron: l3('der e-lek-tri-ker', 'дер э-лек-три-кер', 'дер э-лек-три-кер'),
    example: { term: 'Ich bin Elektriker.', tr: l3('Men elektrikman.', 'Мен электрикман.', 'Я электрик.') }
  }),
  word({
    id: 'a1-m1-l4-e2', term: 'der Mechaniker', icon: 'tools',
    tr: l3('mexanik', 'механик', 'механик'),
    pron: l3('der me-xa-ni-ker', 'дер ме-ха-ни-кер', 'дер ме-ха-ни-кер'),
    example: { term: 'Ich bin Mechaniker.', tr: l3('Men mexanikman.', 'Мен механикман.', 'Я механик.') }
  }),
  word({
    id: 'a1-m1-l4-e3', term: 'der Schweißer', icon: 'flame',
    tr: l3('payvandchi', 'пайвандчи', 'сварщик'),
    pron: l3('der shvay-ser', 'дер швай-сер', 'дер швай-сер'),
    example: { term: 'Ich bin Schweißer.', tr: l3('Men payvandchiman.', 'Мен пайвандчиман.', 'Я сварщик.') }
  }),
  word({
    id: 'a1-m1-l4-e4', term: 'die Pflegekraft', icon: 'stethoscope',
    tr: l3('parvarish xodimi', 'парвариш ходими', 'специалист по уходу'),
    pron: l3('di pfle-ge-kraft', 'ди пфле-ге-крафт', 'ди пфле-ге-крафт'),
    example: { term: 'Ich bin Pflegekraft.', tr: l3('Men parvarish xodimiman.', 'Мен парвариш ходимиман.', 'Я специалист по уходу.') }
  }),
  word({
    id: 'a1-m1-l4-e5', term: 'der Koch', icon: 'tools-kitchen-2',
    tr: l3('oshpaz', 'ошпаз', 'повар'),
    pron: l3('der kox', 'дер кох', 'дер кох'),
    example: { term: 'Ich bin Koch.', tr: l3('Men oshpazman.', 'Мен ошпазман.', 'Я повар.') }
  }),
  word({
    id: 'a1-m1-l4-e6', term: 'Wie heißen Sie?', icon: 'message-circle',
    tr: l3('Ismingiz nima?', 'Исмингиз нима?', 'Как вас зовут?'),
    pron: l3('vi hay-sen zi', 'ви хай-сен зи', 'ви хай-сен зи'),
    example: { term: 'Wie heißen Sie? – Ich heiße Max.', tr: l3('Ismingiz nima? – Mening ismim Maks.', 'Исмингиз нима? – Менинг исмим Макс.', 'Как вас зовут? – Меня зовут Макс.') }
  }),
  choice({
    id: 'a1-m1-l4-e7', sentence: 'Ich ___ Schweißer.',
    translation: l3('Men payvandchiman.', 'Мен пайвандчиман.', 'Я сварщик.'),
    options: ['bist', 'ist', 'bin'], answer: 2,
    explain: l3('Kasbni aytganda «ich bin» ishlatiladi; «ich heiße» esa ism uchun.', 'Касбни айтганда «ich bin» ишлатилади; «ich heiße» эса исм учун.', 'Профессию называют с «ich bin»; «ich heiße» — для имени.')
  }),
  choice({
    id: 'a1-m1-l4-e8', sentence: 'Wie ___ Sie?',
    translation: l3('Ismingiz nima?', 'Исмингиз нима?', 'Как вас зовут?'),
    options: ['heißen', 'heiße', 'heißt'], answer: 0,
    explain: l3('«Sie» bilan feʼl «heißen» shaklida turadi: Wie heißen Sie?', '«Sie» билан феъл «heißen» шаклида туради: Wie heißen Sie?', 'С «Sie» глагол стоит в форме «heißen»: Wie heißen Sie?')
  }),
  choice({
    id: 'a1-m1-l4-e9', sentence: 'Wie heißen Sie? – Ich ___ Max.',
    translation: l3('Ismingiz nima? – Mening ismim Maks.', 'Исмингиз нима? – Менинг исмим Макс.', 'Как вас зовут? – Меня зовут Макс.'),
    options: ['heißen', 'heiße', 'heißt'], answer: 1,
    explain: l3('Oʻzingiz haqingizda «ich heiße» deysiz.', 'Ўзингиз ҳақингизда «ich heiße» дейсиз.', 'О себе вы говорите «ich heiße».')
  }),
  match('a1-m1-l4-e10', [
    ['der Elektriker', l3('elektrik', 'электрик', 'электрик')],
    ['der Schweißer', l3('payvandchi', 'пайвандчи', 'сварщик')],
    ['die Pflegekraft', l3('parvarish xodimi', 'парвариш ходими', 'специалист по уходу')],
    ['der Koch', l3('oshpaz', 'ошпаз', 'повар')]
  ])
]
