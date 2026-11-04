import type { Dict } from './uz'

/** Qoʻlda yozilgan kirill matnlar: avtomatik translit oʻrniga ishlatiladi (ts→ц, unli+e→э kabi xatolar boʻlmasligi uchun). */
export const cyrlOverrides: Partial<Dict> = {
  'settings.install': 'Телефонга ўрнатиш',
  'install.intro': 'Илова бош экранда иконка бўлиб туради ва тезроқ очилади.',
  'install.step1': 'Ҳаволани Safari браузерида очинг.',
  'install.step2': 'Пастдаги {share} тугмасини босинг',
  'install.share': 'Улашиш',
  'install.step3': '{add} ни танланг.',
  'install.add': 'Бош экранга қўшиш',
  'install.already': 'Илова аллақачон ўрнатилган.'
}
