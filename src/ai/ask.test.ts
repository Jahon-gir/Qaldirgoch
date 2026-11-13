import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { askAi, safeUrl } from './ask'

const client = (data: unknown, status?: number) =>
  ({ functions: { invoke: async () => (status ? { data: null, error: { context: status === -1 ? undefined : new Response('', { status }) } } : { data, error: null }) } }) as unknown as SupabaseClient

describe('askAi', () => {
  it('javob va manbalarni qaytaradi', async () => {
    const r = await askAi(client({ answer: 'J', found: true, sources: [{ title: 'BIBB', url: 'https://bibb.de', checkedAt: '2026-11-04' }], left: 19 }), 'Savol?', 'uz')
    expect(r).toEqual({ ok: true, data: { answer: 'J', found: true, sources: [{ title: 'BIBB', url: 'https://bibb.de', checkedAt: '2026-11-04' }], left: 19 } })
  })
  it('xato holatlari', async () => {
    expect(await askAi(null, 'Savol?', 'uz')).toEqual({ ok: false, error: 'config' })
    expect(await askAi(client({}), 'a', 'uz')).toEqual({ ok: false, error: 'empty' })
    expect(await askAi(client({}), 'a'.repeat(501), 'uz')).toEqual({ ok: false, error: 'long' })
    expect(await askAi(client(null, 429), 'Savol?', 'uz')).toEqual({ ok: false, error: 'limit' })
    expect(await askAi(client(null, 401), 'Savol?', 'uz')).toEqual({ ok: false, error: 'auth' })
    expect(await askAi(client(null, 502), 'Savol?', 'uz')).toEqual({ ok: false, error: 'ai' })
    expect(await askAi(client({ nope: 1 }), 'Savol?', 'uz')).toEqual({ ok: false, error: 'ai' })
  })
  it('faqat http(s) havola', () => {
    expect(safeUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeUrl('https://gov.uz')).toBe('https://gov.uz')
  })
})
