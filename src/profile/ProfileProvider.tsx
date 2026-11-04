import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { clearProgressStorage } from '../progress/storage'
import type { Direction } from '../content/german/types'
import { PROFILE_SCHEMA_VERSION, type Answers, type Profile } from './questions'
import { cleanText, decideSync, fetchRemoteProfile, normalizeProfile, pushRemoteProfile } from './sync'

export { cleanText }

/**
 * Profil har doim shu telefonda (localStorage) keshlanadi. Kirgan boʻlsa — serverga ham yoziladi.
 * Saqlash va sinxronlash shu modul ichida yashirilgan.
 */
const PROFILE_KEY = 'qaldirgoch.profile'
const DONE_KEY = 'qaldirgoch.onboarded'
const DIRTY_KEY = 'qaldirgoch.profile.dirty' // serverga yuborilmagan oʻzgarish bor: foydalanuvchi id
const SYNCED_KEY = 'qaldirgoch.profile.synced' // ushbu foydalanuvchi uchun tanlov bir marta hal qilingan

function read<T>(key: string, parse: (s: string) => T, fallback: T): T {
  try {
    const s = localStorage.getItem(key)
    return s == null ? fallback : parse(s)
  } catch {
    return fallback
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* xususiy rejimda saqlanmasa ham sessiya davomida ishlayveradi */
  }
}

const loadProfile = (): Profile | null => read(PROFILE_KEY, (s) => normalizeProfile(JSON.parse(s)), null)

/** off — mehmon; checking — server bilan solishtirilmoqda; ask/choose — foydalanuvchi javobi kutilmoqda; ready — tayyor; error — tarmoq/oʻqib boʻlmadi. */
export type SyncPhase = 'off' | 'checking' | 'ask' | 'choose' | 'ready' | 'error'

type Ctx = {
  profile: Profile | null
  onboarded: boolean
  saveAnswers: (a: Answers) => void
  completeOnboarding: () => void
  /** Nemis tili yoʻnalishini qoʻlda tanlash: profilda saqlanadi va akkaunt bilan sinxronlanadi. */
  setGermanDirection: (d: Direction) => void
  sync: SyncPhase
  /** Serverga yuborilmagan oʻzgarish bor. */
  syncPending: boolean
  /** "ask" dialogi: true — akkauntga koʻchirish, false — mahalliy profilni tozalab yangidan boshlash. */
  answerMigrate: (migrate: boolean) => Promise<void>
  /** "choose" ekrani: qaysi profil qoladi. */
  answerChoose: (use: 'server' | 'local') => Promise<void>
  /** Chiqish: sessiya + mahalliy profil keshi tozalanadi, kirish ekraniga qaytadi. */
  signOutAndClear: () => Promise<void>
}

const ProfileContext = createContext<Ctx | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const userId = auth.status === 'signedIn' ? auth.user!.id : null
  const [profile, setProfile] = useState<Profile | null>(loadProfile)
  const [onboarded, setOnboarded] = useState(() => read(DONE_KEY, (s) => s === '1', false))
  const [sync, setSync] = useState<SyncPhase>('off')
  const [syncPending, setSyncPending] = useState(() => read(DIRTY_KEY, (s) => !!s, false))
  const [retry, setRetry] = useState(0)

  // Eng yangi qiymatlar (asinxron funksiyalar eskirgan yopilmani ushlamasligi uchun)
  const profileRef = useRef(profile)
  profileRef.current = profile
  const serverRef = useRef<Profile | null>(null)
  const phaseRef = useRef(sync)
  phaseRef.current = sync

  const setDirty = useCallback((uid: string | null) => {
    write(DIRTY_KEY, uid)
    setSyncPending(uid !== null)
  }, [])

  const applyLocal = useCallback((p: Profile | null) => {
    setProfile(p)
    write(PROFILE_KEY, p ? JSON.stringify(p) : null)
    if (p) {
      setOnboarded(true)
      write(DONE_KEY, '1')
    }
  }, [])

  /** Serverga yozish; xatoda "yuborilmagan" belgisi qoʻyiladi va keyinroq qayta uriniladi. */
  const push = useCallback(
    async (uid: string, p: Profile) => {
      if (!supabase) return false
      try {
        await pushRemoteProfile(supabase, uid, p)
        setDirty(null)
        return true
      } catch {
        setDirty(uid)
        return false
      }
    },
    [setDirty]
  )

  // Sessiya paydo boʻlganda (foydalanuvchi uchun bir marta) mahalliy va server profilini solishtirish
  useEffect(() => {
    if (!userId || !supabase) {
      setSync('off')
      return
    }
    const client = supabase
    let cancelled = false
    setSync('checking')
    ;(async () => {
      try {
        const remote = await Promise.race([
          fetchRemoteProfile(client, userId),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
        ])
        if (cancelled) return
        // Akkauntdagi oʻqib boʻlmaydigan (yangiroq/buzilgan) profil ustiga hech qachon yozilmaydi
        if (remote.kind === 'unreadable') return setSync('error')
        const local = profileRef.current
        const server = remote.kind === 'ok' ? remote.profile : null
        const syncedBefore = read(SYNCED_KEY, (s) => s === userId, false)
        const dirty = read(DIRTY_KEY, (s) => s === userId, false)

        // Shu akkaunt bilan avval hal qilingan: mahalliy profil — kesh. Yuborilmagan oʻzgarish boʻlsa u yuboriladi,
        // aks holda server (boshqa qurilmada yangilangan boʻlishi mumkin) yangiroq hisoblanadi.
        if (syncedBefore && local && dirty) {
          await push(userId, local)
          return !cancelled && setSync('ready')
        }
        if (syncedBefore && server) {
          applyLocal(server)
          return setSync('ready')
        }

        switch (decideSync(local, server)) {
          case 'empty':
            write(SYNCED_KEY, userId)
            return setSync('ready')
          case 'same':
            write(SYNCED_KEY, userId)
            return setSync('ready')
          case 'use-server':
            applyLocal(server)
            write(SYNCED_KEY, userId)
            return setSync('ready')
          case 'ask-migrate':
            return setSync('ask')
          case 'choose':
            serverRef.current = server
            return setSync('choose')
        }
      } catch {
        // Tarmoq xatosi: ilova yiqilmaydi, mahalliy profil bilan ishlaydi; internet qaytganda qayta uriniladi
        if (!cancelled) setSync('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, retry, applyLocal, push])

  // Internet qaytganda: sinxronlash xato bilan tugagan boʻlsa qayta tekshirish, "ready" boʻlsa yuborilmaganini yuborish
  useEffect(() => {
    if (!userId) return
    const onOnline = () => {
      if (phaseRef.current === 'error') setRetry((n) => n + 1)
      else if (phaseRef.current === 'ready' && profileRef.current && read(DIRTY_KEY, (s) => s === userId, false)) void push(userId, profileRef.current)
    }
    window.addEventListener('online', onOnline)
    // Ilova ochilganda ham bir urinish
    if (sync === 'ready') onOnline()
    return () => window.removeEventListener('online', onOnline)
  }, [userId, sync, push])

  const saveAnswers = (a: Answers) => {
    const p: Profile = {
      ...a,
      professionOther: a.profession === 'other' ? cleanText(a.professionOther) : undefined,
      createdAt: profile?.createdAt ?? new Date().toISOString(),
      schemaVersion: PROFILE_SCHEMA_VERSION,
      // Qoʻlda tanlangan yoʻnalish kasb oʻzgarmaguncha saqlanadi
      germanDirection: profile && profile.profession === a.profession ? profile.germanDirection : undefined
    }
    setProfile(p)
    write(PROFILE_KEY, JSON.stringify(p))
    // Server bilan tanlov hal boʻlgandan keyingina yoziladi (hal boʻlmaguncha hech narsa ustiga yozilmaydi)
    if (userId && phaseRef.current === 'ready') void push(userId, p)
  }

  const setGermanDirection = (d: Direction) => {
    const cur = profileRef.current
    if (!cur) return
    const p: Profile = { ...cur, germanDirection: d }
    setProfile(p)
    write(PROFILE_KEY, JSON.stringify(p))
    if (userId && phaseRef.current === 'ready') void push(userId, p)
  }

  const completeOnboarding = () => {
    setOnboarded(true)
    write(DONE_KEY, '1')
  }

  const answerMigrate = async (migrate: boolean) => {
    if (!userId) return
    if (migrate) {
      const local = profileRef.current
      if (local) await push(userId, local)
    } else {
      applyLocal(null)
      setOnboarded(false)
      write(DONE_KEY, null)
    }
    write(SYNCED_KEY, userId)
    setSync('ready')
  }

  const answerChoose = async (use: 'server' | 'local') => {
    if (!userId) return
    if (use === 'server' && serverRef.current) applyLocal(serverRef.current)
    else if (profileRef.current) await push(userId, profileRef.current)
    write(SYNCED_KEY, userId)
    setSync('ready')
  }

  const signOutAndClear = async () => {
    await auth.signOut()
    for (const k of [PROFILE_KEY, DONE_KEY, DIRTY_KEY, SYNCED_KEY]) write(k, null)
    clearProgressStorage()
    // To'liq qayta yuklash: xotiradagi holat ham tozalanadi (umumiy telefon)
    window.location.hash = '#/boshlash?kirish=1'
    window.location.reload()
  }

  return (
    <ProfileContext.Provider
      value={{ profile, onboarded, saveAnswers, completeOnboarding, setGermanDirection, sync, syncPending, answerMigrate, answerChoose, signOutAndClear }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const c = useContext(ProfileContext)
  if (!c) throw new Error('useProfile ProfileProvider ichida ishlatilishi kerak')
  return c
}
