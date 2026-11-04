import { choice, l3 } from './helpers'
import type { Exercise } from './types'

/** A1 · 1-modul · 6-dars: Modul testi (1–5-darslardan 10 savol) */
export const A1_M1_L6: Exercise[] = [
  choice({
    id: 'a1-m1-l6-e1', sentence: 'Am Morgen sagen Sie: Guten ___!',
    translation: l3('Ertalab siz aytasiz: Xayrli tong!', 'Эрталаб сиз айтасиз: Хайрли тонг!', 'Утром вы говорите: Доброе утро!'),
    options: ['Abend', 'Tag', 'Morgen'], answer: 2,
    explain: l3('«Morgen» — ertalab: Guten Morgen.', '«Morgen» — эрталаб: Guten Morgen.', '«Morgen» — утро: Guten Morgen.')
  }),
  choice({
    id: 'a1-m1-l6-e2', sentence: 'Zur Lehrerin sagen Sie: Auf ___!',
    translation: l3('Oʻqituvchiga aytasiz: Koʻrishguncha!', 'Ўқитувчига айтасиз: Кўришгунча!', 'Учительнице вы говорите: До свидания!'),
    options: ['Wiedersehen', 'Hallo', 'Tschüss'], answer: 0,
    explain: l3('Rasmiy xayrlashuv — «Auf Wiedersehen».', 'Расмий хайрлашув — «Auf Wiedersehen».', 'Вежливое прощание — «Auf Wiedersehen».')
  }),
  choice({
    id: 'a1-m1-l6-e3', sentence: '___ Nacht, Anna!',
    translation: l3('Xayrli tun, Anna!', 'Хайрли тун, Анна!', 'Спокойной ночи, Анна!'),
    options: ['Guten', 'Gute', 'Gut'], answer: 1,
    explain: l3('«Nacht» — «die» soʻzi, shuning «Gute Nacht».', '«Nacht» — «die» сўзи, шунинг учун «Gute Nacht».', '«Nacht» — слово с артиклем «die», поэтому «Gute Nacht».')
  }),
  choice({
    id: 'a1-m1-l6-e4', sentence: 'Bis ___, Max!',
    translation: l3('Ertagacha, Maks!', 'Эртагача, Макс!', 'До завтра, Макс!'),
    options: ['Hallo', 'morgen', 'Tschüss'], answer: 1,
    explain: l3('«Bis morgen» — ertagacha; «morgen» kichik harf bilan.', '«Bis morgen» — эртагача; «morgen» кичик ҳарф билан.', '«Bis morgen» — до завтра; «morgen» с маленькой буквы.')
  }),
  choice({
    id: 'a1-m1-l6-e5', sentence: 'Ich ___ Max Weber.',
    translation: l3('Mening ismim Maks Veber.', 'Менинг исмим Макс Вебер.', 'Меня зовут Макс Вебер.'),
    options: ['heißt', 'heißen', 'heiße'], answer: 2,
    explain: l3('«ich» bilan «heiße» ishlatiladi.', '«ich» билан «heiße» ишлатилади.', 'С «ich» используется «heiße».')
  }),
  choice({
    id: 'a1-m1-l6-e6', sentence: 'Max, du ___ Weber, richtig?',
    translation: l3('Maks, sening familiyang Veber, toʻgʻrimi?', 'Макс, сенинг фамилиянг Вебер, тўғрими?', 'Макс, твоя фамилия Вебер, верно?'),
    options: ['heißt', 'heiße', 'heißen'], answer: 0,
    explain: l3('«du» bilan «heißt» ishlatiladi.', '«du» билан «heißt» ишлатилади.', 'С «du» используется «heißt».')
  }),
  choice({
    id: 'a1-m1-l6-e7', sentence: 'Wie heißen ___?',
    translation: l3('Ismingiz nima? (rasmiy)', 'Исмингиз нима? (расмий)', 'Как вас зовут? (вежливо)'),
    options: ['du', 'Sie', 'ich'], answer: 1,
    explain: l3('Rasmiy savolda «Sie» turadi: Wie heißen Sie?', 'Расмий саволда «Sie» туради: Wie heißen Sie?', 'В вежливом вопросе стоит «Sie»: Wie heißen Sie?')
  }),
  choice({
    id: 'a1-m1-l6-e8', sentence: 'Ich ___ Mechaniker.',
    translation: l3('Men mexanikman.', 'Мен механикман.', 'Я механик.'),
    options: ['bist', 'bin', 'ist'], answer: 1,
    explain: l3('Kasbni aytganda «ich bin» ishlatiladi.', 'Касбни айтганда «ich bin» ишлатилади.', 'Профессию называют с «ich bin».')
  }),
  choice({
    id: 'a1-m1-l6-e9', sentence: 'Woher kommen Sie? – Ich ___ aus Usbekistan.',
    translation: l3('Siz qayerdansiz? – Men Oʻzbekistondanman.', 'Сиз қаердансиз? – Мен Ўзбекистонданман.', 'Откуда вы? – Я из Узбекистана.'),
    options: ['kommen', 'kommt', 'komme'], answer: 2,
    explain: l3('«ich» bilan feʼl -e bilan tugaydi: ich komme.', '«ich» билан феъл -e билан тугайди: ich komme.', 'С «ich» глагол оканчивается на -e: ich komme.')
  }),
  choice({
    id: 'a1-m1-l6-e10', sentence: 'Zu Frau Weber sagen Sie: Wie geht es ___?',
    translation: l3('Veber xonimga aytasiz: Ahvolingiz qalay?', 'Вебер хонимга айтасиз: Аҳволингиз қалай?', 'Госпоже Вебер вы говорите: Как у вас дела?'),
    options: ['Ihnen', 'Sie', 'Ihr'], answer: 0,
    explain: l3('Rasmiy savolda «Ihnen» ishlatiladi.', 'Расмий саволда «Ihnen» ишлатилади.', 'В вежливом вопросе используется «Ihnen».')
  })
]
