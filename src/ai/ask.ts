import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lang } from '../i18n/I18nProvider'

export type AiSource = { title: string; url: string; checkedAt: string }
export type AiKind = 'fact' | 'no_info' | 'chat'
export type AiAnswer = { answer: string; found: boolean; kind: AiKind; sources: AiSource[]; left?: number }
export type AiError = 'auth' | 'empty' | 'long' | 'limit' | 'offline' | 'config' | 'ai'
export const MAX_QUESTION = 500

/** Savolni Edge Function `ai-ask` ga yuboradi (kalit faqat serverda). Sessiya tokenini supabase-js oʻzi qoʻshadi. */
export async function askAi(client: SupabaseClient | null, question: string, lang: Lang): Promise<{ ok: true; data: AiAnswer } | { ok: false; error: AiError }> {
  if (!client) return { ok: false, error: 'config' }
  const q = question.trim()
  if (q.length < 3) return { ok: false, error: 'empty' }
  if (q.length > MAX_QUESTION) return { ok: false, error: 'long' }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, error: 'offline' }
  const { data, error } = await client.functions.invoke('ai-ask', { body: { question: q, lang } })
  if (error) {
    const status = (error as { context?: Response }).context?.status
    if (status === 401) return { ok: false, error: 'auth' }
    if (status === 429) return { ok: false, error: 'limit' }
    if (status === 400) return { ok: false, error: 'empty' }
    if (status === 503) return { ok: false, error: 'config' }
    if (status === undefined) return { ok: false, error: 'offline' }
    return { ok: false, error: 'ai' }
  }
  const d = data as Partial<AiAnswer>
  if (typeof d?.answer !== 'string') return { ok: false, error: 'ai' }
  const kind: AiKind = d.kind === 'chat' || d.kind === 'fact' || d.kind === 'no_info' ? d.kind : d.found === true ? 'fact' : 'no_info'
  return { ok: true, data: { answer: d.answer, found: d.found === true, kind, sources: Array.isArray(d.sources) ? d.sources : [], left: d.left } }
}

/** Faqat http(s) havola ekranga chiqadi. */
export const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : undefined)
