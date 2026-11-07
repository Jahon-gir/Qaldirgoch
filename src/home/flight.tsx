import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CountryId } from '../content/countries'
import { Swallow } from './Swallow'

/**
 * Bosh ekrandagi davlat kartasi bosilganda: qaldirgʻoch uchadi → karta silkinadi → bayroq tunneli → davlat sahifasi.
 * Toʻliq versiya qurilmada birinchi marta (~1.8 s), keyin qisqa (~0.4 s, faqat tunnel). reduced-motion — darhol oʻtadi.
 * Faqat Web Animations API (transform/opacity). Vaqtlar setTimeout bilan: animatsiya qoʻllanmasa ham oʻtish ishonchli.
 */
const SEEN_KEY = 'qaldirgoch.countryFlightSeen'

/** Tunnel ranglari va qadami (px): bayroq ranglari. */
export const TUNNEL: Record<CountryId, { colors: string[]; step: number }> = {
  de: { colors: ['#000', '#DD0000', '#FFCE00'], step: 18 },
  kr: { colors: ['#FFF', '#CD2E3A', '#FFF', '#0047A0', '#000'], step: 18 },
  jp: { colors: ['#FFF', '#BC002D'], step: 20 },
  gb: { colors: ['#012169', '#FFF', '#C8102E', '#FFF'], step: 18 }
}
export const tunnelGradient = ({ colors, step }: { colors: string[]; step: number }) =>
  `repeating-radial-gradient(circle, ${colors.map((c, i) => `${c} ${i * step}px ${(i + 1) * step}px`).join(', ')})`

export const FULL = { fly: 900, impact: 220, tunnel: 900, navAt: 900 + 780, flashFrom: 900 + 600, flash: 400 }
export const SHORT = { tunnel: 400, navAt: Math.round((400 * 780) / 900) }
const FLY_EASE = 'cubic-bezier(.5,0,.75,0)'
const TUNNEL_SIZE = 900

// Davlat sahifasi elementlari suzib chiqishi kerakmi (faqat animatsiyali oʻtishdan keyin)
let enterPending = false
export function consumeEnter() {
  const v = enterPending
  enterPending = false
  return v
}

function seen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}
function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* saqlanmasa — keyingi safar ham toʻliq */
  }
}
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const canAnimate = () => typeof document !== 'undefined' && typeof document.body.animate === 'function'

type Pt = { x: number; y: number }
type Flight = { key: number; country: CountryId; to: Pt; from: Pt; full: boolean; card: HTMLElement }
type Launch = (country: CountryId, card: HTMLElement) => void

const FlightContext = createContext<Launch | null>(null)

const center = (r: DOMRect): Pt => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

export function FlightProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  // navigate manzil oʻzgarganda yangilanadi: effekt qayta ishga tushmasligi uchun ref orqali
  const navRef = useRef(navigate)
  navRef.current = navigate
  const busy = useRef(false)
  const [flight, setFlight] = useState<Flight | null>(null)
  const birdRef = useRef<HTMLDivElement>(null)
  const birdInnerRef = useRef<HTMLDivElement>(null)
  const tunnelRef = useRef<HTMLDivElement>(null)
  const raysRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  const launch = useCallback<Launch>(
    (country, card) => {
      if (busy.current) return // bir vaqtda faqat bitta oʻtish
      const path = `/yol/${country}`
      if (reducedMotion() || !canAnimate()) {
        navigate(path)
        return
      }
      busy.current = true
      const full = !seen()
      if (full) markSeen()
      const to = center(card.getBoundingClientRect())
      const mapBird = document.querySelector('[data-swallow]')
      const from = mapBird ? center(mapBird.getBoundingClientRect()) : { x: window.innerWidth / 2, y: 120 }
      setFlight({ key: Date.now(), country, to, from, full, card })
    },
    [navigate]
  )

  useLayoutEffect(() => {
    if (!flight) return
    const { full, from, to, card, country } = flight
    const anims: (Animation | undefined)[] = []
    const run = (el: Element | null, k: Keyframe[], o: KeyframeAnimationOptions) => anims.push(el?.animate?.(k, o))
    const t0 = full ? FULL.fly : 0
    const tunnelDur = full ? FULL.tunnel : SHORT.tunnel
    const end = full ? FULL.flashFrom + FULL.flash : SHORT.tunnel

    if (full) {
      // a) uchish: tashqi qatlam — yoʻl, ichki — egilish va kattalashish
      run(birdRef.current, [{ transform: `translate(${from.x - 36}px, ${from.y - 36}px)` }, { transform: `translate(${to.x - 36}px, ${to.y - 36}px)` }], { duration: FULL.fly, easing: FLY_EASE, fill: 'forwards' })
      run(birdInnerRef.current, [
        { transform: 'perspective(400px) rotateX(40deg) rotateY(0deg) rotateZ(70deg) scale(.4)', opacity: 1 },
        { offset: 0.4, transform: 'perspective(400px) rotateX(25deg) rotateY(40deg) rotateZ(150deg) scale(1)' },
        { offset: 0.96, opacity: 1 },
        { transform: 'perspective(400px) rotateX(0deg) rotateY(0deg) rotateZ(190deg) scale(2.6)', opacity: 0 }
      ], { duration: FULL.fly, easing: FLY_EASE, fill: 'forwards' })
      // b) urilish
      run(card, [{ transform: 'scale(1)' }, { transform: 'scale(.9)' }, { transform: 'scale(1.04)' }], { duration: FULL.impact, delay: FULL.fly, easing: 'ease-out', fill: 'forwards' })
      // c) oxirida oq chaqnash
      run(flashRef.current, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: FULL.flash, delay: FULL.flashFrom, easing: 'ease-in-out', fill: 'both' })
    }
    // c) tunnel va teskari aylanadigan nurlar
    run(tunnelRef.current, [
      { transform: 'scale(0) rotate(0deg)', opacity: 1 },
      { offset: 0.85, opacity: 1 },
      { transform: 'scale(3.2) rotate(320deg)', opacity: 0 }
    ], { duration: tunnelDur, delay: t0, easing: 'ease-in', fill: 'both' })
    run(raysRef.current, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-640deg)' }], { duration: tunnelDur, delay: t0, easing: 'linear', fill: 'both' })

    const nav = window.setTimeout(() => {
      enterPending = true
      navRef.current(`/yol/${country}`)
    }, full ? FULL.navAt : SHORT.navAt)
    const done = window.setTimeout(() => {
      busy.current = false
      setFlight(null)
    }, end)
    return () => {
      window.clearTimeout(nav)
      window.clearTimeout(done)
      for (const a of anims) a?.cancel()
      busy.current = false
    }
  }, [flight])

  return (
    <FlightContext.Provider value={launch}>
      {children}
      {flight && (
        <div key={flight.key} aria-hidden="true" data-testid="flight" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          <div
            ref={tunnelRef}
            className="absolute overflow-hidden rounded-full"
            style={{ left: flight.to.x - TUNNEL_SIZE / 2, top: flight.to.y - TUNNEL_SIZE / 2, width: TUNNEL_SIZE, height: TUNNEL_SIZE, transform: 'scale(0)', background: tunnelGradient(TUNNEL[flight.country]) }}
          >
            <div
              ref={raysRef}
              className="absolute inset-0 rounded-full"
              style={{ background: 'repeating-conic-gradient(rgba(255,255,255,.55) 0deg 8deg, transparent 8deg 22deg)', mixBlendMode: 'overlay' }}
            />
          </div>
          {flight.full && (
            <>
              <div ref={birdRef} className="absolute left-0 top-0" style={{ transform: `translate(${flight.from.x - 36}px, ${flight.from.y - 36}px)`, filter: 'drop-shadow(0 14px 10px rgba(0,0,0,.35))' }}>
                <div ref={birdInnerRef} style={{ opacity: 0 }}>
                  <Swallow size={72} className="flap" />
                </div>
              </div>
              <div ref={flashRef} className="absolute inset-0 bg-white" style={{ opacity: 0 }} />
            </>
          )}
        </div>
      )}
    </FlightContext.Provider>
  )
}

/** Davlat kartasi uchun: provider boʻlmasa oddiy oʻtish. */
export function useCountryFlight(): Launch {
  const launch = useContext(FlightContext)
  const navigate = useNavigate()
  return launch ?? ((country) => navigate(`/yol/${country}`))
}

/** Davlat sahifasi: [data-enter] elementlari bittadan suzib chiqadi (+45 ms). */
export function useEnterAnimation(root: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!consumeEnter() || !root.current) return
    const els = root.current.querySelectorAll<HTMLElement>('[data-enter]')
    const anims = Array.from(els, (el, i) =>
      el.animate?.([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 320, delay: i * 45, easing: 'ease-out', fill: 'backwards' })
    )
    return () => anims.forEach((a) => a?.cancel())
  }, [root])
}
