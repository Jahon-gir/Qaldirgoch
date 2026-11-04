import { describe, expect, it, vi } from 'vitest'
import { PROFILE_SCHEMA_VERSION, type Profile } from './questions'
import { decideSync, fetchRemoteProfile, normalizeProfile, pushRemoteProfile, sameAnswers } from './sync'

const base: Profile = {
  ageRange: '18-24',
  education: 'school',
  profession: 'electrician',
  germanLevel: 'none',
  dailyTime: '30',
  departure: '1y',
  createdAt: '2026-01-01T00:00:00.000Z',
  schemaVersion: PROFILE_SCHEMA_VERSION
}
const other: Profile = { ...base, profession: 'nurse', germanLevel: 'a1' }

describe('decideSync — mehmon profilini koʻchirish mantigʻi', () => {
  it('faqat telefonda → koʻchirishni soʻraydi', () => expect(decideSync(base, null)).toBe('ask-migrate'))
  it('faqat serverda → serverdagini ishlatadi', () => expect(decideSync(null, base)).toBe('use-server'))
  it('ikkalasi bor va farq qiladi → foydalanuvchi tanlaydi', () => expect(decideSync(base, other)).toBe('choose'))
  it('ikkalasi bor va bir xil → dialog yoʻq', () => {
    // createdAt boshqacha boʻlsa ham javoblar bir xil
    expect(decideSync(base, { ...base, createdAt: '2026-02-02T00:00:00.000Z' })).toBe('same')
  })
  it('ikkalasi ham yoʻq → onboarding', () => expect(decideSync(null, null)).toBe('empty'))
})

describe('sameAnswers', () => {
  it('"Boshqa" kasbda matn farqi hisobga olinadi', () => {
    const a: Profile = { ...base, profession: 'other', professionOther: 'Duradgor' }
    expect(sameAnswers(a, { ...a, professionOther: 'Plitkachi' })).toBe(false)
    expect(sameAnswers(a, { ...a })).toBe(true)
  })
})

describe('normalizeProfile', () => {
  it('eski (sxema versiyasiz) profilga versiya qoʻshadi', () => {
    const { schemaVersion: _v, ...old } = base
    expect(normalizeProfile(old)?.schemaVersion).toBe(PROFILE_SCHEMA_VERSION)
  })
  it('buzilgan yoki yangiroq sxemali maʼlumotni rad etadi', () => {
    expect(normalizeProfile({ ...base, ageRange: 'x' })).toBeNull()
    expect(normalizeProfile({ ...base, schemaVersion: PROFILE_SCHEMA_VERSION + 1 })).toBeNull()
    expect(normalizeProfile(null)).toBeNull()
  })
  it('"Boshqa" matnini tozalaydi (XSS)', () => {
    const p = normalizeProfile({ ...base, profession: 'other', professionOther: '<img onerror=x>  Usta' })
    expect(p?.professionOther).toBe('img onerror=x Usta')
  })
})

/** Supabase klientining kerakli qismini taqlid qiluvchi soxta klient. */
function fakeClient(result: { data?: unknown; error?: unknown }) {
  const upsert = vi.fn().mockResolvedValue(result)
  const eq = vi.fn(() => ({ maybeSingle: () => Promise.resolve(result) }))
  const client = { from: vi.fn(() => ({ select: () => ({ eq }), upsert })) }
  return { client: client as never, eq, upsert }
}

describe('server bilan ishlash (mock)', () => {
  it('qator yoʻq → none', async () => {
    expect(await fetchRemoteProfile(fakeClient({ data: null }).client, 'u1')).toEqual({ kind: 'none' })
  })
  it('qator bor → ok', async () => {
    const r = await fetchRemoteProfile(fakeClient({ data: { data: base } }).client, 'u1')
    expect(r.kind).toBe('ok')
  })
  it('oʻqib boʻlmaydigan qator → unreadable (ustiga yozilmaydi)', async () => {
    expect((await fetchRemoteProfile(fakeClient({ data: { data: { junk: 1 } } }).client, 'u1')).kind).toBe('unreadable')
  })
  it('tarmoq/RLS xatosi tashlanadi', async () => {
    await expect(fetchRemoteProfile(fakeClient({ error: new Error('network') }).client, 'u1')).rejects.toThrow()
  })
  it('yozishda id va updated_at yuboriladi', async () => {
    const { client, upsert } = fakeClient({})
    await pushRemoteProfile(client, 'u1', base)
    const [row, opts] = upsert.mock.calls[0]
    expect(row.id).toBe('u1')
    expect(row.data).toEqual(base)
    expect(Number.isNaN(Date.parse(row.updated_at))).toBe(false)
    expect(opts).toEqual({ onConflict: 'id' })
  })
  it('yozish xatosi tashlanadi (qayta urinish uchun)', async () => {
    await expect(pushRemoteProfile(fakeClient({ error: new Error('offline') }).client, 'u1', base)).rejects.toThrow()
  })
})
