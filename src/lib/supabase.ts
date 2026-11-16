import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Faqat ommaviy (anon) kalit klientda boʻladi. service_role kalit hech qachon bu yerga yozilmaydi.
 * Env yoʻq boʻlsa klient `null` — ilova mehmon rejimida ishlayveradi.
 *
 * supabase-js (~220 KB) asosiy JS'da emas: `loadSupabase()` uni birinchi chaqiruvda dinamik yuklaydi
 * (AuthProvider ilova chizilgach chaqiradi). Bosh ekran kutmaydi.
 */
const SB_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(SB_URL && KEY)

export async function createSupabase(url: string | undefined, anonKey: string | undefined): Promise<SupabaseClient | null> {
  if (!url || !anonKey) return null
  try {
    const { createClient } = await import('@supabase/supabase-js')
    return createClient(url, anonKey, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
    })
  } catch {
    return null
  }
}

let client: SupabaseClient | null = null
let pending: Promise<SupabaseClient | null> | null = null

/** Klientni (bir marta) yuklaydi. Env yoʻq yoki yuklab boʻlmasa `null`. */
export function loadSupabase(): Promise<SupabaseClient | null> {
  if (!pending) {
    pending = createSupabase(SB_URL, KEY).then((c) => {
      client = c
      if (!c) pending = null // keyinroq qayta urinish mumkin (masalan tarmoq qaytganda)
      return c
    })
  }
  return pending
}

/** Yuklangan klient yoki `null` (hali yuklanmagan / sozlanmagan). Kirgan foydalanuvchi boʻlsa — doim yuklangan. */
export function getSupabase(): SupabaseClient | null {
  return client
}

/** OAuth qaytadigan manzil: joriy ilovaning bazaviy manzili (GitHub Pages: .../Qaldirgoch/, lokal: http://localhost:5173/). */
export function appBaseUrl(loc: Pick<Location, 'origin' | 'pathname'> = window.location): string {
  const path = loc.pathname.replace(/index\.html$/, '')
  return loc.origin + (path.endsWith('/') ? path : path + '/')
}

/** Chiqishda brauzerdagi Supabase sessiya izlarini ham oʻchiradi (umumiy telefonlar uchun). */
export function clearStoredSession() {
  try {
    for (const k of Object.keys(localStorage)) if (/^sb-.+-(auth-token|code-verifier)/.test(k)) localStorage.removeItem(k)
  } catch {
    /* xususiy rejim */
  }
}
