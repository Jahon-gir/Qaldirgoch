import { uz, type Dict } from './uz'

export type Lang = 'uz' | 'uz-Cyrl' | 'ru'

/**
 * Interfeys lugʻatlari. Oʻzbek lotin (standart til va zaxira) asosiy JS'da;
 * rus va kirill alohida bo'lak — faqat shu til tanlanganda yuklanadi (0.29.0).
 */
const cache: Partial<Record<Lang, Dict>> = { uz }
const pending: Partial<Record<Lang, Promise<Dict>>> = {}

/** Yuklangan lugʻat (yoʻq boʻlsa undefined). */
export const getDict = (lang: Lang): Dict | undefined => cache[lang]

/** Lugʻatni yuklaydi (bir marta); xato boʻlsa keyingi chaqiruv qayta urinadi. */
export function loadDict(lang: Lang): Promise<Dict> {
  const have = cache[lang]
  if (have) return Promise.resolve(have)
  const p =
    pending[lang] ??
    (lang === 'ru' ? import('./ru').then((m) => m.ru) : import('./cyrlDict').then((m) => m.buildCyrl()))
      .then((d) => (cache[lang] = d))
      .finally(() => delete pending[lang])
  pending[lang] = p
  return p
}

/** Testlar uchun: hamma lugʻat oldindan yuklanadi — til almashtirish sinxron boʻladi. */
export const preloadAllDicts = () => Promise.all((['uz', 'uz-Cyrl', 'ru'] as Lang[]).map(loadDict))
