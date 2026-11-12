import { DIRECTIONS, LEVELS } from '../german/types.ts'
import type { PackRules } from './types.ts'

/**
 * Kurslar boʻyicha import qoidalari. Skript (Node) ham shu faylni oʻqiydi — shuning uchun importlar .ts kengaytmali
 * va faqat Node'da ishlaydigan fayllardan. Koreys darajalari KO_LEVELS bilan testda solishtiriladi.
 */
export const PACK_RULES: Record<string, PackRules> = {
  de: { course: 'de', prefix: '', fields: DIRECTIONS, levels: [...LEVELS, 'B2'], article: true, pron: false },
  ko: { course: 'ko', prefix: 'ko-', fields: DIRECTIONS, levels: ['ko-H', 'ko-T1', 'ko-T2'], article: false, pron: true }
}

export const rulesOf = (course: string): PackRules | undefined => PACK_RULES[course]
