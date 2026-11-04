export type Mode = 'light' | 'dark' | 'auto'
export type Size = 's' | 'm' | 'l'

/** Sozlamalarda ko'rsatiladigan ranglar. Nomlari lug'atda: accent.<id>. `swatch` — doira rangi (yorug' / qorong'i). */
export const ACCENTS = [
  { id: 'marjon', swatch: ['#D85A30', '#F0997B'] },
  { id: 'kok', swatch: ['#185FA5', '#85B7EB'] },
  { id: 'yashil', swatch: ['#0F6E56', '#5DCAA5'] },
  { id: 'binafsha', swatch: ['#534AB7', '#AFA9EC'] },
  { id: 'gilos', swatch: ['#993556', '#ED93B1'] },
  { id: 'asal', swatch: ['#854F0B', '#EF9F27'] },
  { id: 'grafit', swatch: ['#444441', '#B4B2A9'] },
  { id: 'dengiz', swatch: ['#0C447C', '#B5D4F4'] }
] as const

export type AccentId = (typeof ACCENTS)[number]['id']
