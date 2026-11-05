import { addDays, daysBetween, isDay, type Day } from './srs'

/* ---------- Kunlik maqsad ---------- */

export const GOALS = [10, 15, 20] as const
export type DailyGoal = (typeof GOALS)[number]
export const DEFAULT_GOAL: DailyGoal = 10
export const isGoal = (v: unknown): v is DailyGoal => typeof v === 'number' && (GOALS as readonly number[]).includes(v)

/** Bir kun: bajarilgan mashqlar soni, oʻsha kungi maqsad va shu kun "kechirim" bilan oʻtkazilganmi. */
export type DayActivity = { count: number; goal: number; forgiven: boolean }
export type Activity = Record<Day, DayActivity>

/** Mashq bajarildi (dars mashqi yoki takrorlash javobi). Kunga oʻsha paytdagi maqsad yoziladi. */
export function addExercises(act: Activity, today: Day, n: number, goal: number): Activity {
  if (!Number.isInteger(n) || n <= 0) return act
  const cur = act[today] ?? { count: 0, goal, forgiven: false }
  return { ...act, [today]: { ...cur, count: cur.count + n, goal } }
}

/** Maqsad oʻzgardi: faqat bugungi kun yangilanadi (oʻtgan kunlar oʻz maqsadi bilan qoladi). */
export function setTodayGoal(act: Activity, today: Day, goal: number): Activity {
  const cur = act[today]
  if (!cur || cur.goal === goal) return act
  return { ...act, [today]: { ...cur, goal } }
}

export function todayProgress(act: Activity, today: Day, goal: number) {
  const count = act[today]?.count ?? 0
  return { count, goal, left: Math.max(0, goal - count), met: count >= goal, percent: Math.min(100, Math.round((count / goal) * 100)) }
}

/** Kun bajarilganmi: bugun — joriy maqsad bilan, oʻtgan kun — oʻsha kungi maqsad bilan. */
function met(act: Activity, d: Day, today: Day, goal: number) {
  const row = act[d]
  if (!row) return false
  return row.count >= (d === today ? goal : row.goal)
}

/** ISO hafta: dushanbadan boshlanadi. Hafta kaliti — shu haftaning dushanbasi. */
export function isoWeekStart(day: Day): Day {
  const [y, m, d] = day.split('-').map(Number)
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7 // 0 — dushanba
  return addDays(day, -dow)
}

/**
 * Ketma-ket kunlar. Maqsad bajarilgan kun +1. Oʻtkazilgan kun: shu ISO haftada kechirim ishlatilmagan boʻlsa —
 * kechiriladi (streak uzilmaydi, lekin oshmaydi ham), aks holda 0. Bugun hali tugamagan — uzmaydi.
 * forgiven — kechirim bilan oʻtgan kunlar (saqlash uchun). record — eng uzun streak.
 */
export function streakInfo(act: Activity, today: Day, goal: number) {
  const days = Object.keys(act).filter((d) => d < today).sort()
  let current = 0
  let record = 0
  const forgiven: Day[] = []
  const usedWeeks = new Set<Day>()
  if (days.length) {
    const span = daysBetween(days[0], today)
    for (let i = 0; i < span; i++) {
      const d = addDays(days[0], i)
      if (met(act, d, today, goal)) {
        current++
        record = Math.max(record, current)
        continue
      }
      const week = isoWeekStart(d)
      if (act[d]?.forgiven || (current > 0 && !usedWeeks.has(week))) {
        usedWeeks.add(week)
        forgiven.push(d)
      } else {
        current = 0
      }
    }
  }
  if (met(act, today, today, goal)) {
    current++
    record = Math.max(record, current)
  }
  return { current, record, forgiven }
}

/** Kechirim ishlatilgan kunlar faollikka yoziladi (`kechirim` = true), boshqa qurilmada ham bir xil hisoblansin. */
export function applyForgiveness(act: Activity, today: Day, goal: number): Activity {
  let out = act
  for (const d of streakInfo(act, today, goal).forgiven) {
    if (act[d]?.forgiven) continue
    if (out === act) out = { ...act }
    out[d] = { count: act[d]?.count ?? 0, goal: act[d]?.goal ?? goal, forgiven: true }
  }
  return out
}

/** Joriy haftaning 7 kuni (dushanba–yakshanba): maqsad bajarilganmi, bugunmi, kelajakdami. */
export function weekDays(act: Activity, today: Day, goal: number) {
  const start = isoWeekStart(today)
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i)
    return { day, index: i, done: met(act, day, today, goal), isToday: day === today, future: day > today }
  })
}

/* ---------- Saqlash va birlashtirish ---------- */

export function sanitizeActivity(raw: unknown): Activity {
  const out: Activity = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [d, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!isDay(d) || !v || typeof v !== 'object') continue
    const { count, goal, forgiven } = v as Record<string, unknown>
    if (!Number.isInteger(count) || (count as number) < 0 || (count as number) > 100000) continue
    // Maqsadi yoʻq eski yozuvlar (0.6.0 gacha) — standart 10
    const g = Number.isInteger(goal) && (goal as number) >= 1 && (goal as number) <= 1000 ? (goal as number) : DEFAULT_GOAL
    out[d] = { count: count as number, goal: g, forgiven: forgiven === true }
  }
  return out
}

/** Har kun boʻyicha: kattaroq mashqlar soni yutadi (maqsadi ham shu nusxadan, teng boʻlsa kattarogʻi); kechirim — biror nusxada boʻlsa. */
export function mergeActivity(a: Activity, b: Activity): Activity {
  const out: Activity = { ...a }
  for (const [d, v] of Object.entries(b)) {
    const cur = out[d]
    if (!cur) {
      out[d] = v
      continue
    }
    const goal = cur.count === v.count ? Math.max(cur.goal, v.goal) : cur.count > v.count ? cur.goal : v.goal
    out[d] = { count: Math.max(cur.count, v.count), goal, forgiven: cur.forgiven || v.forgiven }
  }
  return out
}

export function activityToPush(merged: Activity, server: Activity): [Day, DayActivity][] {
  return Object.entries(merged).filter(([d, v]) => !server[d] || server[d].count !== v.count || server[d].goal !== v.goal || server[d].forgiven !== v.forgiven)
}
