import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { AUSBILDUNG_STEPS } from '../content/ausbildung'
import { supabase } from '../lib/supabase'
import { useProfile } from '../profile/ProfileProvider'
import { applyPending, progressSummary, reconcile, sanitizeItems, stepStatuses, type Items, type PendingOps, type StepStatus } from './logic'
import { PROGRESS_KEYS, read, write } from './storage'
import { deleteRemoteProgress, fetchRemoteProgress, pushRemoteProgress } from './remote'

const loadPending = (uid: string): PendingOps =>
  read(PROGRESS_KEYS.pending, (s) => {
    const v = JSON.parse(s) as { uid?: string; ops?: PendingOps }
    return v.uid === uid && v.ops && typeof v.ops === 'object' ? v.ops : {}
  }, {})

type Ctx = {
  items: Items
  isDone: (id: string) => boolean
  toggle: (id: string) => void
  statuses: StepStatus[]
  summary: ReturnType<typeof progressSummary>
}
const ProgressContext = createContext<Ctx | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const { onboarded } = useProfile()
  const userId = auth.status === 'signedIn' ? auth.user!.id : null
  const [items, setItems] = useState<Items>(() => read(PROGRESS_KEYS.items, (s) => sanitizeItems(JSON.parse(s)), {}))
  const itemsRef = useRef(items)
  itemsRef.current = items
  const pendingRef = useRef<PendingOps>({})
  const [retry, setRetry] = useState(0)
  const busy = useRef(false)

  const commit = useCallback((next: Items) => {
    itemsRef.current = next
    setItems(next)
    write(PROGRESS_KEYS.items, JSON.stringify(next))
  }, [])

  const savePending = useCallback((uid: string) => {
    write(PROGRESS_KEYS.pending, Object.keys(pendingRef.current).length ? JSON.stringify({ uid, ops: pendingRef.current }) : null)
  }, [])

  // Kirganda va internet qaytganda: server bilan moslash + navbatdagi oʻzgarishlarni yuborish
  useEffect(() => {
    if (!userId || !supabase) return
    const client = supabase
    let cancelled = false
    pendingRef.current = loadPending(userId)

    const run = async () => {
      if (busy.current || cancelled) return
      busy.current = true
      try {
        const server = await fetchRemoteProgress(client, userId)
        if (cancelled) return
        const firstSync = read(PROGRESS_KEYS.synced, (s) => s !== userId, true)
        const snapshot = { ...pendingRef.current }
        const r = reconcile(itemsRef.current, server, snapshot, firstSync, new Date().toISOString())
        await pushRemoteProgress(client, userId, r.toPush)
        await deleteRemoteProgress(client, userId, r.toDelete)
        if (cancelled) return
        // Yuborilganlar navbatdan olinadi; sinxron paytida yangi bosilganlari qoladi va ustiga qoʻllanadi
        for (const [id, op] of Object.entries(snapshot)) if (pendingRef.current[id] === op) delete pendingRef.current[id]
        savePending(userId)
        write(PROGRESS_KEYS.synced, userId)
        commit(applyPending(r.items, pendingRef.current, itemsRef.current, new Date().toISOString()))
      } catch {
        // Tarmoq xatosi: mahalliy progress bilan ishlayveradi, internet qaytganda qayta uriniladi
      } finally {
        busy.current = false
      }
    }
    void run()
    const onOnline = () => void run()
    window.addEventListener('online', onOnline)
    return () => {
      cancelled = true
      busy.current = false
      window.removeEventListener('online', onOnline)
    }
  }, [userId, retry, commit, savePending])

  const toggle = useCallback(
    (id: string) => {
      const next = { ...itemsRef.current }
      const nowDone = !(id in next)
      if (nowDone) next[id] = new Date().toISOString()
      else delete next[id]
      commit(next)
      if (userId) {
        pendingRef.current[id] = nowDone ? 'set' : 'del'
        savePending(userId)
        setRetry((n) => n + 1) // darhol yuborishga urinish (internet boʻlmasa xato yutiladi)
      }
    },
    [userId, commit, savePending]
  )

  const statuses = useMemo(() => stepStatuses(AUSBILDUNG_STEPS, items, onboarded), [items, onboarded])
  const value = useMemo<Ctx>(
    () => ({ items, isDone: (id) => id in items, toggle, statuses, summary: progressSummary(statuses) }),
    [items, toggle, statuses]
  )
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const c = useContext(ProgressContext)
  if (!c) throw new Error('useProgress ProgressProvider ichida ishlatilishi kerak')
  return c
}
