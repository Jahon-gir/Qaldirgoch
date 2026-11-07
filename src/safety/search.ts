import { digitsOf, normalizeLicense, normalizePhone, normalizeText } from './normalize.ts'

/** Reestr qatori (bazadagi `agencies` jadvali bilan bir xil nomlar). Rahbar ismi va STIR umuman yo'q. */
export type Agency = {
  id: string
  nomi: string
  nomi_norm: string
  litsenziya_raqami: string
  litsenziya_sanasi: string | null
  manzil: string | null
  telefonlar: string[]
  telefonlar_norm: string[]
  email: string | null
  manba_url: string
  reestr_yangilangan: string
  tekshirilgan: string
}

export const MIN_QUERY = 3
/** Telefon qidiruvi oxirgi 9 raqam bo'yicha. */
const PHONE_LEN = 9

export type QueryKind = 'empty' | 'license' | 'phone' | 'name'

/** So'rov turi: faqat raqam/belgilar — litsenziya yoki telefon, aks holda nom. Qisqa so'rov — 'empty'. */
export function classifyQuery(raw: string): { kind: QueryKind; value: string } {
  const text = normalizeText(raw)
  if (text.replace(/\s/g, '').length < MIN_QUERY) return { kind: 'empty', value: '' }
  const hasLetter = /\p{L}/u.test(text)
  if (!hasLetter) {
    const d = digitsOf(raw)
    if (d.length >= PHONE_LEN) return { kind: 'phone', value: normalizePhone(raw) }
    if (d.length >= MIN_QUERY) return { kind: 'license', value: normalizeLicense(raw) }
    return { kind: 'empty', value: '' }
  }
  return { kind: 'name', value: text }
}

/** Reestrdan qidiradi. Mos kelmasa yoki so'rov qisqa bo'lsa — bo'sh ro'yxat. */
export function searchAgencies(agencies: Agency[], raw: string): Agency[] {
  const { kind, value } = classifyQuery(raw)
  if (kind === 'empty' || !value) return []
  if (kind === 'license') return agencies.filter((a) => normalizeLicense(a.litsenziya_raqami) === value)
  if (kind === 'phone') return agencies.filter((a) => a.telefonlar_norm.includes(value))
  const words = value.split(' ')
  return agencies.filter((a) => words.every((w) => a.nomi_norm.includes(w)))
}
