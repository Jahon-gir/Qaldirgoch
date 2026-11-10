import { useEffect, useRef, useState } from 'react'
import { SWALLOW_PATH } from '../components/Logo'
import { CITIES, LAND_DOTS, MAP_H, MAP_W, TASHKENT, UZ_PATH } from './worldMap'

/**
 * Bosh ekran xaritasi: Toshkentdan shaharlarga egri chiziqlar, Germaniya chizigʻi boʻylab qaldirgʻoch uchadi
 * va chiziq oxiri yonida qoladi (davlat kartasi bosilganda uchish shu joydan boshlanadi).
 * Animatsiya sessiyada bir marta; faqat stroke-dashoffset, transform va opacity (requestAnimationFrame, DOM toʻgʻridan-toʻgʻri).
 * Ekran yashirin yoki xarita koʻrinmasa — toʻxtaydi. prefers-reduced-motion — darhol yakuniy holat.
 */
type Pt = readonly [number, number]
type Curve = { id: string; from: Pt; ctrl: Pt; to: Pt; d: string }

const r1 = (n: number) => Math.round(n * 10) / 10

function curveTo(id: string, to: Pt): Curve {
  const [x0, y0] = TASHKENT
  const [x1, y1] = to
  const dist = Math.hypot(x1 - x0, y1 - y0)
  const ctrl: Pt = [r1((x0 + x1) / 2), r1((y0 + y1) / 2 - dist * 0.35)]
  return { id, from: TASHKENT, ctrl, to, d: `M${x0} ${y0}Q${ctrl[0]} ${ctrl[1]} ${x1} ${y1}` }
}

// Germaniya birinchi va eng ustida chiziladi
const DE = curveTo('de', CITIES.find((c) => c.id === 'de')!.p)
const OTHERS = CITIES.filter((c) => c.id !== 'de').map((c) => curveTo(c.id, c.p))

const TOTAL = 3200
const DE_DUR = 1800
const LINE_DUR = 700
const OTHERS_START = 200
const BIRD_SCALE = 0.28
/** Qaldirgʻoch chiziq oxirigacha bormaydi: nuqta yonida toʻxtab, xaritada qoladi. */
const BIRD_END = 0.93

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2) // ease-in-out
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)
const otherStart = (i: number) => OTHERS_START + (i * (TOTAL - LINE_DUR - OTHERS_START)) / Math.max(1, OTHERS.length - 1)

/** Kvadratik Bezye: nuqta va yoʻnalish burchagi (gradus). */
function onCurve(c: Curve, t: number) {
  const u = 1 - t
  const x = u * u * c.from[0] + 2 * u * t * c.ctrl[0] + t * t * c.to[0]
  const y = u * u * c.from[1] + 2 * u * t * c.ctrl[1] + t * t * c.to[1]
  const dx = 2 * u * (c.ctrl[0] - c.from[0]) + 2 * t * (c.to[0] - c.ctrl[0])
  const dy = 2 * u * (c.ctrl[1] - c.from[1]) + 2 * t * (c.to[1] - c.ctrl[1])
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI + 90 } // qaldirgʻoch shakli yuqoriga qaragan
}
// Qaldirgʻochning joriy holati (viewBox koordinatasi): uchish shu joydan boshlanadi
let pose = onCurve(DE, BIRD_END)
const birdTransform = (c: Curve, t: number) => {
  const p = onCurve(c, t * BIRD_END)
  pose = p
  return `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.angle.toFixed(1)}) scale(${BIRD_SCALE}) translate(-50 -58)`
}

/** Xaritadagi oq qaldirgʻoch ekranda: markaz (SWALLOW_PATH dagi 50,58 nuqta), 100 birlik necha px, burilish (gradus). */
export function mapBirdPose(): { x: number; y: number; unit: number; angle: number } | null {
  const bird = document.querySelector<SVGPathElement>('[data-swallow]')
  const svg = bird?.ownerSVGElement
  if (!bird || !svg) return null
  const r = svg.getBoundingClientRect()
  if (!r.width) return null
  const k = r.width / MAP_W
  return { x: r.left + pose.x * k, y: r.top + pose.y * k, unit: 100 * BIRD_SCALE * k, angle: pose.angle }
}

const PLAYED_KEY = 'qaldirgoch.mapPlayed'
let playedInMemory = false
function alreadyPlayed() {
  if (playedInMemory) return true
  try {
    return sessionStorage.getItem(PLAYED_KEY) === '1'
  } catch {
    return false
  }
}
function markPlayed() {
  playedInMemory = true
  try {
    sessionStorage.setItem(PLAYED_KEY, '1')
  } catch {
    /* xotirada belgilangani yetarli */
  }
}
function shouldAnimate() {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  return !alreadyPlayed()
}

export function WorldMap({ label }: { label: string }) {
  const [animate, setAnimate] = useState(shouldAnimate)
  const svgRef = useRef<SVGSVGElement>(null)
  const deRef = useRef<SVGPathElement>(null)
  const deDotRef = useRef<SVGCircleElement>(null)
  const birdRef = useRef<SVGPathElement>(null)
  const lineRefs = useRef<(SVGPathElement | null)[]>([])
  const dotRefs = useRef<(SVGCircleElement | null)[]>([])

  useEffect(() => {
    if (!animate) return
    markPlayed()
    let elapsed = 0
    let last: number | null = null
    let raf = 0
    let inView = true

    const draw = (ms: number) => {
      const de = clamp01(ms / DE_DUR)
      deRef.current?.style.setProperty('stroke-dashoffset', String(1 - ease(de)))
      if (deDotRef.current) deDotRef.current.style.opacity = de >= 1 ? '1' : '0'
      const bird = birdRef.current
      if (bird) {
        bird.setAttribute('transform', birdTransform(DE, ease(de)))
        bird.style.opacity = String(clamp01(ms / 150))
      }
      OTHERS.forEach((_, i) => {
        const t = clamp01((ms - otherStart(i)) / LINE_DUR)
        lineRefs.current[i]?.style.setProperty('stroke-dashoffset', String(1 - ease(t)))
        const dot = dotRefs.current[i]
        if (dot) dot.style.opacity = t >= 1 ? '1' : '0'
      })
    }
    const frame = (now: number) => {
      if (last !== null) elapsed += Math.min(now - last, 100) // uzoq toʻxtalishdan keyin sakramasin
      last = now
      draw(elapsed)
      if (elapsed >= Math.max(TOTAL, DE_DUR)) {
        raf = 0
        setAnimate(false) // yakuniy holat React orqali
        return
      }
      raf = requestAnimationFrame(frame)
    }
    const running = () => !document.hidden && inView
    const sync = () => {
      if (running() && !raf) {
        last = null
        raf = requestAnimationFrame(frame)
      } else if (!running() && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    document.addEventListener('visibilitychange', sync)
    let io: IntersectionObserver | undefined
    if (typeof IntersectionObserver === 'function' && svgRef.current) {
      io = new IntersectionObserver(([e]) => {
        inView = e.isIntersecting
        sync()
      })
      io.observe(svgRef.current)
    }
    draw(0)
    sync()
    return () => {
      if (raf) cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', sync)
      io?.disconnect()
    }
  }, [animate])

  // Boshlangʻich (animatsiya) yoki yakuniy holat; animatsiya paytida rAF DOMni oʻzi yangilaydi
  const line = { strokeDasharray: 1, strokeDashoffset: animate ? 1 : 0 }
  const endDot = { opacity: animate ? 0 : 1 }
  const [tx, ty] = TASHKENT

  return (
    <svg ref={svgRef} viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block h-auto w-full" aria-hidden="true" focusable="false" data-testid="world-map">
      <path d={LAND_DOTS} stroke="#3B4660" strokeWidth={2.1} strokeLinecap="round" fill="none" />
      <g fill="none">
        {OTHERS.map((c, i) => (
          <path key={c.id} ref={(el) => void (lineRefs.current[i] = el)} d={c.d} pathLength={1} stroke="#4A5570" strokeWidth={0.9} style={line} />
        ))}
      </g>
      {OTHERS.map((c, i) => (
        <circle key={c.id} ref={(el) => void (dotRefs.current[i] = el)} cx={c.to[0]} cy={c.to[1]} r={0.9} fill="#4A5570" style={endDot} />
      ))}
      <path d={UZ_PATH} fill="#FF7A50" stroke="#FFC56B" strokeWidth={0.8} strokeLinejoin="round" />
      <path ref={deRef} d={DE.d} pathLength={1} stroke="#FF7A50" strokeWidth={2} strokeLinecap="round" fill="none" style={line} />
      <circle ref={deDotRef} cx={DE.to[0]} cy={DE.to[1]} r={1.75} fill="#FF7A50" style={endDot} />
      <circle cx={tx} cy={ty} r={4} fill="none" stroke="#FFC56B" strokeWidth={1} vectorEffect="non-scaling-stroke" className="map-wave" />
      <text x={169} y={62} textAnchor="middle" fontSize={10} fontWeight={600} fill="#FFC56B">
        {label}
      </text>
      <path ref={birdRef} data-swallow="" d={SWALLOW_PATH} fill="#FFFFFF" transform={birdTransform(DE, animate ? 0 : 1)} style={{ opacity: animate ? 0 : 1 }} />
    </svg>
  )
}
