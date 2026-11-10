import { choice, l3, match, word } from './helpers'
import type { Exercise } from './types'

/** A1 · 1-modul · 5-dars: Kimligingizni soʻrash */
export const A1_M1_L5: Exercise[] = [
  word({
    id: 'a1-m1-l5-e1', term: 'Woher kommen Sie?', icon: 'world',
    tr: l3('Siz qayerdansiz?', 'Сиз қаердансиз?', 'Откуда вы?'),
    pron: l3('vo-her ko-men zi', 'во-хер ко-мен зи', 'во-хер ко-мен зи'),
    example: { de: 'Woher kommen Sie? – Ich komme aus Taschkent.', tr: l3('Siz qayerdansiz? – Men Toshkentdanman.', 'Сиз қаердансиз? – Мен Тошкентданман.', 'Откуда вы? – Я из Ташкента.') }
  }),
  word({
    id: 'a1-m1-l5-e2', term: 'Ich komme aus Usbekistan.', icon: 'map-pin',
    tr: l3('Men Oʻzbekistondanman.', 'Мен Ўзбекистонданман.', 'Я из Узбекистана.'),
    pron: l3('ix ko-me aus us-be-ki-stan', 'их ко-ме аус ус-бе-ки-стан', 'их ко-ме аус ус-бе-ки-стан'),
    example: { de: 'Ich komme aus Usbekistan.', tr: l3('Men Oʻzbekistondanman.', 'Мен Ўзбекистонданман.', 'Я из Узбекистана.') }
  }),
  word({
    id: 'a1-m1-l5-e3', term: 'Wie geht es Ihnen?', icon: 'mood-smile',
    tr: l3('Ahvolingiz qalay?', 'Аҳволингиз қалай?', 'Как у вас дела?'),
    pron: l3('vi geyt es i-nen', 'ви гейт эс и-нен', 'ви гейт эс и-нен'),
    example: { de: 'Guten Tag! Wie geht es Ihnen?', tr: l3('Xayrli kun! Ahvolingiz qalay?', 'Хайрли кун! Аҳволингиз қалай?', 'Добрый день! Как у вас дела?') }
  }),
  word({
    id: 'a1-m1-l5-e4', term: 'Mir geht es gut, danke.', icon: 'messages',
    tr: l3('Yaxshi, rahmat.', 'Яхши, раҳмат.', 'Хорошо, спасибо.'),
    pron: l3('mir geyt es gut, dan-ke', 'мир гейт эс гут, дан-ке', 'мир гейт эс гут, дан-ке'),
    example: { de: 'Mir geht es gut, danke. Und Ihnen?', tr: l3('Yaxshi, rahmat. Sizda-chi?', 'Яхши, раҳмат. Сизда-чи?', 'Хорошо, спасибо. А у вас?') }
  }),
  choice({
    id: 'a1-m1-l5-e5', sentence: 'Woher ___ Sie?',
    translation: l3('Siz qayerdansiz?', 'Сиз қаердансиз?', 'Откуда вы?'),
    options: ['kommt', 'komme', 'kommen'], answer: 2,
    explain: l3('«Sie» bilan feʼl «kommen» shaklida turadi.', '«Sie» билан феъл «kommen» шаклида туради.', 'С «Sie» глагол стоит в форме «kommen».')
  }),
  choice({
    id: 'a1-m1-l5-e6', sentence: 'Ich ___ aus Usbekistan.',
    translation: l3('Men Oʻzbekistondanman.', 'Мен Ўзбекистонданман.', 'Я из Узбекистана.'),
    options: ['komme', 'kommen', 'kommst'], answer: 0,
    explain: l3('«ich» bilan feʼl -e bilan tugaydi: ich komme.', '«ich» билан феъл -e билан тугайди: ich komme.', 'С «ich» глагол оканчивается на -e: ich komme.')
  }),
  choice({
    id: 'a1-m1-l5-e7', sentence: 'Ich komme ___ Usbekistan.',
    translation: l3('Men Oʻzbekistondanman.', 'Мен Ўзбекистонданман.', 'Я из Узбекистана.'),
    options: ['in', 'nach', 'aus'], answer: 2,
    explain: l3('«aus» — «…dan» maʼnosida: aus Usbekistan — Oʻzbekistondan.', '«aus» — «…дан» маъносида: aus Usbekistan — Ўзбекистондан.', '«aus» значит «из»: aus Usbekistan — из Узбекистана.')
  }),
  choice({
    id: 'a1-m1-l5-e8', sentence: 'Wie geht es ___?',
    translation: l3('Ahvolingiz qalay? (rasmiy, «Siz»)', 'Аҳволингиз қалай? (расмий, «Сиз»)', 'Как у вас дела? (вежливо, на «вы»)'),
    options: ['Sie', 'Ihr', 'Ihnen'], answer: 2,
    explain: l3('Rasmiy savol — «Wie geht es Ihnen?»; «Ihnen» «Sie»ning shakli.', 'Расмий савол — «Wie geht es Ihnen?»; «Ihnen» «Sie»нинг шакли.', 'Вежливый вопрос — «Wie geht es Ihnen?»; «Ihnen» — форма от «Sie».')
  }),
  match('a1-m1-l5-e9', [
    ['Woher kommen Sie?', l3('Siz qayerdansiz?', 'Сиз қаердансиз?', 'Откуда вы?')],
    ['Ich komme aus Usbekistan.', l3('Men Oʻzbekistondanman.', 'Мен Ўзбекистонданман.', 'Я из Узбекистана.')],
    ['Wie geht es Ihnen?', l3('Ahvolingiz qalay?', 'Аҳволингиз қалай?', 'Как у вас дела?')],
    ['Mir geht es gut, danke.', l3('Yaxshi, rahmat.', 'Яхши, раҳмат.', 'Хорошо, спасибо.')]
  ])
]
