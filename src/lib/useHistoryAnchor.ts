import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Ekran ilova ichidan emas, toʻgʻridan-toʻgʻri ochilgan boʻlsa (havola, qayta yuklash) tarixda undan oldin hech narsa yoʻq:
 * telefonning "orqaga" tugmasi ilovadan chiqarib yuboradi. Shunda tarixga ota ekran qoʻyiladi (parent → shu ekran),
 * "orqaga" ota ekranga qaytaradi.
 */
export function useHistoryAnchor(parent: string, state?: unknown) {
  const loc = useLocation()
  const nav = useNavigate()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || loc.key !== 'default') return
    done.current = true
    const here = loc.pathname + loc.search
    nav(parent, { replace: true })
    nav(here, { state: state ?? loc.state })
  }, [loc.key, loc.pathname, loc.search, loc.state, nav, parent, state])
}

/** "Orqaga": ilova ichida tarix boʻlsa — bir qadam orqaga, boʻlmasa ota ekranga (ilovadan chiqib ketmaydi). */
export function useBack(parent: string) {
  const loc = useLocation()
  const nav = useNavigate()
  return () => (loc.key === 'default' ? nav(parent, { replace: true }) : nav(-1))
}

/** Darsga modul ekranidan kirilganda Link state'iga qoʻyiladi. */
export const FROM_MODULE = { fromModule: true } as const

/**
 * Darsdan modulga qaytish: modul ekranidan kirilgan boʻlsa — bir qadam orqaga (tarix ikkilanmaydi),
 * boshqa joydan (Til ekranidagi "Davom eting") kirilgan boʻlsa — dars oʻrniga modul ekrani qoʻyiladi.
 */
export function useBackToModule(modulePath: string) {
  const loc = useLocation()
  const nav = useNavigate()
  const fromModule = (loc.state as { fromModule?: boolean } | null)?.fromModule === true
  return () => (fromModule && loc.key !== 'default' ? nav(-1) : nav(modulePath, { replace: true }))
}
