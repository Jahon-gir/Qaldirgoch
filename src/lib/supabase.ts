import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Faqat ommaviy (anon) kalit klientda boʻladi. service_role kalit hech qachon bu yerga yozilmaydi.
 * Env yoʻq boʻlsa klient `null` — ilova mehmon rejimida ishlayveradi.
 */
export function createSupabase(url: string | undefined, anonKey: string | undefined): SupabaseClient | null {
  if (!url || !anonKey) return null
  try {
    return createClient(url, anonKey, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
    })
  } catch {
    return null
  }
}

export const supabase = createSupabase(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
export const isSupabaseConfigured = supabase !== null

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
