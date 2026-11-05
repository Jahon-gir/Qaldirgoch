import type { SupabaseClient } from '@supabase/supabase-js'
import { WORD_IDS } from '../content/german/words'
import { sanitizeActivity, type Activity, type DayActivity } from './daily'
import { sanitizeWords, type WordState, type Words } from './srs'

type WordRow = { word_id: string; keyingi_takror: string; interval: number; xatolar: number; updated_at: string }
// mashqlar_soni ustuni nomi qoldi: 0.6.1 dan beri unda tugatilgan dars va takrorlash soni (migratsiya kerak emas)
type DayRow = { sana: string; mashqlar_soni: number; maqsad: number; kechirim: boolean }

/** Serverdagi (RLS bilan faqat oʻz) soʻzlar. Xatoda tashlaydi. */
export async function fetchRemoteWords(client: SupabaseClient, userId: string): Promise<Words> {
  const { data, error } = await client.from('user_words').select('word_id, keyingi_takror, interval, xatolar, updated_at').eq('user_id', userId)
  if (error) throw error
  const raw: Record<string, unknown> = {}
  for (const r of (data ?? []) as WordRow[]) raw[r.word_id] = { due: r.keyingi_takror, interval: r.interval, mistakes: r.xatolar, updatedAt: r.updated_at }
  return sanitizeWords(raw, WORD_IDS)
}

export async function pushRemoteWords(client: SupabaseClient, userId: string, words: [string, WordState][]): Promise<void> {
  if (!words.length) return
  const rows = words.map(([id, s]) => ({ user_id: userId, word_id: id, keyingi_takror: s.due, interval: s.interval, xatolar: s.mistakes, updated_at: s.updatedAt }))
  const { error } = await client.from('user_words').upsert(rows, { onConflict: 'user_id,word_id' })
  if (error) throw error
}

export async function fetchRemoteActivity(client: SupabaseClient, userId: string): Promise<Activity> {
  const { data, error } = await client.from('user_daily_activity').select('sana, mashqlar_soni, maqsad, kechirim').eq('user_id', userId)
  if (error) throw error
  const raw: Record<string, unknown> = {}
  for (const r of (data ?? []) as DayRow[]) raw[r.sana] = { count: r.mashqlar_soni, goal: r.maqsad, forgiven: r.kechirim }
  return sanitizeActivity(raw)
}

export async function pushRemoteActivity(client: SupabaseClient, userId: string, days: [string, DayActivity][]): Promise<void> {
  if (!days.length) return
  const rows = days.map(([d, v]) => ({ user_id: userId, sana: d, mashqlar_soni: v.count, maqsad: v.goal, kechirim: v.forgiven }))
  const { error } = await client.from('user_daily_activity').upsert(rows, { onConflict: 'user_id,sana' })
  if (error) throw error
}
