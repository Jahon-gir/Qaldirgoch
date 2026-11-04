import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { appBaseUrl, clearStoredSession, isSupabaseConfigured, supabase } from '../lib/supabase'

export type AuthStatus = 'loading' | 'guest' | 'signedIn'
export type AuthUser = { id: string; email?: string; name?: string; avatarUrl?: string }

/** Supabase foydalanuvchisidan faqat koʻrsatish uchun kerakli maydonlar. Rasm faqat https. */
export function toAuthUser(u: User): AuthUser {
  const m = (u.user_metadata ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 120) : undefined)
  const pic = str(m.avatar_url) ?? str(m.picture)
  return {
    id: u.id,
    email: u.email,
    name: str(m.full_name) ?? str(m.name),
    avatarUrl: pic && pic.startsWith('https://') ? pic : undefined
  }
}

type Ctx = {
  status: AuthStatus
  user: AuthUser | null
  /** Env sozlangan (Supabase bor). Yoʻq boʻlsa kirish tugmasi oʻrniga xabar koʻrsatiladi. */
  configured: boolean
  /** Google sahifasiga yoʻnaltiradi; boshlab boʻlmasa `false`. */
  signInWithGoogle: () => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    // Callback ichida Supabase chaqirilmaydi (bloklanib qolmasligi uchun) — faqat holat yangilanadi
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return false
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: appBaseUrl() } })
      return !error
    } catch {
      return false
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase?.auth.signOut({ scope: 'local' })
    } catch {
      /* tarmoq xatosida ham mahalliy sessiya pastda oʻchiriladi */
    }
    clearStoredSession()
    setSession(null)
  }, [])

  const user = useMemo(() => (session ? toAuthUser(session.user) : null), [session])
  const status: AuthStatus = loading ? 'loading' : user ? 'signedIn' : 'guest'
  const value = useMemo(
    () => ({ status, user, configured: isSupabaseConfigured, signInWithGoogle, signOut }),
    [status, user, signInWithGoogle, signOut]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak')
  return c
}
