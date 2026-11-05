/**
 * Toʻgʻri / xato javob effekti: ovoz (Web Audio, fayl yoʻq), titrash, zarralar.
 * Hammasi kodda — oflayn ishlaydi. AudioContext birinchi kerak boʻlganda (bosishda) yaratiladi va qayta ishlatiladi.
 * Ovoz oʻchirilgan boʻlsa ovoz ham, titrash ham yoʻq (AudioContext umuman yaratilmaydi); vizual effekt qoladi.
 * CSS qismi (.fx-pop, .fx-shake) index.css da.
 */

let ctx: AudioContext | null = null

/** Faqat testlar uchun: yaratilgan kontekstni unutadi. */
export function resetFeedbackAudio() {
  ctx = null
}

function audio(): AudioContext | null {
  if (ctx) return ctx
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    ctx = new Ctor()
  } catch {
    return null
  }
  return ctx
}

/** Ovoz brauzer siyosati bilan "toʻxtatilgan" boʻlsa bosish ichida davom ettiriladi. */
function ready(): AudioContext | null {
  const c = audio()
  if (!c) return null
  try {
    if (c.state === 'suspended') void Promise.resolve(c.resume()).catch(() => undefined)
  } catch {
    /* davom ettirib boʻlmasa ham ilova ishlayveradi */
  }
  return c
}

/** Bitta nota: tez ochilib, oxirigacha silliq soʻnadi (chiqillamasligi uchun). */
function tone(c: AudioContext, type: OscillatorType, from: number, to: number, start: number, dur: number, peak: number) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, start)
  if (to !== from) osc.frequency.linearRampToValueAtTime(to, start + dur)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(peak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

/** G5 → C6 → E6: sine, 0,18 / 0,18 / 0,25 s, notalar boshi 0,11 s oraliqda, balandlik 0,18. */
export const RIGHT_NOTES = [
  { freq: 784, dur: 0.18 },
  { freq: 1047, dur: 0.18 },
  { freq: 1319, dur: 0.25 }
] as const
export const RIGHT_GAP = 0.11

export function playRightSound() {
  const c = ready()
  if (!c) return
  try {
    const t0 = c.currentTime
    RIGHT_NOTES.forEach((n, i) => tone(c, 'sine', n.freq, n.freq, t0 + i * RIGHT_GAP, n.dur, 0.18))
  } catch {
    /* ovoz chiqmasa ham mashq davom etadi */
  }
}

/** Qisqa "bzz": square, 180 → 140 Hz, 0,22 s, past balandlik (0,06) — square baland eshitiladi. */
export function playWrongSound() {
  const c = ready()
  if (!c) return
  try {
    tone(c, 'square', 180, 140, c.currentTime, 0.22, 0.06)
  } catch {
    /* ovoz chiqmasa ham mashq davom etadi */
  }
}

export const reducedMotion = (): boolean => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const COLORS = ['#1D9E75', '#EF9F27', '#378ADD', '#C24E27']
export const PARTICLES = 20
export const BURST_MS = 700

/** ~20 ta kichik zarra (kvadrat va doira) elementdan har tomonga sachrab 0,7 s da yoʻqoladi. Faqat transform/opacity. */
export function burst(el: Element | null | undefined) {
  if (!el || typeof document === 'undefined' || reducedMotion() || typeof Element.prototype.animate !== 'function') return
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const root = document.createElement('div')
  root.setAttribute('aria-hidden', 'true')
  root.setAttribute('data-fx-burst', '')
  root.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:60'
  for (let i = 0; i < PARTICLES; i++) {
    const p = document.createElement('span')
    const size = 5 + Math.random() * 6
    p.style.cssText = `position:absolute;left:${cx + (Math.random() - 0.5) * r.width * 0.8}px;top:${cy + (Math.random() - 0.5) * r.height * 0.6}px;width:${size}px;height:${size}px;background:${COLORS[i % COLORS.length]};border-radius:${i % 2 ? '50%' : '2px'}`
    const ang = (i / PARTICLES) * Math.PI * 2 + Math.random() * 0.5
    const dist = 50 + Math.random() * 70
    p.animate(
      [
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) rotate(${(Math.random() - 0.5) * 540}deg) scale(0.4)`, opacity: 0 }
      ],
      { duration: BURST_MS, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }
    )
    root.appendChild(p)
  }
  document.body.appendChild(root)
  window.setTimeout(() => root.remove(), BURST_MS + 80)
}

/** Toʻgʻri javob: zarralar (+ ovoz va Androidda titrash — faqat ovoz yoqilgan boʻlsa). Pop — CSS (.fx-pop). */
export function rightFeedback(el: Element | null | undefined, sound: boolean) {
  burst(el)
  if (!sound) return
  playRightSound()
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(30)
  } catch {
    /* titrash yoʻq */
  }
}

/** Xato javob: faqat "bzz" ovozi (ovoz yoqilgan boʻlsa). Silkinish — CSS (.fx-shake). */
export function wrongFeedback(sound: boolean) {
  if (sound) playWrongSound()
}
