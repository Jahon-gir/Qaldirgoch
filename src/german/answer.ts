/**
 * Yozma javobni tekshirish (sof funksiyalar). Qoidalar:
 * - exact: kiritilgan matn (chetlari kesilgan, boʻsh joylari siqilgan) targetga harfma-harf teng;
 * - correct: normalize() teng (katta-kichik, tinish belgilari, ä↔ae, ö↔oe, ü↔ue, ß↔ss farqi yoʻq);
 * - almost: target (normalize, boʻsh joysiz) ≥ 5 harf va Levenshtein masofa = 1;
 * - wrong: qolgani.
 * exact, correct, almost — TOʻGʻRI hisoblanadi (SRS va kunlik maqsad uchun ham).
 */

export type CheckResult = 'exact' | 'correct' | 'almost' | 'wrong'

/** Chetlari kesilgan, ketma-ket boʻsh joylar bitta, Unicode NFC. */
export const squash = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ')

const PUNCT = /[.,!?;:«»"'„“”‘’]/g

export function normalize(s: string): string {
  return squash(s)
    .toLowerCase()
    .replace(PUNCT, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ')
    .trim()
}

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

export function check(input: string, target: string): CheckResult {
  if (isBlank(input)) return 'wrong'
  if (squash(input) === squash(target)) return 'exact'
  const a = normalize(input)
  const b = normalize(target)
  if (a === b) return 'correct'
  if (b.replace(/ /g, '').length >= ALMOST_MIN && levenshtein(a, b) === 1) return 'almost'
  return 'wrong'
}

export const isRight = (r: CheckResult) => r !== 'wrong'

/* ---------- Yozish: maxsus harf tugmalari ---------- */

export const SPECIAL_LETTERS = ['ä', 'ö', 'ü', 'ß'] as const
export type SpecialLetter = (typeof SPECIAL_LETTERS)[number]

/**
 * Faqat javob soʻzida (target) bor harflar, nemischa alifbo tartibida (ä, ö, ü, ß); katta harf ham kichik koʻrinishda.
 * "ss" bor soʻzda ß ham chiqadi: ß va ss bir xil qabul qilinadi (normalize), masalan "Tschüss" → ü ß.
 */
export function specialLettersOf(target: string): SpecialLetter[] {
  const low = target.normalize('NFC').toLowerCase()
  return SPECIAL_LETTERS.filter((c) => low.includes(c) || (c === 'ß' && low.includes('ss')))
}

/** Tugma bosilganda qoʻyiladigan belgi: kursor oldida belgi yoʻq yoki boʻsh joy boʻlsa va targetda shu harf soʻz boshida katta boʻlsa — katta. */
export function specialToInsert(c: SpecialLetter, target: string, before: string): string {
  const upper = c.toUpperCase()
  const wordStart = target.normalize('NFC').split(/\s+/).some((w) => w.startsWith(upper))
  const atStart = before === '' || before.endsWith(' ')
  return wordStart && atStart && upper !== c ? upper : c
}
