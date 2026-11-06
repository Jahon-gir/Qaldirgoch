/**
 * Eng kam Ausbildung haqi: raqamlar BITTA manbadan — step.yol.f3 matnidan ("1-yil — 724 EUR, 2-yil — …").
 * Ikkinchi nusxa yozilmaydi: matn oʻzgarsa kirish ekrani ham oʻzgaradi. Yil → "724" (matndagi koʻrinishda, masalan "1 014").
 * Topilmasa — boʻsh obyekt (ekran asl matnni oʻzini koʻrsatadi).
 */
export function payByYear(text: string): Record<number, string> {
  const out: Record<number, string> = {}
  for (const m of text.matchAll(/(\d)-\D*?(\d{1,3}(?:[\s  ]\d{3})*)\s*EUR/g)) out[Number(m[1])] = m[2]
  return out
}
