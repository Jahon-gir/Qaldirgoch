import { createContext, useContext, useState, type ReactNode } from 'react'
import { isComplete, type Answers, type Profile } from './questions'

/**
 * Profil hozircha faqat shu qurilmada (localStorage). Keyingi PR'da Supabase'ga koʻchiriladi —
 * shuning uchun saqlash shu modul ichida yashirilgan.
 */
const PROFILE_KEY = 'qaldirgoch.profile'
const DONE_KEY = 'qaldirgoch.onboarded'

function read<T>(key: string, parse: (s: string) => T, fallback: T): T {
  try {
    const s = localStorage.getItem(key)
    return s == null ? fallback : parse(s)
  } catch {
    return fallback
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* xususiy rejimda saqlanmasa ham sessiya davomida ishlayveradi */
  }
}

function loadProfile(): Profile | null {
  return read(
    PROFILE_KEY,
    (s) => {
      const p = JSON.parse(s)
      return p && isComplete(p) ? (p as Profile) : null
    },
    null
  )
}

/** Foydalanuvchi yozgan matn: boshqaruv belgilarisiz, qisqa. Ekranga React orqali (escape bilan) chiqadi. */
export function cleanText(s: string | undefined): string | undefined {
  const v = (s ?? '').replace(/[\u0000-\u001F\u007F<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)
  return v || undefined
}

type Ctx = {
  profile: Profile | null
  onboarded: boolean
  saveAnswers: (a: Answers) => void
  completeOnboarding: () => void
}

const ProfileContext = createContext<Ctx | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(loadProfile)
  const [onboarded, setOnboarded] = useState(() => read(DONE_KEY, (s) => s === '1', false))

  const saveAnswers = (a: Answers) => {
    const p: Profile = {
      ...a,
      professionOther: a.profession === 'other' ? cleanText(a.professionOther) : undefined,
      createdAt: profile?.createdAt ?? new Date().toISOString()
    }
    setProfile(p)
    write(PROFILE_KEY, JSON.stringify(p))
  }

  const completeOnboarding = () => {
    setOnboarded(true)
    write(DONE_KEY, '1')
  }

  return <ProfileContext.Provider value={{ profile, onboarded, saveAnswers, completeOnboarding }}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const c = useContext(ProfileContext)
  if (!c) throw new Error('useProfile ProfileProvider ichida ishlatilishi kerak')
  return c
}
