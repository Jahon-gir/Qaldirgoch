import { uz, type Dict } from './uz'
import { toCyrillic } from './translit'
import { cyrlOverrides } from './cyrl'

/** Kirill lugʻati: lotin matndan avtomatik translit + qoʻlda yozilgan matnlar ustidan. */
export function buildCyrl(): Dict {
  const d = Object.fromEntries(Object.entries(uz).map(([k, v]) => [k, toCyrillic(v)])) as Dict
  return Object.assign(d, cyrlOverrides)
}
