import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { RESULT_IDS } from '../content/german'
import { supabase } from '../lib/supabase'
import { PROGRESS_KEYS, read, write } from '../progress/storage'
import { mergeResults, recordResult, resultsToPush, sanitizeResults, type Result, type Results } from './logic'
import { fetchRemoteResults, pushRemoteResults } from './remote'

type Ctx = {
  results: Results
  /** Dars yoki yakuniy test ("test:<scope>") tugadi: eng yuqori ball saqlanadi (mehmon — telefonda, kirgan — serverga ham). */
  record: (lessonId: string, score: number, total: number) => void
}
const LessonsContext = createContext<Ctx | null>(null)

/**
 * Natijalar har doim shu telefonda (localStorage). Kirgan boʻlsa user_lessons bilan birlashtiriladi (har dars boʻyicha yuqori ball, dialogsiz).
 * Oflayn navbat: serverga yetmagan natijalar mahalliy nusxadan hisoblanadi va internet qaytganda yuboriladi.
 */
export function LessonsProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const userId = auth.status === 'signedIn' ? auth.user!.id : null
  const [results, setResults] = useState<Results>(() => read(PROGRESS_KEYS.lessons, (s) => sanitizeResults(JSON.parse(s)), {}))
  const ref = useRef(results)
  ref.current = results
  const [retry, setRetry] = useState(0)
  const busy = useRef(false)

  const commit = useCallback((next: Results) => {
    ref.current = next
    setResults(next)
    write(PROGRESS_KEYS.lessons, JSON.stringify(next))
  }, [])

  useEffect(() => {
    if (!userId || !supabase) return
    const client = supabase
    let cancelled = false
    const run = async () => {
      if (busy.current || cancelled) return
      busy.current = true
      try {
        const server = await fetchRemoteResults(client, userId)
        if (cancelled) return
        const merged = mergeResults(ref.current, server)
        await pushRemoteResults(client, userId, resultsToPush(merged, server))
        if (cancelled) return
        // Sinxron paytida tugatilgan yangi dars yoʻqolmasin
        commit(mergeResults(ref.current, merged))
      } catch {
        // Tarmoq xatosi: mahalliy natijalar bilan ishlayveradi, internet qaytganda qayta uriniladi
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
  }, [userId, retry, commit])

  const record = useCallback(
    (lessonId: string, score: number, total: number) => {
      if (!RESULT_IDS.has(lessonId) || !Number.isInteger(score) || !Number.isInteger(total) || total <= 0 || score < 0 || score > total) return
      const incoming: Result = { lessonId, score, total, completedAt: new Date().toISOString() }
      const next = recordResult(ref.current, incoming)
      if (next !== ref.current) commit(next)
      if (userId) setRetry((n) => n + 1) // darhol yuborishga urinish (internet boʻlmasa xato yutiladi)
    },
    [userId, commit]
  )

  const value = useMemo<Ctx>(() => ({ results, record }), [results, record])
  return <LessonsContext.Provider value={value}>{children}</LessonsContext.Provider>
}

export function useLessons() {
  const c = useContext(LessonsContext)
  if (!c) throw new Error('useLessons LessonsProvider ichida ishlatilishi kerak')
  return c
}
