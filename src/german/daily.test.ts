import { describe, expect, it } from 'vitest'
import {
  activityToPush,
  addDone,
  applyForgiveness,
  isGoal,
  isoWeekStart,
  LEGACY_GOAL,
  migrateTodayRow,
  normalizeGoal,
  mergeActivity,
  sanitizeActivity,
  setTodayGoal,
  streakInfo,
  todayProgress,
  weekDays,
  type Activity
} from './daily'

/** Kunlar roʻyxatidan faollik: har kunga n ta mashq, oʻsha kungi maqsad goal (standart 10). */
const act = (days: Record<string, number>, forgiven: string[] = [], goal = 10): Activity =>
  Object.fromEntries(Object.entries(days).map(([d, n]) => [d, { count: n, goal, forgiven: forgiven.includes(d) }]))

// 2026-11-02 — dushanba, 2026-11-08 — yakshanba
describe('kunlik hisob', () => {
  it('tugatilgan dars/takrorlash qoʻshiladi, kunga oʻsha paytdagi maqsad yoziladi; notoʻgʻri son eʼtiborsiz', () => {
    let a: Activity = {}
    a = addDone(a, '2026-11-05', 1)
    a = addDone(a, '2026-11-05', 2)
    expect(a['2026-11-05']).toEqual({ count: 2, goal: 2, forgiven: false })
    expect(addDone(a, '2026-11-05', 2, 0)).toBe(a)
    expect(addDone(a, '2026-11-05', 2, -3)).toBe(a)
  })

  it('maqsad oʻzgarsa faqat bugungi kun yangilanadi', () => {
    const a = act({ '2026-11-04': 12, '2026-11-05': 3 })
    const b = setTodayGoal(a, '2026-11-05', 20)
    expect(b['2026-11-05'].goal).toBe(20)
    expect(b['2026-11-04']).toBe(a['2026-11-04'])
    expect(setTodayGoal(b, '2026-11-05', 20)).toBe(b)
    expect(setTodayGoal({}, '2026-11-05', 20)).toEqual({}) // bugun hali yozuv yoʻq
  })

  it('maqsad: qolgan mashqlar va bajarilgani', () => {
    expect(todayProgress(act({ '2026-11-05': 1 }, [], 2), '2026-11-05', 2)).toEqual({ count: 1, goal: 2, left: 1, met: false, percent: 50 })
    expect(todayProgress(act({ '2026-11-05': 3 }, [], 2), '2026-11-05', 2)).toMatchObject({ left: 0, met: true, percent: 100 })
    expect(todayProgress({}, '2026-11-05', 3)).toMatchObject({ count: 0, left: 3, met: false })
  })

  it('maqsad qiymatlari: 1 / 2 / 3', () => {
    expect([1, 2, 3].every(isGoal)).toBe(true)
    expect([0, 4, 10, 15, 20, '1', null].some(isGoal)).toBe(false)
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

  it('maqsaddan kam mashq — bajarilmagan kun (oʻsha kungi maqsad bilan)', () => {
    const a = act({ '2026-11-02': 10, '2026-11-03': 9, '2026-11-04': 3, '2026-11-05': 10 })
    expect(streakInfo(a, '2026-11-05', G)).toMatchObject({ current: 1, record: 1 })
    const low = act({ '2026-11-02': 10, '2026-11-03': 9, '2026-11-04': 3, '2026-11-05': 10 }, [], 3)
    expect(streakInfo(low, '2026-11-05', 3).current).toBe(4) // oʻsha kunlarda maqsad 3 boʻlgan — hammasi bajarilgan
  })

  it('maqsad 10 dan 20 ga oshirilsa: oʻtgan kunlar, streak va rekord oʻzgarmaydi, kechirim sarflanmaydi', () => {
    // Oʻtgan 3 kun maqsad 10 bilan bajarilgan (12, 10, 15 — 20 dan kam), rekord 5 avvalroq
    // 31-oktyabr — oʻtgan haftada avval ishlatilgan (saqlangan) kechirim, 1-noyabr — uzilish
    const a = act({ '2026-10-26': 10, '2026-10-27': 10, '2026-10-28': 10, '2026-10-29': 10, '2026-10-30': 10, '2026-10-31': 0, '2026-11-02': 12, '2026-11-03': 10, '2026-11-04': 15, '2026-11-05': 4 }, ['2026-10-31'])
    const before = streakInfo(a, '2026-11-05', 10)
    expect(before).toEqual({ current: 3, record: 5, forgiven: ['2026-10-31'] })
    // Bugun maqsad 20 ga oshirildi: oʻtgan kunlar oʻz maqsadi (10) bilan qoladi
    const after = setTodayGoal(a, '2026-11-05', 20)
    expect(after['2026-11-04']).toEqual({ count: 15, goal: 10, forgiven: false })
    expect(streakInfo(after, '2026-11-05', 20)).toEqual(before) // streak, rekord, kechirim — oʻzgarmadi
    expect(applyForgiveness(after, '2026-11-05', 20)).toBe(after) // hech qaysi kun kechirilmaydi
    expect(weekDays(after, '2026-11-05', 20).map((d) => d.done)).toEqual(weekDays(a, '2026-11-05', 10).map((d) => d.done))
    // Bugungi kun endi 20 bilan oʻlchanadi: 15 ta mashq yetmaydi, 20 ta — yetadi
    expect(streakInfo(setTodayGoal({ ...a, '2026-11-05': { count: 15, goal: 10, forgiven: false } }, '2026-11-05', 20), '2026-11-05', 20).current).toBe(3)
    expect(streakInfo(setTodayGoal({ ...a, '2026-11-05': { count: 20, goal: 10, forgiven: false } }, '2026-11-05', 20), '2026-11-05', 20).current).toBe(4)
  })

  it('maqsad pasaytirilsa ham oʻtgan bajarilmagan kun bajarilgan boʻlib qolmaydi', () => {
    const a = { ...act({ '2026-11-02': 10 }), ...act({ '2026-11-03': 12 }, [], 20), ...act({ '2026-11-04': 10 }) }
    expect(streakInfo(a, '2026-11-05', 10)).toMatchObject({ current: 2, forgiven: ['2026-11-03'] })
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
    expect(b['2026-11-04']).toEqual({ count: 0, goal: 10, forgiven: true })
    expect(applyForgiveness(b, '2026-11-05', G)).toBe(b)
    expect(applyForgiveness({}, '2026-11-05', G)).toEqual({})
  })

  it('hech narsa yoʻq — 0', () => {
    expect(streakInfo({}, '2026-11-05', G)).toEqual({ current: 0, record: 0, forgiven: [] })
  })
})

describe('faollikni saqlash va birlashtirish', () => {
  it('buzilgan qiymatlar tashlanadi; maqsadi yoʻq eski yozuv 10 deb oʻqiladi', () => {
    expect(
      sanitizeActivity({ '2026-11-05': { count: 3, forgiven: true }, '2026-11-06': { count: 4, goal: 20 }, '2026-11-07': { count: 4, goal: 0 }, '2026-13-01': { count: 1 }, x: { count: 1 }, '2026-11-04': { count: -1 }, '2026-11-03': { count: 1.5 } })
    ).toEqual({
      '2026-11-05': { count: 3, goal: 10, forgiven: true },
      '2026-11-06': { count: 4, goal: 20, forgiven: false },
      '2026-11-07': { count: 4, goal: 10, forgiven: false }
    })
    expect(sanitizeActivity(null)).toEqual({})
    expect(sanitizeActivity([1])).toEqual({})
  })

  it('kattaroq mashqlar soni yutadi (maqsadi ham oʻsha nusxadan), kechirim saqlanadi', () => {
    const m = mergeActivity(act({ '2026-11-04': 12, '2026-11-05': 3 }), act({ '2026-11-05': 8, '2026-11-03': 0 }, ['2026-11-03']))
    expect(m).toEqual(act({ '2026-11-03': 0, '2026-11-04': 12, '2026-11-05': 8 }, ['2026-11-03']))
    const g = mergeActivity(act({ '2026-11-05': 8 }, [], 15), act({ '2026-11-05': 5 }, [], 20))
    expect(g['2026-11-05']).toEqual({ count: 8, goal: 15, forgiven: false })
  })

  it('serverga faqat farq qilganlari yuboriladi (maqsad farqi ham)', () => {
    const server = act({ '2026-11-04': 12, '2026-11-05': 3, '2026-11-07': 2 })
    const merged = { ...act({ '2026-11-04': 12, '2026-11-05': 8, '2026-11-06': 1 }), ...act({ '2026-11-07': 2 }, [], 20) }
    expect(activityToPush(merged, server).map(([d]) => d)).toEqual(['2026-11-05', '2026-11-06', '2026-11-07'])
  })
})

describe('eski birlik (mashq 10/15/20) → yangi (dars/takrorlash 1/2/3)', () => {
  it('profildagi dailyGoal xaritasi: 10→1, 15→2, 20→3; yangilari va yoʻqligi oʻzgarmaydi; notoʻgʻri → 1', () => {
    expect([10, 15, 20].map(normalizeGoal)).toEqual([1, 2, 3])
    expect([1, 2, 3].map(normalizeGoal)).toEqual([1, 2, 3])
    expect([undefined, null].map(normalizeGoal)).toEqual([undefined, undefined])
    expect([0, 4, 12, 25, -1, 1.5, '10', '2', NaN, {}, true].map(normalizeGoal)).toEqual(Array(11).fill(1))
    // takror chaqirilsa natija oʻzgarmaydi (bir martalik oʻtkazish)
    expect([10, 15, 20].map((v) => normalizeGoal(normalizeGoal(v)))).toEqual([1, 2, 3])
  })

  it('bugungi eski yozuv: bajarilgan boʻlsa soni = yangi maqsad, aks holda 0; maqsad = yangi maqsad', () => {
    const done = act({ '2026-11-05': 12 }) // 12 >= 10
    expect(migrateTodayRow(done, '2026-11-05', 2)['2026-11-05']).toEqual({ count: 2, goal: 2, forgiven: false })
    const notDone = act({ '2026-11-05': 6 })
    expect(migrateTodayRow(notDone, '2026-11-05', 2)['2026-11-05']).toEqual({ count: 0, goal: 2, forgiven: false })
    const exact = act({ '2026-11-05': 15 }, [], 15)
    expect(migrateTodayRow(exact, '2026-11-05', 3)['2026-11-05']).toEqual({ count: 3, goal: 3, forgiven: false })
    expect(migrateTodayRow(act({ '2026-11-05': 19 }, [], 20), '2026-11-05', 3)['2026-11-05']).toMatchObject({ count: 0, goal: 3 })
  })

  it('yangi yozuv va boshqa kunlar tegilmaydi; takror chaqirilsa oʻzgarmaydi', () => {
    const fresh = act({ '2026-11-05': 1 }, [], 2)
    const a0 = act({ '2026-11-05': 12 })
    expect(migrateTodayRow(fresh, '2026-11-05', 2)).toBe(fresh)
    expect(migrateTodayRow({}, '2026-11-05', 1)).toEqual({})
    expect(migrateTodayRow(a0, '2026-11-05', 10)).toBe(a0) // yaroqsiz yangi maqsad — tegilmaydi
    const a = { ...act({ '2026-11-04': 12 }), ...act({ '2026-11-05': 12 }) }
    const m = migrateTodayRow(a, '2026-11-05', 1)
    expect(m['2026-11-04']).toBe(a['2026-11-04']) // oʻtgan kun — oʻz birligida
    expect(migrateTodayRow(m, '2026-11-05', 1)).toBe(m)
  })

  it('eski streak va rekord saqlanadi: oʻtgan kunlar oʻz maqsadi (10/15/20) bilan baholanadi, yangi kunlar 1/2/3 bilan', () => {
    // Rekord 5: 26–30 oktyabr (maqsad 10). 31-oktyabr kechirilgan. 2–4 noyabr: 10, 15, 20 maqsadli kunlar bajarilgan.
    const old = {
      ...act({ '2026-10-26': 10, '2026-10-27': 11, '2026-10-28': 12, '2026-10-29': 10, '2026-10-30': 10, '2026-10-31': 0 }, ['2026-10-31']),
      ...act({ '2026-11-02': 10 }, [], 10),
      ...act({ '2026-11-03': 15 }, [], 15),
      ...act({ '2026-11-04': 22 }, [], 20)
    }
    const before = streakInfo({ ...old, ...act({ '2026-11-05': 4 }) }, '2026-11-05', 10)
    expect(before).toEqual({ current: 3, record: 5, forgiven: ['2026-10-31'] })
    // 0.6.1: foydalanuvchi eski maqsad 10 → yangi 1; bugungi yozuv (4 < 10) → 0/1
    const migrated = migrateTodayRow({ ...old, ...act({ '2026-11-05': 4 }) }, '2026-11-05', normalizeGoal(10)!)
    expect(streakInfo(migrated, '2026-11-05', 1)).toEqual(before) // streak, rekord, kechirim — oʻzgarmadi
    expect(weekDays(migrated, '2026-11-05', 1).map((d) => d.done)).toEqual([true, true, true, false, false, false, false])
    // Bugun 1 ta dars tugatildi — maqsad 1 bajarildi, streak 4, rekord 5 saqlanadi
    const doneToday = addDone(migrated, '2026-11-05', 1)
    expect(streakInfo(doneToday, '2026-11-05', 1)).toEqual({ current: 4, record: 5, forgiven: ['2026-10-31'] })
    expect(applyForgiveness(doneToday, '2026-11-05', 1)).toBe(doneToday) // kechirim sarflanmaydi
  })

  it('bugungi eski yozuvga yangi dars qoʻshilsa avval oʻtkaziladi (birliklar aralashmaydi)', () => {
    const a = addDone(act({ '2026-11-05': 6 }), '2026-11-05', 2) // 6 < 10 → 0, +1
    expect(a['2026-11-05']).toEqual({ count: 1, goal: 2, forgiven: false })
    const b = addDone(act({ '2026-11-05': 12 }), '2026-11-05', 2) // bajarilgan → 2, +1
    expect(b['2026-11-05']).toEqual({ count: 3, goal: 2, forgiven: false })
  })

  it('maqsadi yoʻq eski yozuv (0.6.0 dan oldin) 10 deb oʻqiladi va oʻtgan kunda shu bilan baholanadi', () => {
    expect(LEGACY_GOAL).toBe(10)
    const raw = { '2026-11-03': { count: 10, forgiven: false }, '2026-11-04': { count: 9, forgiven: false } }
    const a = sanitizeActivity(raw)
    expect(a['2026-11-03'].goal).toBe(10)
    expect(streakInfo(a, '2026-11-05', 1)).toEqual({ current: 1, record: 1, forgiven: ['2026-11-04'] }) // 4-noyabr: 9 < 10 — bajarilmagan (kechirildi)
    expect(streakInfo({ ...a, '2026-11-04': { count: 10, goal: 10, forgiven: false } }, '2026-11-05', 1).current).toBe(2)
  })
})
