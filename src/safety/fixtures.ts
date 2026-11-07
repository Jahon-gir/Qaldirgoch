import { normalizePhone, normalizeText } from './normalize.ts'
import type { Agency } from './search.ts'

/** Faqat testlar uchun uydirma qatorlar (ilova bundle'iga kirmaydi). Haqiqiy reestr maʼlumoti bazadan keladi. */
export function mkAgency(p: Partial<Agency> & { nomi: string; litsenziya_raqami: string }): Agency {
  const telefonlar = p.telefonlar ?? []
  return {
    id: `id-${p.litsenziya_raqami}`,
    nomi_norm: normalizeText(p.nomi),
    litsenziya_sanasi: null,
    manzil: null,
    telefonlar,
    telefonlar_norm: telefonlar.map(normalizePhone),
    email: null,
    manba_url: 'https://example.org/registry',
    reestr_yangilangan: '2026-01-02',
    tekshirilgan: '2026-01-03',
    ...p
  }
}

export const FIXTURE: Agency[] = [
  mkAgency({ nomi: '“Alfa xususiy bandlik agentligi” MChJ', litsenziya_raqami: '0101', litsenziya_sanasi: '2024-03-05', manzil: 'Test shahri, 1-uy', telefonlar: ['+998(90) 111-22-33', '+998 91 222 33 44'], email: 'alfa@example.org' }),
  mkAgency({ nomi: '“Alfa Global” MChJ', litsenziya_raqami: '0202', telefonlar: ['+998 93 555 66 77'] }),
  mkAgency({ nomi: '“Oʻzbek Ish” XK', litsenziya_raqami: '0303', litsenziya_sanasi: '2025-12-31' })
]
