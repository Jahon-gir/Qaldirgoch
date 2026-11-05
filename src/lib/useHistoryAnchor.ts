import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Ekran ilova ichidan emas, toʻgʻridan-toʻgʻri ochilgan boʻlsa (havola, qayta yuklash) tarixda undan oldin hech narsa yoʻq:
 * telefonning "orqaga" tugmasi ilovadan chiqarib yuboradi. Shunda tarixga ota ekran qoʻyiladi (parent → shu ekran),
 * "orqaga" ota ekranga qaytaradi.
 */
export function useHistoryAnchor(parent: string) {
  const loc = useLocation()
  const nav = useNavigate()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || loc.key !== 'default') return
    done.current = true
    const here = loc.pathname + loc.search
    nav(parent, { replace: true })
    nav(here)
  }, [loc.key, loc.pathname, loc.search, nav, parent])
}

/** "Orqaga": ilova ichida tarix boʻlsa — bir qadam orqaga, boʻlmasa ota ekranga (ilovadan chiqib ketmaydi). */
export function useBack(parent: string) {
  const loc = useLocation()
  const nav = useNavigate()
  return () => (loc.key === 'default' ? nav(parent, { replace: true }) : nav(-1))
}
