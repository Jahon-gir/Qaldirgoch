import { describe, expect, it } from 'vitest'
import { toCyrillic } from './translit'

describe('toCyrillic', () => {
  const cases: [string, string][] = [
    ['Qaldirgʻoch', 'Қалдирғоч'],
    ['yoʻl', 'йўл'],
    ['Yoʻlimni koʻrish', 'Йўлимни кўриш'],
    ['maʼlumot', 'маълумот'],
    ['taʼlim', 'таълим'],
    ['Oʻzbekcha', 'Ўзбекча'],
    ['Gʻalaba', 'Ғалаба'],
    ['shahar', 'шаҳар'],
    ['Choy', 'Чой'],
    ['Ishonchli', 'Ишончли'],
    ['tong', 'тонг'],
    ['yangi', 'янги'],
    ['yosh', 'ёш'],
    ['yulduz', 'юлдуз'],
    ['yetarli', 'етарли'],
    ['Yevropa', 'Европа'],
    ['ega', 'эга'],
    ['Elektrik', 'Электрик'],
    ['kelajak', 'келажак'],
    ['Xush kelibsiz', 'Хуш келибсиз'],
    ['SHAHAR', 'ШАҲАР'],
    ['Germaniyada ishlab oʻqish', 'Германияда ишлаб ўқиш'],
    ['Sizga mos yoʻl: Ausbildung', 'Сизга мос йўл: Ausbildung'],
    ['Google bilan kirish', 'Google билан кириш'],
    ['Telegram (tez orada)', 'Telegram (тез орада)'],
    ['AI maslahatchi', 'AI маслаҳатчи'],
    ['Bir oz (A1)', 'Бир оз (A1)'],
    ['A1 dan B1 gacha', 'A1 дан B1 гача'],
    ['Ausbildungga', 'Ausbildungга'],
    ['Kasb: {name}', 'Касб: {name}'],
    ['{n} / {total} bosqich', '{n} / {total} босқич'],
    ['18–24 yosh', '18–24 ёш'],
    ["yo'l (oddiy apostrof)", 'йўл (оддий апостроф)'],
    ['Pasport yoki hujjat soʻramaymiz.', 'Паспорт ёки ҳужжат сўрамаймиз.']
  ]

  it.each(cases)('%s → %s', (lat, cyr) => {
    expect(toCyrillic(lat)).toBe(cyr)
  })
})
