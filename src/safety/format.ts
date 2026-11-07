/** "2026-10-28" → "28.10.2026". Noto'g'ri qiymat o'zgarishsiz qaytadi. */
export function fmtDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso
}
