// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { localDay, type Words } from './srs'

/** Kirgan foydalanuvchi va soxta Supabase: jadvallar xotirada. */
const db = vi.hoisted(() => ({ tables: {} as Record<string, Record<string, unknown>[]>, upserts: [] as { table: string; rows: Record<string, unknown>[] }[], fail: false }))
const profile = vi.hoisted(() => ({ sync: 'ready', guestDiscarded: false, dailyGoal: 10 }))

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: async () => (db.fail ? { data: null, error: new Error('offline') } : { data: db.tables[table] ?? [], error: null })
      }),
      upsert: async (rows: Record<string, unknown>[]) => {
        db.upserts.push({ table, rows })
        return { error: null }
      }
    })
  }
}))
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ status: 'signedIn', user: { id: 'u1' } }) }))
vi.mock('../profile/ProfileProvider', () => ({ useProfile: () => profile }))
vi.mock('./LessonsProvider', () => ({ useLessons: () => ({ results: {} }) }))

const { WordsProvider } = await import('./WordsProvider')

const T_OLD = '2026-11-01T10:00:00.000Z'
const TODAY = localDay()
const stored = (): Words => JSON.parse(localStorage.getItem('qaldirgoch.words') ?? '{}')

beforeEach(() => {
  localStorage.clear()
  db.tables = {}
  db.upserts = []
  db.fail = false
  profile.sync = 'ready'
  profile.guestDiscarded = false
})
afterEach(() => cleanup())

describe('WordsProvider: mehmon → akkaunt va oflayn navbat', () => {
  it('birinchi kirishda mehmon soʻzlari va faolligi koʻchiriladi: keyinroq muddat va kattaroq son yutadi', async () => {
    localStorage.setItem('qaldirgoch.words', JSON.stringify({ 'a1-m1-hallo': { due: '2026-12-20', interval: 30, mistakes: 0, updatedAt: T_OLD }, 'a1-m1-guten-tag': { due: '2026-11-06', interval: 1, mistakes: 1, updatedAt: '2026-11-04T10:00:00.000Z' } }))
    localStorage.setItem('qaldirgoch.activity', JSON.stringify({ [TODAY]: { count: 4, forgiven: false } }))
    db.tables.user_words = [
      { word_id: 'a1-m1-hallo', keyingi_takror: '2026-11-10', interval: 7, xatolar: 0, updated_at: '2026-11-04T10:00:00.000Z' },
      { word_id: 'a1-m1-guten-tag', keyingi_takror: '2026-11-15', interval: 14, xatolar: 0, updated_at: T_OLD }
    ]
    db.tables.user_daily_activity = [{ sana: TODAY, mashqlar_soni: 9, kechirim: false }]
    render(<WordsProvider>{null}</WordsProvider>)
    await waitFor(() => expect(localStorage.getItem('qaldirgoch.words.synced')).toBe('u1'))
    expect(stored()['a1-m1-hallo']).toMatchObject({ due: '2026-12-20', interval: 30 })
    expect(stored()['a1-m1-guten-tag']).toMatchObject({ due: '2026-11-15', interval: 14 })
    expect(JSON.parse(localStorage.getItem('qaldirgoch.activity')!)[TODAY].count).toBe(9)
    const pushedWords = db.upserts.filter((u) => u.table === 'user_words').flatMap((u) => u.rows)
    expect(pushedWords.map((r) => r.word_id)).toEqual(['a1-m1-hallo']) // faqat serverdan farq qilgani
    expect(db.upserts.some((u) => u.table === 'user_daily_activity')).toBe(false) // server soni katta — yuborish shart emas
  })

  it('"yangidan boshlash" tanlangan boʻlsa mehmon soʻzlari koʻchirilmaydi', async () => {
    profile.guestDiscarded = true
    localStorage.setItem('qaldirgoch.words', JSON.stringify({ 'a1-m1-hallo': { due: '2026-12-20', interval: 30, mistakes: 0, updatedAt: T_OLD } }))
    db.tables.user_words = [{ word_id: 'a1-m1-guten-tag', keyingi_takror: '2026-11-15', interval: 14, xatolar: 0, updated_at: T_OLD }]
    render(<WordsProvider>{null}</WordsProvider>)
    await waitFor(() => expect(localStorage.getItem('qaldirgoch.words.synced')).toBe('u1'))
    expect(Object.keys(stored())).toEqual(['a1-m1-guten-tag'])
    expect(db.upserts.filter((u) => u.table === 'user_words')).toEqual([])
  })

  it('profil savoli hal boʻlmaguncha server bilan birlashtirilmaydi', async () => {
    profile.sync = 'ask'
    localStorage.setItem('qaldirgoch.words', JSON.stringify({ 'a1-m1-hallo': { due: '2026-12-20', interval: 30, mistakes: 0, updatedAt: T_OLD } }))
    render(<WordsProvider>{null}</WordsProvider>)
    await new Promise((r) => setTimeout(r, 20))
    expect(localStorage.getItem('qaldirgoch.words.synced')).toBeNull()
    expect(db.upserts).toEqual([])
  })

  it('internet yoʻq — mahalliy nusxa qoladi, "online" boʻlganda yuboriladi', async () => {
    db.fail = true
    localStorage.setItem('qaldirgoch.words.synced', 'u1')
    localStorage.setItem('qaldirgoch.words', JSON.stringify({ 'a1-m1-hallo': { due: '2026-11-08', interval: 3, mistakes: 0, updatedAt: T_OLD } }))
    render(<WordsProvider>{null}</WordsProvider>)
    await new Promise((r) => setTimeout(r, 20))
    expect(db.upserts).toEqual([])
    expect(stored()['a1-m1-hallo'].interval).toBe(3)
    db.fail = false
    window.dispatchEvent(new Event('online'))
    await waitFor(() => expect(db.upserts.find((u) => u.table === 'user_words')?.rows[0]).toMatchObject({ user_id: 'u1', word_id: 'a1-m1-hallo', keyingi_takror: '2026-11-08', interval: 3, xatolar: 0 }))
  })
})
