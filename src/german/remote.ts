import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeResults, type Result, type Results } from './logic'

type Row = { lesson_id: string; score: number; total: number; completed_at: string }

/** Serverdagi (RLS bilan faqat oʻz) dars natijalari. Tarmoq/RLS xatosida xato tashlaydi. */
export async function fetchRemoteResults(client: SupabaseClient, userId: string): Promise<Results> {
  const { data, error } = await client.from('user_lessons').select('lesson_id, score, total, completed_at').eq('user_id', userId)
  if (error) throw error
  const raw: Record<string, unknown> = {}
  for (const r of (data ?? []) as Row[]) raw[r.lesson_id] = { score: r.score, total: r.total, completedAt: r.completed_at }
  return sanitizeResults(raw)
}

export async function pushRemoteResults(client: SupabaseClient, userId: string, results: Result[]): Promise<void> {
  if (!results.length) return
  const rows = results.map((r) => ({ user_id: userId, lesson_id: r.lessonId, score: r.score, total: r.total, completed_at: r.completedAt }))
  const { error } = await client.from('user_lessons').upsert(rows, { onConflict: 'user_id,lesson_id' })
  if (error) throw error
}
