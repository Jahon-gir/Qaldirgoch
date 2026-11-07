import type { SupabaseClient } from '@supabase/supabase-js'
import type { Agency } from './search.ts'

const CACHE_KEY = 'qaldirgoch.agencies.v1'
/** Kesh shundan eski bo'lsa, tarmoq bor payti fonda yangilanadi (eski nusxa oflayn ko'rsatilaveradi). */
const STALE_MS = 24 * 60 * 60 * 1000
const COLUMNS = 'id, nomi, nomi_norm, litsenziya_raqami, litsenziya_sanasi, manzil, telefonlar, telefonlar_norm, email, manba_url, reestr_yangilangan, tekshirilgan'

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

/** Faqat https havola (javascript: va boshqalar chiqmaydi). */
export function safeHttpsUrl(v: unknown): string | null {
  if (typeof v !== 'string') return null
  try {
    const u = new URL(v)
    return u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

/** Server/kesh javobini tekshiradi: noto'g'ri qatorlar tashlanadi. */
export function sanitizeAgencies(raw: unknown): Agency[] {
  if (!Array.isArray(raw)) return []
  const out: Agency[] = []
  for (const r of raw as Record<string, unknown>[]) {
    const id = str(r?.id)
    const nomi = str(r?.nomi)
    const nomiNorm = str(r?.nomi_norm)
    const lic = str(r?.litsenziya_raqami)
    const url = safeHttpsUrl(r?.manba_url)
    if (!id || !nomi || !nomiNorm || !lic || !url || !isDate(r.reestr_yangilangan) || !isDate(r.tekshirilgan)) continue
    out.push({
      id,
      nomi,
      nomi_norm: nomiNorm,
      litsenziya_raqami: lic,
      litsenziya_sanasi: isDate(r.litsenziya_sanasi) ? r.litsenziya_sanasi : null,
      manzil: str(r.manzil),
      telefonlar: strs(r.telefonlar),
      telefonlar_norm: strs(r.telefonlar_norm),
      email: str(r.email),
      manba_url: url,
      reestr_yangilangan: r.reestr_yangilangan,
      tekshirilgan: r.tekshirilgan
    })
  }
  return out
}

type Cached = { savedAt: number; rows: Agency[] }

export function readCache(): Cached | null {
  try {
    const j = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    const rows = sanitizeAgencies(j?.rows)
    return rows.length && typeof j.savedAt === 'number' ? { savedAt: j.savedAt, rows } : null
  } catch {
    return null
  }
}

function writeCache(rows: Agency[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rows }))
  } catch {
    /* xususiy rejim / joy yo'q: kesh bo'lmasa ham ilova ishlaydi */
  }
}

/** Reestrni Supabase'dan oladi (hamma 48 qator, bitta so'rov). Xatoda tashlaydi. */
export async function fetchAgencies(client: SupabaseClient): Promise<Agency[]> {
  const { data, error } = await client.from('agencies').select(COLUMNS)
  if (error) throw error
  const rows = sanitizeAgencies(data)
  if (!rows.length) throw new Error('Reestr bo‘sh')
  return rows
}

export type Loaded = { rows: Agency[]; fromCache: boolean }

/**
 * Keshdan darhol; kesh yo'q bo'lsa tarmoqdan. Kesh eskirgan bo'lsa fonda yangilaydi (xato bo'lsa jim: eski nusxa qoladi).
 * Kesh ham, tarmoq ham yo'q bo'lsa — xato tashlaydi.
 */
export async function loadAgencies(client: SupabaseClient | null, onRefreshed?: (rows: Agency[]) => void): Promise<Loaded> {
  const cached = readCache()
  const refresh = async () => {
    if (!client) throw new Error('Supabase sozlanmagan')
    const rows = await fetchAgencies(client)
    writeCache(rows)
    return rows
  }
  if (cached) {
    if (client && Date.now() - cached.savedAt > STALE_MS) refresh().then((r) => onRefreshed?.(r), () => undefined)
    return { rows: cached.rows, fromCache: true }
  }
  return { rows: await refresh(), fromCache: false }
}
