export type Mode = 'light' | 'dark' | 'auto'
export type Size = 's' | 'm' | 'l'

/** Sozlamalarda ko'rsatiladigan ranglar. `swatch` — doira rangi (yorug' / qorong'i). */
export const ACCENTS = [
  { id: 'marjon', name: 'Marjon', swatch: ['#D85A30', '#F0997B'] },
  { id: 'kok', name: "Ko'k", swatch: ['#185FA5', '#85B7EB'] },
  { id: 'yashil', name: 'Yashil', swatch: ['#0F6E56', '#5DCAA5'] },
  { id: 'binafsha', name: 'Binafsha', swatch: ['#534AB7', '#AFA9EC'] },
  { id: 'gilos', name: 'Gilos', swatch: ['#993556', '#ED93B1'] },
  { id: 'asal', name: 'Asal', swatch: ['#854F0B', '#EF9F27'] },
  { id: 'grafit', name: 'Grafit', swatch: ['#444441', '#B4B2A9'] },
  { id: 'dengiz', name: 'Dengiz', swatch: ['#0C447C', '#B5D4F4'] }
] as const

export type AccentId = (typeof ACCENTS)[number]['id']
