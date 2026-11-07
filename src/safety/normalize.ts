/**
 * Reestr qidiruvi uchun normallashtirish (sof funksiyalar).
 * Skript (scripts/import-agencies.mjs) ham, ilova ham SHU funksiyalarni ishlatadi:
 * bazadagi *_norm ustunlari va qidiruv so'rovi bir xil shaklga keladi.
 */

// Kirill → lotin. ў/ғ dagi belgi keyin baribir olib tashlanadi (oʻ = o, gʻ = g).
const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h'
}

/** Nom/so'rov: kichik harf, kirill→lotin, ʻ ʼ ' ` ‘ ’ olib tashlanadi, tinish belgilari va ortiqcha bo'shliq yo'q. */
export function normalizeText(s: string): string {
  const lower = s.toLowerCase().replace(/№/g, ' ') // NFKD uni "No" ga aylantirib yuboradi
  let out = ''
  for (const ch of lower) out += CYR[ch] ?? ch
  return out
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ʻʼ'`‘’´ʹ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export const digitsOf = (s: string): string => s.replace(/\D/g, '')

/** Telefon: faqat raqamlar, oxirgi 9 tasi (+998, bo'shliq, tire, qavs farqsiz). 9 dan kam raqam — telefon emas (''). */
export function normalizePhone(s: string): string {
  const d = digitsOf(s)
  return d.length >= 9 ? d.slice(-9) : ''
}

/** Litsenziya raqami: faqat raqamlar, boshidagi nollarsiz ("№0022" = "22"). */
export function normalizeLicense(s: string): string {
  return digitsOf(s).replace(/^0+/, '')
}
