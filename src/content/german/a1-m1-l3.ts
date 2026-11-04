import { choice, l3, match, word } from './helpers'
import type { Exercise } from './types'

/** A1 · 1-modul · 3-dars: Oʻzingizni tanishtiring (ich / du / Sie) */
export const A1_M1_L3: Exercise[] = [
  word({
    id: 'a1-m1-l3-e1', de: 'ich heiße', icon: 'id',
    tr: l3('mening ismim', 'менинг исмим', 'меня зовут'),
    pron: l3('ix hay-se', 'их хай-се', 'их хай-се'),
    example: { de: 'Ich heiße Anna.', tr: l3('Mening ismim Anna.', 'Менинг исмим Анна.', 'Меня зовут Анна.') }
  }),
  word({
    id: 'a1-m1-l3-e2', de: 'ich bin', icon: 'user',
    tr: l3('men … man', 'мен … ман', 'я …'),
    pron: l3('ix bin', 'их бин', 'их бин'),
    example: { de: 'Ich bin Anna.', tr: l3('Men Annaman.', 'Мен Аннаман.', 'Я Анна.') }
  }),
  word({
    id: 'a1-m1-l3-e3', de: 'du heißt', icon: 'users',
    tr: l3('sening isming', 'сенинг исминг', 'тебя зовут'),
    pron: l3('du hayst', 'ду хайст', 'ду хайст'),
    example: { de: 'Du heißt Max.', tr: l3('Sening isming Maks.', 'Сенинг исминг Макс.', 'Тебя зовут Макс.') }
  }),
  word({
    id: 'a1-m1-l3-e4', de: 'Sie heißen', icon: 'heart-handshake',
    tr: l3('sizning ismingiz', 'сизнинг исмингиз', 'вас зовут'),
    pron: l3('zi hay-sen', 'зи хай-сен', 'зи хай-сен'),
    example: { de: 'Sie heißen Anna Weber.', tr: l3('Sizning ismingiz Anna Veber.', 'Сизнинг исмингиз Анна Вебер.', 'Вас зовут Анна Вебер.') }
  }),
  choice({
    id: 'a1-m1-l3-e5', sentence: 'Ich ___ Anna.',
    translation: l3('Mening ismim Anna.', 'Менинг исмим Анна.', 'Меня зовут Анна.'),
    options: ['heißt', 'heiße', 'heißen'], answer: 1,
    explain: l3('«ich» bilan feʼl -e bilan tugaydi: ich heiße.', '«ich» билан феъл -e билан тугайди: ich heiße.', 'С «ich» глагол оканчивается на -e: ich heiße.')
  }),
  choice({
    id: 'a1-m1-l3-e6', sentence: 'Du ___ Max.',
    translation: l3('Sening isming Maks.', 'Сенинг исминг Макс.', 'Тебя зовут Макс.'),
    options: ['heiße', 'heißen', 'heißt'], answer: 2,
    explain: l3('«du» bilan «heißt» ishlatiladi; «du» — yaqin odamga, «sen».', '«du» билан «heißt» ишлатилади; «du» — яқин одамга, «сен».', 'С «du» используется «heißt»; «du» — близкому человеку, на «ты».')
  }),
  choice({
    id: 'a1-m1-l3-e7', sentence: '___ heißen Müller.',
    translation: l3('Myuller janobga aytasiz: Sizning ismingiz Myuller.', 'Мюллер жанобга айтасиз: Сизнинг исмингиз Мюллер.', 'Господину Мюллеру вы говорите: Вас зовут Мюллер.'),
    options: ['Sie', 'Du', 'Ich'], answer: 0,
    explain: l3('Notanish yoki hurmatli odamga «Sie» (Siz) deyiladi; «Sie» doim bosh harf bilan yoziladi.', 'Нотаниш ёки ҳурматли одамга «Sie» (Сиз) дейилади; «Sie» доим бош ҳарф билан ёзилади.', 'Незнакомому или уважаемому человеку говорят «Sie» (вы); «Sie» всегда пишется с большой буквы.')
  }),
  match('a1-m1-l3-e8', [
    ['ich heiße', l3('mening ismim', 'менинг исмим', 'меня зовут')],
    ['du heißt', l3('sening isming', 'сенинг исминг', 'тебя зовут')],
    ['Sie heißen', l3('sizning ismingiz', 'сизнинг исмингиз', 'вас зовут')],
    ['ich bin', l3('men … man', 'мен … ман', 'я …')]
  ])
]
