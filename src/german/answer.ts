import type { CourseId } from '../lang/types'

/**
 * Yozma javobni tekshirish (sof funksiyalar). Qoidalar:
 * - exact: kiritilgan matn (chetlari kesilgan, boʻsh joylari siqilgan) targetga harfma-harf teng;
 * - correct: kurs normalize() si teng (katta-kichik, tinish belgilari; nemischa: ä↔ae, ö↔oe, ü↔ue, ß↔ss farqi yoʻq);
 * - almost: target (normalize, boʻsh joysiz) ≥ 5 harf va Levenshtein masofa = 1
 *   (koreyschada masofa Hangul boʻgʻinlari harflarga — jamo — ajratib hisoblanadi: 안 → ᄋ ᅡ ᆫ);
 * - wrong: qolgani.
 * exact, correct, almost — TOʻGʻRI hisoblanadi (SRS va kunlik maqsad uchun ham).
 */

export type CheckResult = 'exact' | 'correct' | 'almost' | 'wrong'

/** Chetlari kesilgan, ketma-ket boʻsh joylar bitta, Unicode NFC. */
export const squash = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ')

const PUNCT = /[.,!?;:«»"'„“”‘’]/g

/** Umumiy qism (barcha tillar): NFC, chetlarini kesish, kichik harf, tinish belgilari, boʻsh joylarni siqish. */
export const normalizeBase = (s: string) => squash(s).toLowerCase().replace(PUNCT, '').replace(/\s+/g, ' ').trim()

/** Nemischa: umumiy qism + ä/ö/ü/ß ↔ ae/oe/ue/ss. */
export function normalizeDe(s: string): string {
  return normalizeBase(s).replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
}

/** Koreyscha: umumiy qism; Hangul NFC da boʻgʻinlarga yigʻiladi (alohida jamo bilan yozilgani ham bir xil boʻladi). */
export const normalizeKo = (s: string) => normalizeBase(s)

/** Eski nom (nemischa). */
export const normalize = normalizeDe

const NORMALIZE: Record<CourseId, (s: string) => string> = { de: normalizeDe, ko: normalizeKo }

/** Boʻsh javob tekshirilmaydi ("Avval javobni yozing"). */
export const isBlank = (s: string) => squash(s) === ''

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[b.length]
}

export const ALMOST_MIN = 5

/** Hangul boʻgʻinlari harflarga (jamo): NFD. Boshqa yozuvlar oʻzgarmaydi. */
export const toJamo = (s: string) => s.normalize('NFD')

/**
 * course — kurs id'si (standart 'de'). Harflar soni (ALMOST_MIN) koʻrinadigan belgilarda (NFC, boʻsh joysiz) sanaladi —
 * nemischa ham, koreyscha ham bir xil; koreyschada faqat masofa jamo boʻyicha (bitta harf xatosi = 1).
 */
export function check(input: string, target: string, course: CourseId = 'de'): CheckResult {
  if (isBlank(input)) return 'wrong'
  if (squash(input) === squash(target)) return 'exact'
  const norm = NORMALIZE[course]
  const a = norm(input)
  const b = norm(target)
  if (a === b) return 'correct'
  const dist = course === 'ko' ? levenshtein(toJamo(a), toJamo(b)) : levenshtein(a, b)
  if ([...b.replace(/ /g, '')].length >= ALMOST_MIN && dist === 1) return 'almost'
  return 'wrong'
}

export const isRight = (r: CheckResult) => r !== 'wrong'

/* ---------- Yozish: maxsus harf tugmalari ---------- */

export const SPECIAL_LETTERS = ['ä', 'ö', 'ü', 'ß'] as const
export type SpecialLetter = (typeof SPECIAL_LETTERS)[number]

/**
 * Faqat javob soʻzida (target) bor harflar, nemischa alifbo tartibida (ä, ö, ü, ß); katta harf ham kichik koʻrinishda.
 * Tugma faqat soʻzda aynan shu harf boʻlsagina chiqadi ("ss" bor, ß yoʻq soʻzda ß chiqmaydi: "Tschüss" → ü).
 */
export function specialLettersOf(target: string): SpecialLetter[] {
  const low = target.normalize('NFC').toLowerCase()
  return SPECIAL_LETTERS.filter((c) => low.includes(c))
}

/** Tugma bosilganda qoʻyiladigan belgi: kursor oldida belgi yoʻq yoki boʻsh joy boʻlsa va targetda shu harf soʻz boshida katta boʻlsa — katta. */
export function specialToInsert(c: SpecialLetter, target: string, before: string): string {
  const upper = c.toUpperCase()
  const wordStart = target.normalize('NFC').split(/\s+/).some((w) => w.startsWith(upper))
  const atStart = before === '' || before.endsWith(' ')
  return wordStart && atStart && upper !== c ? upper : c
}
