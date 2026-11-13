/**
 * Zaxira limit (jadval ishlamaganda): funksiya nusxasi xotirasida, kun (Toshkent) almashganda tozalanadi.
 * Nusxa qayta ishga tushsa nolga qaytadi — shuning uchun OpenAI kabinetidagi oylik limit ham kerak.
 */
const counts = new Map<string, number>()
let day = ''
let total = 0

const today = (now: Date) => new Date(now.getTime() + 5 * 3600_000).toISOString().slice(0, 10)

/** Qolgan savollar soni; limit tugagan boʻlsa -1. */
export function memoryTake(key: string, limit: number, totalLimit: number, now = new Date()): number {
  const d = today(now)
  if (d !== day) {
    day = d
    counts.clear()
    total = 0
  }
  const c = counts.get(key) ?? 0
  if (c >= limit || total >= totalLimit) return -1
  counts.set(key, c + 1)
  total++
  return limit - c - 1
}
