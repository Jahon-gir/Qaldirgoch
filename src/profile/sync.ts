import type { SupabaseClient } from '@supabase/supabase-js'
import { countryById } from '../content/countries'
import { isDirection } from '../german/logic'
import { isComplete, PROFILE_SCHEMA_VERSION, QUESTIONS, type Answers, type Profile } from './questions'

/** Foydalanuvchi yozgan matn: boshqaruv belgilarisiz, qisqa. Ekranga React orqali (escape bilan) chiqadi. */
export function cleanText(s: string | undefined): string | undefined {
  const v = (s ?? '').replace(/[\u0000-\u001F\u007F<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)
  return v || undefined
}

/**
 * Tashqaridan (localStorage yoki server) kelgan qiymatni toʻgʻri Profile'ga keltiradi.
 * Buzilgan yoki yangiroq sxemali boʻlsa — null (eski ilova yangi maʼlumotni buzmasin).
 */
export function normalizeProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object' || !isComplete(raw as Partial<Answers>)) return null
  const r = raw as Answers & { schemaVersion?: unknown; createdAt?: unknown }
  const g = (raw as { germanDirection?: unknown }).germanDirection
  const sc = (raw as { selectedCountry?: unknown }).selectedCountry
  const version = typeof r.schemaVersion === 'number' ? r.schemaVersion : 1
  if (version > PROFILE_SCHEMA_VERSION) return null
  return {
    ageRange: r.ageRange,
    education: r.education,
    profession: r.profession,
    professionOther: r.profession === 'other' ? cleanText(typeof r.professionOther === 'string' ? r.professionOther : undefined) : undefined,
    germanLevel: r.germanLevel,
    dailyTime: r.dailyTime,
    departure: r.departure,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    schemaVersion: PROFILE_SCHEMA_VERSION,
    germanDirection: isDirection(g) ? (g as Profile['germanDirection']) : undefined,
    selectedCountry: typeof sc === 'string' && countryById(sc)?.status === 'open' ? (sc as Profile['selectedCountry']) : undefined
  }
}

/** Ikki profil javoblari boʻyicha bir xilmi (createdAt va sxema versiyasi hisobga olinmaydi). */
export function sameAnswers(a: Profile, b: Profile): boolean {
  return (
    QUESTIONS.every((q) => a[q.id] === b[q.id]) &&
    (a.profession !== 'other' || (a.professionOther ?? '') === (b.professionOther ?? ''))
  )
}

export type SyncDecision =
  | 'empty' // ikkalasi yoʻq → onboarding
  | 'ask-migrate' // faqat telefonda → koʻchirishni soʻra
  | 'use-server' // faqat serverda → yuklab ishlat
  | 'choose' // ikkalasi bor, farq qiladi → foydalanuvchi tanlaydi
  | 'same' // ikkalasi bir xil → dialog yoʻq

export function decideSync(local: Profile | null, server: Profile | null): SyncDecision {
  if (!local && !server) return 'empty'
  if (local && !server) return 'ask-migrate'
  if (!local && server) return 'use-server'
  return sameAnswers(local!, server!) ? 'same' : 'choose'
}

export type RemoteResult = { kind: 'none' } | { kind: 'ok'; profile: Profile } | { kind: 'unreadable' }

/** Serverdagi (RLS bilan faqat oʻz) profil qatorini oʻqiydi. Tarmoq xatosida xato tashlaydi. */
export async function fetchRemoteProfile(client: SupabaseClient, userId: string): Promise<RemoteResult> {
  const { data, error } = await client.from('profiles').select('data').eq('id', userId).maybeSingle()
  if (error) throw error
  if (!data) return { kind: 'none' }
  const profile = normalizeProfile((data as { data: unknown }).data)
  return profile ? { kind: 'ok', profile } : { kind: 'unreadable' }
}

/** Profilni serverga yozadi (updated_at bilan). Xatoda tashlaydi — chaqiruvchi qayta urinadi. */
export async function pushRemoteProfile(client: SupabaseClient, userId: string, profile: Profile): Promise<void> {
  const { error } = await client
    .from('profiles')
    .upsert({ id: userId, data: profile, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw error
}
