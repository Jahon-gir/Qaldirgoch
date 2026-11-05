import { describe, expect, it, vi } from 'vitest'
import { mergeWords, pickWord, sanitizeWords, wordsToPush, type WordState } from './srs'
import { fetchRemoteActivity, fetchRemoteWords, pushRemoteActivity, pushRemoteWords } from './wordsRemote'

const T1 = '2026-11-01T10:00:00.000Z'
const T2 = '2026-11-05T10:00:00.000Z'
const ws = (due: string, interval: number, mistakes = 0, updatedAt = T1): WordState => ({ due, interval, mistakes, updatedAt })

describe('soʻzlarni saqlash', () => {
  it('buzilgan va nomaʼlum soʻzlar tashlanadi', () => {
    const raw = {
      'a1-m1-hallo': { due: '2026-11-06', interval: 3, mistakes: 1, updatedAt: T1 },
      'a1-m1-yoq': { due: '2026-11-06', interval: 3, mistakes: 0, updatedAt: T1 },
      'a1-m1-guten-tag': { due: '2026-02-30', interval: 3, mistakes: 0 },
      'a1-m1-guten-abend': { due: '2026-11-06', interval: 0, mistakes: 0 },
      'a1-m1-tschuess': { due: '2026-11-06', interval: 1, mistakes: -1 },
      'a1-m1-gute-nacht': { due: '2026-11-06', interval: 1, mistakes: 0 } // updatedAt yoʻq — eng eski vaqt
    }
    const known = new Set(['a1-m1-hallo', 'a1-m1-guten-tag', 'a1-m1-guten-abend', 'a1-m1-tschuess', 'a1-m1-gute-nacht'])
    expect(sanitizeWords(raw, known)).toEqual({
      'a1-m1-hallo': ws('2026-11-06', 3, 1),
      'a1-m1-gute-nacht': ws('2026-11-06', 1, 0, new Date(0).toISOString())
    })
    expect(sanitizeWords('junk')).toEqual({})
  })
})

describe('mehmon → akkaunt va sinxron', () => {
  it('koʻchirishda keyinroq keyingi_takror yutadi', () => {
    const local = { a: ws('2026-11-20', 14, 0, T1), b: ws('2026-11-06', 1, 2, T2), c: ws('2026-11-07', 3) }
    const server = { a: ws('2026-11-08', 3, 0, T2), b: ws('2026-11-10', 7, 0, T1), d: ws('2026-11-09', 7) }
    expect(mergeWords(local, server, 'migrate')).toEqual({ a: local.a, b: server.b, c: local.c, d: server.d })
  })

  it('keyingi sinxronlarda yangiroq oʻzgarish yutadi (xato javob yoʻqolmaydi)', () => {
    const synced = ws('2026-11-19', 14, 0, T1)
    const wrongNow = ws('2026-11-06', 1, 1, T2) // shu telefonda xato javob berildi
    expect(pickWord(wrongNow, synced, 'sync')).toBe(wrongNow)
    expect(pickWord(wrongNow, synced, 'migrate')).toBe(synced)
  })

  it('serverga faqat yangi yoki oʻzgarganlari yuboriladi', () => {
    const server = { a: ws('2026-11-08', 3), b: ws('2026-11-08', 3) }
    const merged = { a: ws('2026-11-08', 3), b: ws('2026-11-12', 7, 0, T2), c: ws('2026-11-06', 1) }
    expect(wordsToPush(merged, server).map(([id]) => id)).toEqual(['b', 'c'])
  })
})

function fakeClient(result: { data?: unknown; error?: unknown }) {
  const eq = vi.fn(async () => result)
  const select = vi.fn(() => ({ eq }))
  const upsert = vi.fn(async () => ({ error: result.error ?? null }))
  const from = vi.fn(() => ({ select, upsert }))
  return { client: { from } as never, from, select, eq, upsert }
}

describe('Supabase: user_words va user_daily_activity', () => {
  it('soʻzlar oʻqiladi (faqat oʻz qatorlari) va tozalanadi', async () => {
    const f = fakeClient({
      data: [
        { word_id: 'a1-m1-hallo', keyingi_takror: '2026-11-08', interval: 3, xatolar: 1, updated_at: T1 },
        { word_id: 'begona', keyingi_takror: '2026-11-08', interval: 3, xatolar: 0, updated_at: T1 }
      ]
    })
    expect(await fetchRemoteWords(f.client, 'u1')).toEqual({ 'a1-m1-hallo': ws('2026-11-08', 3, 1) })
    expect(f.from).toHaveBeenCalledWith('user_words')
    expect(f.eq).toHaveBeenCalledWith('user_id', 'u1')
  })

  it('soʻzlar upsert qilinadi; boʻsh roʻyxat — soʻrov yoʻq; xatoda tashlaydi', async () => {
    const f = fakeClient({})
    await pushRemoteWords(f.client, 'u1', [['a1-m1-hallo', ws('2026-11-08', 3, 1)]])
    expect(f.upsert).toHaveBeenCalledWith([{ user_id: 'u1', word_id: 'a1-m1-hallo', keyingi_takror: '2026-11-08', interval: 3, xatolar: 1, updated_at: T1 }], { onConflict: 'user_id,word_id' })
    const g = fakeClient({})
    await pushRemoteWords(g.client, 'u1', [])
    expect(g.from).not.toHaveBeenCalled()
    await expect(pushRemoteWords(fakeClient({ error: new Error('offline') }).client, 'u1', [['a1-m1-hallo', ws('2026-11-08', 3)]])).rejects.toThrow()
    await expect(fetchRemoteWords(fakeClient({ error: new Error('offline') }).client, 'u1')).rejects.toThrow()
  })

  it('faollik oʻqiladi va yoziladi', async () => {
    const f = fakeClient({ data: [{ sana: '2026-11-05', mashqlar_soni: 6, maqsad: 15, kechirim: false }, { sana: 'xato', mashqlar_soni: 1, maqsad: 10, kechirim: false }] })
    expect(await fetchRemoteActivity(f.client, 'u1')).toEqual({ '2026-11-05': { count: 6, goal: 15, forgiven: false } })
    expect(f.from).toHaveBeenCalledWith('user_daily_activity')
    const g = fakeClient({})
    await pushRemoteActivity(g.client, 'u1', [['2026-11-04', { count: 0, goal: 20, forgiven: true }]])
    expect(g.upsert).toHaveBeenCalledWith([{ user_id: 'u1', sana: '2026-11-04', mashqlar_soni: 0, maqsad: 20, kechirim: true }], { onConflict: 'user_id,sana' })
  })
})
