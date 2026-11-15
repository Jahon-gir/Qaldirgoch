import { ALL_RESULT_IDS } from '../lang/ids'

export type Result = { lessonId: string; score: number; total: number; completedAt: string }
export type Results = Record<string, Result>

/* ---------- Natijalarni saqlash va birlashtirish ---------- */

/** Tashqaridan (localStorage/server) kelgan qiymatni tozalaydi: maʼlum dars yoki test (reyestrdagi barcha kurslar), butun ball, yaroqli sana. */
export function sanitizeResults(raw: unknown, known: ReadonlySet<string> = ALL_RESULT_IDS): Results {
  const out: Results = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!known.has(id) || !v || typeof v !== 'object') continue
    const r = v as Record<string, unknown>
    const { score, total, completedAt } = r
    if (Number.isInteger(score) && Number.isInteger(total) && (score as number) >= 0 && (total as number) > 0 && (score as number) <= (total as number) && typeof completedAt === 'string' && !Number.isNaN(Date.parse(completedAt))) {
      out[id] = { lessonId: id, score: score as number, total: total as number, completedAt }
    }
  }
  return out
}

/** Ikki natijadan yuqorisi (ulush boʻyicha). Teng boʻlsa — avval tugatilgani. */
export function pickBetter(a: Result, b: Result): Result {
  const diff = a.score * b.total - b.score * a.total // a/total_a - b/total_b ishorasi
  if (diff > 0) return a
  if (diff < 0) return b
  return Date.parse(a.completedAt) <= Date.parse(b.completedAt) ? a : b
}

/** Dars topshirildi: mavjud natija bilan solishtirib eng yuqorisi qoladi. */
export function recordResult(results: Results, incoming: Result): Results {
  const cur = results[incoming.lessonId]
  const best = cur ? pickBetter(cur, incoming) : incoming
  return best === cur ? results : { ...results, [incoming.lessonId]: best }
}

/** Mehmon va akkaunt natijalari: har dars boʻyicha yuqori ball, dialogsiz. */
export function mergeResults(a: Results, b: Results): Results {
  let out = a
  for (const r of Object.values(b)) out = recordResult(out, r)
  return out
}

const same = (a: Result | undefined, b: Result) => !!a && a.score === b.score && a.total === b.total && a.completedAt === b.completedAt

/** Serverga yuboriladiganlar (oflayn navbat): birlashtirilgan natijalardan serverda yoʻq yoki boshqacha boʻlganlari. */
export function resultsToPush(merged: Results, server: Results): Result[] {
  return Object.values(merged).filter((r) => !same(server[r.lessonId], r))
}
