import { describe, expect, it, vi } from 'vitest'
import { ALL_ITEM_IDS, AUSBILDUNG_STEPS } from '../content/ausbildung'
import { applyPending, hasStarted, mergeItems, progressSummary, reconcile, sanitizeItems, stepStatuses } from './logic'
import { deleteRemoteProgress, fetchRemoteProgress, pushRemoteProgress } from './remote'

const T1 = '2026-11-01T10:00:00.000Z'
const T2 = '2026-11-02T10:00:00.000Z'
const NOW = '2026-11-04T00:00:00.000Z'
const taskIds = (stepId: string) => AUSBILDUNG_STEPS.find((s) => s.id === stepId)!.tasks.map((t) => t.id)
const all = (ids: string[], at = T1) => Object.fromEntries(ids.map((id) => [id, at]))

describe('bosqich holati (hosila)', () => {
  it('yangi foydalanuvchi: 1 va 2 avtomatik bajarilgan, 3-bosqich joriy, qolgani keyingi', () => {
    const s = stepStatuses(AUSBILDUNG_STEPS, {}, true)
    expect(s.slice(0, 3)).toEqual(['done', 'done', 'current'])
    expect(s.slice(3).every((x) => x === 'next')).toBe(true)
    expect(progressSummary(s)).toMatchObject({ done: 2, total: 10, percent: 20, currentIndex: 2 })
  })
  it('onboarding tugamagan boʻlsa avtomatik bajarilmaydi', () => {
    expect(stepStatuses(AUSBILDUNG_STEPS, {}, false)[0]).toBe('current')
  })
  it('barcha vazifalari belgilangan bosqich bajarilgan; joriy — keyingi tugallanmagani', () => {
    const s = stepStatuses(AUSBILDUNG_STEPS, all(taskIds('nemis')), true)
    expect(s[2]).toBe('done')
    expect(s[3]).toBe('current')
  })
  it('vazifalarning bir qismi belgilangan boʻlsa bosqich hali joriy', () => {
    const s = stepStatuses(AUSBILDUNG_STEPS, all(taskIds('nemis').slice(0, 1)), true)
    expect(s[2]).toBe('current')
  })
  it('hujjat belgilari bosqich holatiga taʼsir qilmaydi', () => {
    const s = stepStatuses(AUSBILDUNG_STEPS, { 'hujjatlar.d1': T1 }, true)
    expect(s[4]).toBe('next')
  })
  it('hammasi bajarilsa joriy bosqich yoʻq', () => {
    const items = all(AUSBILDUNG_STEPS.flatMap((s) => s.tasks.map((t) => t.id)))
    const sum = progressSummary(stepStatuses(AUSBILDUNG_STEPS, items, true))
    expect(sum).toMatchObject({ done: 10, percent: 100, currentIndex: -1 })
  })
})

describe('kontent qoidalari', () => {
  it('element idlari takrorlanmaydi', () => {
    const ids = AUSBILDUNG_STEPS.flatMap((s) => [...s.tasks, ...s.documents].map((i) => i.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('Diqqat bloki faqat 6 va 8-bosqichda', () => {
    expect(AUSBILDUNG_STEPS.filter((s) => s.warning).map((s) => s.order)).toEqual([6, 8])
  })
  it('tasdiqlanmagan muddatlar null; xarajat faqat 2, 8, 10-bosqichda', () => {
    expect(AUSBILDUNG_STEPS.every((s) => !s.duration)).toBe(true)
    expect(AUSBILDUNG_STEPS.filter((s) => s.cost).map((s) => [s.order, s.cost!.amount])).toEqual([[2, 822], [8, 75], [10, 100]])
  })
  it('manbalar: faqat https va tekshirilgan sana bor', () => {
    for (const src of AUSBILDUNG_STEPS.flatMap((s) => s.sources)) {
      expect(src.url.startsWith('https://')).toBe(true)
      expect(src.checkedAt).toBe('2026-11-04')
    }
  })
})

describe('sanitizeItems', () => {
  it('nomaʼlum id, notoʻgʻri sana va chiqindini tashlaydi', () => {
    expect(sanitizeItems({ 'viza.t1': T1, 'x.y': T1, 'viza.t2': 'bad', 'viza.d1': 5 })).toEqual({ 'viza.t1': T1 })
    expect(sanitizeItems(null)).toEqual({})
    expect(sanitizeItems([T1])).toEqual({})
  })
  it('ALL_ITEM_IDS kontentdagi hamma elementni oʻz ichiga oladi', () => expect(ALL_ITEM_IDS.has('viza.d4')).toBe(true))
})

describe('progress birlashtirish (mehmon → akkaunt)', () => {
  it('ikkala tomon belgilanganlari birlashadi, takrorda eng erta sana qoladi', () => {
    expect(mergeItems({ a: T2, b: T1 }, { b: T2, c: T1 })).toEqual({ a: T2, b: T1, c: T1 })
  })
  it('birinchi sinxron: birlashtirilib, serverda yoʻqlari yuboriladi, oʻchirish yoʻq', () => {
    const r = reconcile({ 'nemis.t1': T1 }, { 'nemis.t2': T2 }, {}, true, NOW)
    expect(r.items).toEqual({ 'nemis.t1': T1, 'nemis.t2': T2 })
    expect(r.toPush).toEqual({ 'nemis.t1': T1 })
    expect(r.toDelete).toEqual([])
  })
  it('mehmon progressi boʻsh boʻlsa server progressi saqlanadi', () => {
    const r = reconcile({}, { 'viza.t1': T1 }, {}, true, NOW)
    expect(r.items).toEqual({ 'viza.t1': T1 })
    expect(r.toPush).toEqual({})
  })
  it('keyingi sinxron: server asos; internetsiz belgilash yuboriladi, olib tashlash oʻchiriladi', () => {
    const r = reconcile({ 'a': T1, 'c': T2 }, { b: T1, c: T2 }, { a: 'set', c: 'del' }, false, NOW)
    expect(r.items).toEqual({ a: T1, b: T1 })
    expect(r.toPush).toEqual({ a: T1 })
    expect(r.toDelete).toEqual(['c'])
  })
  it('keyingi sinxron: boshqa qurilmadagi belgilar olinadi', () => {
    expect(reconcile({}, { 'viza.t1': T1 }, {}, false, NOW).items).toEqual({ 'viza.t1': T1 })
  })
  it('applyPending: set — mahalliy sana, del — olib tashlaydi', () => {
    expect(applyPending({ x: T1 }, { a: 'set', x: 'del' }, { a: T2 }, NOW)).toEqual({ a: T2 })
  })
})

/** Supabase klientining kerakli qismini taqlid qiluvchi soxta klient. */
function fakeClient(result: { data?: unknown; error?: unknown }) {
  const upsert = vi.fn().mockResolvedValue(result)
  const inFn = vi.fn().mockResolvedValue(result)
  const eqDelete = vi.fn(() => ({ in: inFn }))
  const eqSelect = vi.fn().mockResolvedValue(result)
  const client = { from: vi.fn(() => ({ select: () => ({ eq: eqSelect }), upsert, delete: () => ({ eq: eqDelete }) })) }
  return { client: client as never, upsert, inFn, eqDelete, eqSelect }
}

describe('server bilan ishlash (mock)', () => {
  it('serverdagi qatorlar Items ga aylanadi, notanish id tashlanadi', async () => {
    const { client, eqSelect } = fakeClient({ data: [{ item_id: 'viza.t1', done_at: T1 }, { item_id: 'junk', done_at: T1 }] })
    expect(await fetchRemoteProgress(client, 'u1')).toEqual({ 'viza.t1': T1 })
    expect(eqSelect).toHaveBeenCalledWith('user_id', 'u1')
  })
  it('tarmoq/RLS xatosi tashlanadi', async () => {
    await expect(fetchRemoteProgress(fakeClient({ error: new Error('offline') }).client, 'u1')).rejects.toThrow()
  })
  it('yozishda user_id va element id yuboriladi', async () => {
    const { client, upsert } = fakeClient({})
    await pushRemoteProgress(client, 'u1', { 'viza.t1': T1 })
    expect(upsert).toHaveBeenCalledWith([{ user_id: 'u1', item_id: 'viza.t1', done_at: T1 }], { onConflict: 'user_id,item_id' })
  })
  it('boʻsh roʻyxatda serverga murojaat qilinmaydi', async () => {
    const { client, upsert, inFn } = fakeClient({})
    await pushRemoteProgress(client, 'u1', {})
    await deleteRemoteProgress(client, 'u1', [])
    expect(upsert).not.toHaveBeenCalled()
    expect(inFn).not.toHaveBeenCalled()
  })
  it('oʻchirish faqat oʻz user_id va berilgan idlar boʻyicha', async () => {
    const { client, eqDelete, inFn } = fakeClient({})
    await deleteRemoteProgress(client, 'u1', ['viza.t1'])
    expect(eqDelete).toHaveBeenCalledWith('user_id', 'u1')
    expect(inFn).toHaveBeenCalledWith('item_id', ['viza.t1'])
  })
})

describe('hasStarted (kirish ekrani tugmasi)', () => {
  const at = '2026-11-01T00:00:00.000Z'
  it('boʻsh yoki faqat 1-2-bosqich elementlari — boshlamagan', () => {
    expect(hasStarted({})).toBe(false)
    expect(hasStarted({ 'profil.t1': at, 'yol.t1': at, 'yol.t2': at })).toBe(false)
  })
  it('boshqa bosqichda vazifa yoki hujjat belgilangan — boshlagan', () => {
    expect(hasStarted({ 'nemis.t1': at })).toBe(true)
    expect(hasStarted({ 'yol.t1': at, 'hujjatlar.d1': at })).toBe(true)
  })
})
