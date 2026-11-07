// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { loadAgencies, readCache, safeHttpsUrl, sanitizeAgencies } from './registry'
import { FIXTURE } from './fixtures'

const KEY = 'qaldirgoch.agencies.v1'
const client = (res: { data?: unknown; error?: unknown }) => ({ from: () => ({ select: () => Promise.resolve({ data: res.data ?? null, error: res.error ?? null }) }) }) as unknown as SupabaseClient

beforeEach(() => localStorage.clear())
afterEach(() => vi.useRealTimers())

describe('sanitizeAgencies', () => {
  it('yaroqsiz qatorlar va xavfli havolalar tashlanadi', () => {
    const bad = [{ ...FIXTURE[0], manba_url: 'javascript:alert(1)' }, { ...FIXTURE[0], id: '' }, null, 5, { ...FIXTURE[0], tekshirilgan: 'kecha' }]
    expect(sanitizeAgencies([...bad, FIXTURE[1]])).toEqual([FIXTURE[1]])
    expect(sanitizeAgencies('x')).toEqual([])
  })
  it('safeHttpsUrl faqat https', () => {
    expect(safeHttpsUrl('https://gov.uz/a')).toBe('https://gov.uz/a')
    for (const u of ['http://gov.uz', 'javascript:1', 'data:text/html,x', '', null]) expect(safeHttpsUrl(u)).toBeNull()
  })
})

describe('loadAgencies: kesh va oflayn', () => {
  it('kesh yo‘q: tarmoqdan oladi va keshlaydi', async () => {
    const r = await loadAgencies(client({ data: FIXTURE }))
    expect(r.fromCache).toBe(false)
    expect(r.rows).toHaveLength(3)
    expect(readCache()?.rows).toHaveLength(3)
  })
  it('kesh bor: tarmoqsiz (klient null) ham ishlaydi — oflayn', async () => {
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), rows: FIXTURE }))
    const r = await loadAgencies(null)
    expect(r.fromCache).toBe(true)
    expect(r.rows).toHaveLength(3)
  })
  it('kesh bor, tarmoq xato: eski nusxa ko‘rsatiladi, xato tashlanmaydi', async () => {
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now() - 3 * 86400000, rows: FIXTURE }))
    const r = await loadAgencies(client({ error: new Error('offline') }))
    expect(r.rows).toHaveLength(3)
  })
  it('yangi kesh bor: tarmoqqa umuman so‘rov ketmaydi', async () => {
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), rows: FIXTURE }))
    const from = vi.fn()
    await loadAgencies({ from } as unknown as SupabaseClient)
    expect(from).not.toHaveBeenCalled()
  })
  it('kesh ham, tarmoq ham yo‘q: xato', async () => {
    await expect(loadAgencies(null)).rejects.toThrow()
    await expect(loadAgencies(client({ error: new Error('x') }))).rejects.toBeTruthy()
  })
  it('buzilgan kesh e‘tiborga olinmaydi', () => {
    localStorage.setItem(KEY, '{not json')
    expect(readCache()).toBeNull()
  })
})
