import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CountryId } from '../content/countries'
import { SWALLOW_PATH } from '../components/Logo'
import { Swallow } from './Swallow'
import { mapBirdPose } from './WorldMap'

/**
 * Bosh ekrandagi davlat kartasi bosilganda: xaritadagi oq qaldirgʻoch shu joyidan koʻtarilib (150 ms da haqiqiy
 * qaldirgʻochga aylanadi) kartaga uchadi → karta silkinadi → bayroq tunneli → davlat sahifasi.
 * Qaldirgʻoch har safar uchadi: qurilmada birinchi marta toʻliq (~1.8 s), keyin tez (550 + 400 ms ≈ 1 s). reduced-motion — darhol oʻtadi.
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
export const SHORT = { fly: 550, impact: 150, tunnel: 400, navAt: 550 + Math.round((400 * 780) / 900), end: 550 + 400 }
/** Oq qaldirgʻoch → haqiqiy qaldirgʻoch (cross-fade va koʻtarilish). */
export const MORPH = 150
/** Davlat sahifasiga bosh ekrandan kelinganini bildiradi: orqaga tugmasi navigate(-1) qiladi. */
export const FROM_HOME = { fromHome: true } as const
export const cameFromHome = (state: unknown) => !!state && typeof state === 'object' && (state as { fromHome?: unknown }).fromHome === true

const FLY_EASE = 'cubic-bezier(.3,0,.6,1)'
const TUNNEL_SIZE = 900
const BIRD = 72
const BIRD_FILTER = 'drop-shadow(0 0 6px rgba(255,255,255,.55)) drop-shadow(0 14px 10px rgba(0,0,0,.35))'

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
type Flight = { key: number; country: CountryId; to: Pt; from: Pt; unit: number; angle: number; full: boolean; card: HTMLElement }
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
  const liftRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<SVGSVGElement>(null)
  const realRef = useRef<HTMLDivElement>(null)
  const tunnelRef = useRef<HTMLDivElement>(null)
  const raysRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  const launch = useCallback<Launch>(
    (country, card) => {
      if (busy.current) return // bir vaqtda faqat bitta oʻtish
      const path = `/yol/${country}`
      if (reducedMotion() || !canAnimate()) {
        navigate(path, { state: FROM_HOME })
        return
      }
      busy.current = true
      const full = !seen()
      if (full) markSeen()
      const to = center(card.getBoundingClientRect())
      const p = mapBirdPose()
      const from = p ? { x: p.x, y: p.y } : { x: window.innerWidth / 2, y: 120 }
      setFlight({ key: Date.now(), country, to, from, unit: p?.unit ?? BIRD * 0.4, angle: p?.angle ?? 0, full, card })
    },
    [navigate]
  )

  useLayoutEffect(() => {
    if (!flight) return
    const { full, from, to, card, country, unit, angle } = flight
    const anims: (Animation | undefined)[] = []
    const run = (el: Element | null, k: Keyframe[], o: KeyframeAnimationOptions) => anims.push(el?.animate?.(k, o))
    const fly = full ? FULL.fly : SHORT.fly
    const t0 = fly
    const tunnelDur = full ? FULL.tunnel : SHORT.tunnel
    const end = full ? FULL.flashFrom + FULL.flash : SHORT.end

    // Xaritadagi qaldirgʻoch overlay'ga "koʻchadi": asli yashiriladi
    const mapBird = document.querySelector<SVGElement>('[data-swallow]')
    if (mapBird) mapBird.style.visibility = 'hidden'

    // Kartaga qarab yoʻnalish (qaldirgʻoch shakli yuqoriga qaragan); burilish eng qisqa tomonga
    const raw = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + 90
    const head = raw + 360 * Math.round((angle - raw) / 360)
    const rot = (x: number, y: number, z: number, s: number) => `perspective(400px) rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z.toFixed(1)}deg) scale(${s})`
    const m = MORPH / fly

    // a) uchish: tashqi qatlam — yoʻl, ichki — egilish va kattalashish (.9 → 2.6)
    run(birdRef.current, [{ transform: `translate(${from.x - BIRD / 2}px, ${from.y - BIRD / 2}px)` }, { transform: `translate(${to.x - BIRD / 2}px, ${to.y - BIRD / 2}px)` }], { duration: fly, easing: FLY_EASE, fill: 'forwards' })
    run(birdInnerRef.current, [
      { transform: rot(0, 0, angle, 0.9), opacity: 1 },
      { offset: m, transform: rot(20, 15, angle + (head - angle) * 0.4, 0.95) },
      { offset: 0.5, transform: rot(25, 35, head, 1.5) },
      { offset: 0.94, opacity: 1 },
      { transform: rot(0, 0, head, 2.6), opacity: 0 }
    ], { duration: fly, easing: FLY_EASE, fill: 'forwards' })
    // xaritadagi oʻlchamdan koʻtarilish va oq → haqiqiy qaldirgʻoch (150 ms)
    run(liftRef.current, [{ transform: `scale(${(unit / BIRD / 0.9).toFixed(3)})` }, { transform: 'scale(1)' }], { duration: MORPH, easing: 'ease-out', fill: 'both' })
    run(ghostRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: MORPH, easing: 'linear', fill: 'both' })
    run(realRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: MORPH, easing: 'linear', fill: 'both' })
    // b) urilish
    run(card, [{ transform: 'scale(1)' }, { transform: 'scale(.9)' }, { transform: 'scale(1.04)' }], { duration: full ? FULL.impact : SHORT.impact, delay: fly, easing: 'ease-out', fill: 'forwards' })
    // oxirida oq chaqnash (faqat toʻliq versiyada)
    if (full) run(flashRef.current, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: FULL.flash, delay: FULL.flashFrom, easing: 'ease-in-out', fill: 'both' })
    // c) tunnel va teskari aylanadigan nurlar
    run(tunnelRef.current, [
      { transform: 'scale(0) rotate(0deg)', opacity: 1 },
      { offset: 0.85, opacity: 1 },
      { transform: 'scale(3.2) rotate(320deg)', opacity: 0 }
    ], { duration: tunnelDur, delay: t0, easing: 'ease-in', fill: 'both' })
    run(raysRef.current, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-640deg)' }], { duration: tunnelDur, delay: t0, easing: 'linear', fill: 'both' })

    const nav = window.setTimeout(() => {
      enterPending = true
      navRef.current(`/yol/${country}`, { state: FROM_HOME })
    }, full ? FULL.navAt : SHORT.navAt)
    const done = window.setTimeout(() => {
      busy.current = false
      setFlight(null)
    }, end)
    return () => {
      window.clearTimeout(nav)
      window.clearTimeout(done)
      for (const a of anims) a?.cancel()
      if (mapBird) mapBird.style.visibility = ''
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
          <div ref={birdRef} className="absolute left-0 top-0" style={{ transform: `translate(${flight.from.x - BIRD / 2}px, ${flight.from.y - BIRD / 2}px)`, filter: BIRD_FILTER }}>
            <div ref={birdInnerRef} style={{ width: BIRD, height: BIRD, opacity: 0 }}>
              <div ref={liftRef} className="relative h-full w-full">
                {/* Xaritadagi oq qaldirgʻoch nusxasi: markazi (50,58) quti markazida */}
                <svg ref={ghostRef} viewBox="0 8 100 100" width={BIRD} height={BIRD} className="absolute inset-0" data-testid="flight-ghost">
                  <path d={SWALLOW_PATH} fill="#FFFFFF" />
                </svg>
                <div ref={realRef} className="absolute inset-0" style={{ opacity: 0 }}>
                  <Swallow size={BIRD} className="flap" />
                </div>
              </div>
            </div>
          </div>
          {flight.full && <div ref={flashRef} className="absolute inset-0 bg-white" style={{ opacity: 0 }} />}
        </div>
      )}
    </FlightContext.Provider>
  )
}

/** Davlat kartasi uchun: provider boʻlmasa oddiy oʻtish. */
export function useCountryFlight(): Launch {
  const launch = useContext(FlightContext)
  const navigate = useNavigate()
  return launch ?? ((country) => navigate(`/yol/${country}`, { state: FROM_HOME }))
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
