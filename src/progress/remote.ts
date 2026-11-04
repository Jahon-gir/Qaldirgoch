import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeItems, type Items } from './logic'

/** Serverdagi (RLS bilan faqat oʻz) belgilangan elementlar. Tarmoq/RLS xatosida xato tashlaydi. */
export async function fetchRemoteProgress(client: SupabaseClient, userId: string): Promise<Items> {
  const { data, error } = await client.from('user_progress').select('item_id, done_at').eq('user_id', userId)
  if (error) throw error
  const raw: Record<string, unknown> = {}
  for (const r of (data ?? []) as { item_id: string; done_at: string }[]) raw[r.item_id] = r.done_at
  return sanitizeItems(raw)
}

export async function pushRemoteProgress(client: SupabaseClient, userId: string, items: Items): Promise<void> {
  const rows = Object.entries(items).map(([item_id, done_at]) => ({ user_id: userId, item_id, done_at }))
  if (!rows.length) return
  const { error } = await client.from('user_progress').upsert(rows, { onConflict: 'user_id,item_id' })
  if (error) throw error
}

export async function deleteRemoteProgress(client: SupabaseClient, userId: string, ids: string[]): Promise<void> {
  if (!ids.length) return
  const { error } = await client.from('user_progress').delete().eq('user_id', userId).in('item_id', ids)
  if (error) throw error
}
