import type { CountryId } from '../content/countries'
import type { Key } from '../i18n/uz'
import type { CourseId } from './types'

/**
 * Til tanlash ekranidagi tillar. Ochiq tillar — kurs bor (course); qulfli tillar faqat shu roʻyxatda
 * (CourseId ga qoʻshilmaydi, kontent yoʻq).
 */
export type CatalogItem = { id: 'de' | 'ko' | 'ja' | 'en'; flag: CountryId; name: Key; course?: CourseId }

export const LANGUAGE_CATALOG: readonly CatalogItem[] = [
  { id: 'de', flag: 'de', name: 'langs.de', course: 'de' },
  { id: 'ko', flag: 'kr', name: 'langs.ko', course: 'ko' },
  { id: 'ja', flag: 'jp', name: 'langs.ja' },
  { id: 'en', flag: 'gb', name: 'langs.en' }
]
