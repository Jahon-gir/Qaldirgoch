import { ALL_ITEM_IDS, AUTO_DONE_STEPS, type Step } from '../content/ausbildung'

/** Belgilangan elementlar: element id → belgilangan vaqt (ISO). Faqat belgilanganlar saqlanadi. */
export type Items = Record<string, string>
export type StepStatus = 'done' | 'current' | 'next'
export type PendingOps = Record<string, 'set' | 'del'>

/** Tashqaridan (localStorage/server) kelgan qiymatni tozalaydi: faqat maʼlum id va yaroqli sana qoladi. */
export function sanitizeItems(raw: unknown, known: ReadonlySet<string> = ALL_ITEM_IDS): Items {
  const out: Items = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [id, at] of Object.entries(raw as Record<string, unknown>)) {
    if (known.has(id) && typeof at === 'string' && !Number.isNaN(Date.parse(at))) out[id] = at
  }
  return out
}

/** Onboarding tugagach avtomatik bajarilgan bosqich (1 va 2). */
export const isAutoDone = (step: Step, onboarded: boolean, auto: readonly string[] = AUTO_DONE_STEPS) => onboarded && auto.includes(step.id)

/** Bosqich bajarilgan: avtomatik (onboarding tugagan boʻlsa) yoki barcha vazifalari belgilangan. */
export function isStepDone(step: Step, items: Items, onboarded: boolean, auto: readonly string[] = AUTO_DONE_STEPS): boolean {
  if (isAutoDone(step, onboarded, auto)) return true
  return step.tasks.length > 0 && step.tasks.every((t) => t.id in items)
}

/** Holat hosila: bajarilganlar done; birinchi tugallanmagani current; qolgani next. */
export function stepStatuses(steps: Step[], items: Items, onboarded: boolean, auto: readonly string[] = AUTO_DONE_STEPS): StepStatus[] {
  const done = steps.map((s) => isStepDone(s, items, onboarded, auto))
  const cur = done.indexOf(false)
  return done.map((d, i) => (d ? 'done' : i === cur ? 'current' : 'next'))
}

export function progressSummary(statuses: StepStatus[]) {
  const done = statuses.filter((s) => s === 'done').length
  return { done, total: statuses.length, percent: statuses.length ? Math.round((done / statuses.length) * 100) : 0, currentIndex: statuses.indexOf('current') }
}

/** Ikki tomonning belgilanganlari birlashtiriladi (ustiga qoʻyiladi); ikkala tomonda boʻlsa — eng erta sana. */
export function mergeItems(a: Items, b: Items): Items {
  const out: Items = { ...a }
  for (const [id, at] of Object.entries(b)) {
    if (!(id in out) || Date.parse(at) < Date.parse(out[id])) out[id] = at
  }
  return out
}

/** Kutilayotgan oʻzgarishlarni (belgilash/olib tashlash) asos ustiga qoʻllaydi. */
export function applyPending(base: Items, pending: PendingOps, local: Items, now: string): Items {
  const out = { ...base }
  for (const [id, op] of Object.entries(pending)) {
    if (op === 'set') out[id] = local[id] ?? out[id] ?? now
    else delete out[id]
  }
  return out
}

export type Reconciled = { items: Items; toPush: Items; toDelete: string[] }

/**
 * Mahalliy va server progressini moslaydi.
 * - Birinchi marta (mehmon → akkaunt): ikkala tomon birlashtiriladi, serverda yoʻqlari yuboriladi.
 * - Keyin: server asos, internetsiz qilingan oʻzgarishlar (pending) ustiga qoʻllanadi.
 */
export function reconcile(local: Items, server: Items, pending: PendingOps, firstSync: boolean, now: string): Reconciled {
  if (firstSync) {
    const items = mergeItems(local, server)
    const toPush: Items = {}
    for (const [id, at] of Object.entries(items)) if (!(id in server)) toPush[id] = at
    return { items, toPush, toDelete: [] }
  }
  const items = applyPending(server, pending, local, now)
  const toPush: Items = {}
  const toDelete: string[] = []
  for (const [id, op] of Object.entries(pending)) {
    if (op === 'set' && !(id in server) && id in items) toPush[id] = items[id]
    if (op === 'del' && id in server) toDelete.push(id)
  }
  return { items, toPush, toDelete }
}

/** Foydalanuvchi yoʻlni boshlaganmi: 1 va 2-bosqichdan (avtomatik) boshqa bosqichda belgilangan element bor. */
export function hasStarted(items: Items, auto: readonly string[] = AUTO_DONE_STEPS): boolean {
  return Object.keys(items).some((id) => !auto.includes(id.split('.')[0]))
}
