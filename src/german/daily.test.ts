import { describe, expect, it } from 'vitest'
import {
  activityToPush,
  addExercises,
  applyForgiveness,
  isGoal,
  isoWeekStart,
  mergeActivity,
  sanitizeActivity,
  streakInfo,
  todayProgress,
  weekDays,
  type Activity
} from './daily'

/** Kunlar roʻyxatidan faollik: har kunga n ta mashq. */
const act = (days: Record<string, number>, forgiven: string[] = []): Activity =>
  Object.fromEntries(Object.entries(days).map(([d, n]) => [d, { count: n, forgiven: forgiven.includes(d) }]))

// 2026-11-02 — dushanba, 2026-11-08 — yakshanba
describe('kunlik hisob', () => {
  it('mashqlar qoʻshiladi, notoʻgʻri son eʼtiborsiz', () => {
    let a: Activity = {}
    a = addExercises(a, '2026-11-05')
    a = addExercises(a, '2026-11-05', 7)
    expect(a['2026-11-05']).toEqual({ count: 8, forgiven: false })
    expect(addExercises(a, '2026-11-05', 0)).toBe(a)
    expect(addExercises(a, '2026-11-05', -3)).toBe(a)
  })

  it('maqsad: qolgan mashqlar va bajarilgani', () => {
    expect(todayProgress(act({ '2026-11-05': 6 }), '2026-11-05', 10)).toEqual({ count: 6, goal: 10, left: 4, met: false, percent: 60 })
    expect(todayProgress(act({ '2026-11-05': 12 }), '2026-11-05', 10)).toMatchObject({ left: 0, met: true, percent: 100 })
    expect(todayProgress({}, '2026-11-05', 15)).toMatchObject({ count: 0, left: 15, met: false })
  })

  it('maqsad qiymatlari: 10 / 15 / 20', () => {
    expect([10, 15, 20].every(isGoal)).toBe(true)
    expect([0, 5, 12, '10', null].some(isGoal)).toBe(false)
  })
})

describe('ISO hafta', () => {
  it('dushanbadan boshlanadi, yakshanba — oʻsha hafta', () => {
    expect(isoWeekStart('2026-11-02')).toBe('2026-11-02')
    expect(isoWeekStart('2026-11-05')).toBe('2026-11-02')
    expect(isoWeekStart('2026-11-08')).toBe('2026-11-02')
    expect(isoWeekStart('2026-11-09')).toBe('2026-11-09')
    expect(isoWeekStart('2027-01-01')).toBe('2026-12-28') // yil chegarasi
  })

  it('hafta nuqtalari: D…Y, bajarilgan va bugun', () => {
    const w = weekDays(act({ '2026-11-02': 10, '2026-11-03': 4, '2026-11-04': 11 }), '2026-11-05', 10)
    expect(w.map((d) => d.day)).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
    expect(w.map((d) => d.done)).toEqual([true, false, true, false, false, false, false])
    expect(w.find((d) => d.isToday)?.index).toBe(3)
    expect(w.filter((d) => d.future)).toHaveLength(3)
  })
})

describe('streak, kechirim va rekord', () => {
  const G = 10

  it('ketma-ket bajarilgan kunlar; bugun hali bajarilmagan boʻlsa uzilmaydi', () => {
    const a = act({ '2026-11-02': 10, '2026-11-03': 10, '2026-11-04': 12 })
    expect(streakInfo(a, '2026-11-05', G)).toMatchObject({ current: 3, record: 3, forgiven: [] })
    expect(streakInfo({ ...a, ...act({ '2026-11-05': 10 }) }, '2026-11-05', G).current).toBe(4)
  })

  it('bir kun oʻtkazilsa — haftada bir marta kechiriladi, streak uzilmaydi (lekin oshmaydi)', () => {
    const a = act({ '2026-11-02': 10, '2026-11-03': 10, '2026-11-05': 10 }) // 4-noyabr oʻtkazildi
    expect(streakInfo(a, '2026-11-05', G)).toEqual({ current: 3, record: 3, forgiven: ['2026-11-04'] })
  })

  it('shu haftada ikkinchi oʻtkazish — 0 ga tushadi, rekord saqlanadi', () => {
    const a = act({ '2026-11-02': 10, '2026-11-03': 10, '2026-11-05': 10, '2026-11-07': 10 }) // 4 va 6 oʻtkazildi
    expect(streakInfo(a, '2026-11-07', G)).toEqual({ current: 1, record: 3, forgiven: ['2026-11-04'] })
    expect(streakInfo(a, '2026-11-08', G).current).toBe(1) // bugun (yakshanba) hali tugamagan
  })

  it('ketma-ket ikki kun oʻtkazilsa (bir haftada) — 0', () => {
    const a = act({ '2026-11-02': 10, '2026-11-03': 10 })
    expect(streakInfo(a, '2026-11-05', G).current).toBe(2) // 4 kechirildi, 5 — bugun
    expect(streakInfo(a, '2026-11-06', G)).toMatchObject({ current: 0, record: 2 })
  })

  it('hafta chegarasi: yakshanba va dushanba — har biri oʻz haftasida kechiriladi', () => {
    const a = act({ '2026-11-06': 10, '2026-11-07': 10, '2026-11-10': 10 }) // 8 (yakshanba) va 9 (dushanba) oʻtkazildi
    expect(streakInfo(a, '2026-11-10', G)).toEqual({ current: 3, record: 3, forgiven: ['2026-11-08', '2026-11-09'] })
  })

  it('kechirim yangi haftada yana bor', () => {
    const a = act({ '2026-11-02': 10, '2026-11-04': 10, '2026-11-05': 10, '2026-11-06': 10, '2026-11-07': 10, '2026-11-08': 10, '2026-11-09': 10, '2026-11-11': 10 })
    // 3 (1-hafta) va 10 (2-hafta) kechiriladi
    expect(streakInfo(a, '2026-11-11', G)).toEqual({ current: 8, record: 8, forgiven: ['2026-11-03', '2026-11-10'] })
  })

  it('maqsaddan kam mashq — bajarilmagan kun', () => {
    const a = act({ '2026-11-02': 10, '2026-11-03': 9, '2026-11-04': 3, '2026-11-05': 10 })
    expect(streakInfo(a, '2026-11-05', G)).toMatchObject({ current: 1, record: 1 })
    expect(streakInfo(a, '2026-11-05', 3).current).toBe(4) // maqsad 3 boʻlsa hammasi bajarilgan
  })

  it('rekord: avvalgi uzunroq streak saqlanadi', () => {
    const a = act({ '2026-10-19': 10, '2026-10-20': 10, '2026-10-21': 10, '2026-10-22': 10, '2026-10-23': 10, '2026-11-04': 10, '2026-11-05': 10 })
    expect(streakInfo(a, '2026-11-05', G)).toMatchObject({ current: 2, record: 5 })
  })

  it('saqlangan kechirim (boshqa qurilmadan) hisobga olinadi: shu haftada yana kechirim yoʻq', () => {
    const a = act({ '2026-11-02': 10, '2026-11-03': 0, '2026-11-04': 10, '2026-11-06': 10 }, ['2026-11-03'])
    expect(streakInfo(a, '2026-11-06', G)).toMatchObject({ current: 1, forgiven: ['2026-11-03'] })
  })

  it('applyForgiveness kechirim kunini yozadi, qayta chaqirilsa oʻzgarmaydi', () => {
    const a = act({ '2026-11-02': 10, '2026-11-03': 10 })
    const b = applyForgiveness(a, '2026-11-05', G)
    expect(b['2026-11-04']).toEqual({ count: 0, forgiven: true })
    expect(applyForgiveness(b, '2026-11-05', G)).toBe(b)
    expect(applyForgiveness({}, '2026-11-05', G)).toEqual({})
  })

  it('hech narsa yoʻq — 0', () => {
    expect(streakInfo({}, '2026-11-05', G)).toEqual({ current: 0, record: 0, forgiven: [] })
  })
})

describe('faollikni saqlash va birlashtirish', () => {
  it('buzilgan qiymatlar tashlanadi', () => {
    expect(sanitizeActivity({ '2026-11-05': { count: 3, forgiven: true }, '2026-13-01': { count: 1 }, x: { count: 1 }, '2026-11-04': { count: -1 }, '2026-11-03': { count: 1.5 } })).toEqual({
      '2026-11-05': { count: 3, forgiven: true }
    })
    expect(sanitizeActivity(null)).toEqual({})
    expect(sanitizeActivity([1])).toEqual({})
  })

  it('kattaroq mashqlar soni yutadi, kechirim saqlanadi', () => {
    const m = mergeActivity(act({ '2026-11-04': 12, '2026-11-05': 3 }), act({ '2026-11-05': 8, '2026-11-03': 0 }, ['2026-11-03']))
    expect(m).toEqual(act({ '2026-11-03': 0, '2026-11-04': 12, '2026-11-05': 8 }, ['2026-11-03']))
  })

  it('serverga faqat farq qilganlari yuboriladi', () => {
    const server = act({ '2026-11-04': 12, '2026-11-05': 3 })
    const merged = act({ '2026-11-04': 12, '2026-11-05': 8, '2026-11-06': 1 })
    expect(activityToPush(merged, server).map(([d]) => d)).toEqual(['2026-11-05', '2026-11-06'])
  })
})
