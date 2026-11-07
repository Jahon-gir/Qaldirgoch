import { check, isRight, type CheckResult } from './answer'

/** Ovoz tanish raqamni raqam bilan yozadi ("1"): 0–20 oraligʻida nemischa soʻzga aylantiriladi. */
const NUMBER_WORDS = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig'] as const

export function numberWord(text: string): string | null {
  const m = /^(\d{1,2})[.,!?]?$/.exec(text.trim())
  if (!m) return null
  return NUMBER_WORDS[Number(m[1])] ?? null
}

export type Judged = { ok: boolean; result: CheckResult; heard: string }

/**
 * Tanilgan variantlardan BIRORTASI answer.check() boʻyicha exact/correct/almost boʻlsa — "toʻgʻri tanildi".
 * Talaffuz SIFATI baholanmaydi: faqat tanildi / tanilmadi. heard — foydalanuvchiga koʻrsatiladigan matn
 * (toʻgʻri boʻlsa mos kelgan variant, aks holda eng birinchi variant).
 */
export function judgeSpoken(alternatives: readonly string[], target: string): Judged {
  for (const alt of alternatives) {
    const nw = numberWord(alt)
    for (const cand of nw ? [alt, nw] : [alt]) {
      const result = check(cand, target)
      if (isRight(result)) return { ok: true, result, heard: alt.trim() }
    }
  }
  return { ok: false, result: 'wrong', heard: alternatives[0]?.trim() ?? '' }
}
