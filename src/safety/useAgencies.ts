import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loadAgencies, readCache } from './registry.ts'
import type { Agency } from './search.ts'

export type AgenciesState = { status: 'loading' | 'ready' | 'error'; agencies: Agency[]; reload: () => void }

/** Reestr: kesh bo'lsa darhol (oflayn ham), bo'lmasa bir marta olinadi. Mehmon rejimida ham ishlaydi. */
export function useAgencies(): AgenciesState {
  // Kesh bo'lsa birinchi chizishdayoq tayyor (yuklanmoqda miltillamaydi, oflayn ham ishlaydi)
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; agencies: Agency[] }>(() => {
    const c = readCache()
    return c ? { status: 'ready', agencies: c.rows } : { status: 'loading', agencies: [] }
  })
  const [n, setN] = useState(0)
  useEffect(() => {
    let off = false
    setState((s) => (s.status === 'ready' ? s : { status: 'loading', agencies: [] }))
    loadAgencies(supabase, (rows) => !off && setState({ status: 'ready', agencies: rows })).then(
      ({ rows }) => !off && setState({ status: 'ready', agencies: rows }),
      () => !off && setState({ status: 'error', agencies: [] })
    )
    return () => {
      off = true
    }
  }, [n])
  const reload = useCallback(() => setN((x) => x + 1), [])
  return { ...state, reload }
}
