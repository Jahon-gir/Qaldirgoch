import { useCallback, useEffect, useRef, useState } from 'react'

/** Brauzerning SpeechRecognition'i (Chrome'da webkit prefiksi bilan). Faqat kerakli qismi. */
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error?: string }) => void) | null
  onend: (() => void) | null
}
type RecognitionCtor = new () => Recognition

export const LISTEN_MAX_MS = 8000
/** stop() dan keyin end hodisasi kelmasa shuncha kutiladi. */
const STOP_GRACE_MS = 1200
export const MAX_ALTERNATIVES = 3

/** Feature detect (brauzer nomiga qaralmaydi). */
export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}
export const speechRecognitionSupported = () => getRecognitionCtor() !== null

export type RecState =
  | { status: 'idle' | 'listening' | 'no-speech' | 'denied' | 'network' | 'error' }
  | { status: 'result'; alternatives: string[] }

const IDLE: RecState = { status: 'idle' }

function errorState(code: string | undefined): RecState {
  switch (code) {
    case 'no-speech':
      return { status: 'no-speech' }
    case 'not-allowed':
    case 'service-not-allowed':
    case 'audio-capture':
      return { status: 'denied' }
    case 'network':
      return { status: 'network' }
    default:
      return { status: 'error' }
  }
}

/**
 * Ovoz tanish (lang — course.speechLang, standart de-DE), bitta jumla, oraliq natijalarsiz, 3 tagacha variant.
 * ~8 soniyadan keyin oʻzi toʻxtaydi; ekrandan chiqilganda yoki cancel() da toʻxtatiladi (mikrofon oqib qolmasin).
 * Ovoz saqlanmaydi: faqat tanilgan matn xotirada turadi.
 */
export function useSpeechRecognition(lang: string = 'de-DE') {
  const [state, setState] = useState<RecState>(IDLE)
  const stopRef = useRef<(() => void) | null>(null)

  const cancel = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    setState(IDLE)
  }, [])

  const start = useCallback(() => {
    if (stopRef.current) return // allaqachon tinglanmoqda
    const Ctor = getRecognitionCtor()
    if (!Ctor) return setState({ status: 'error' })
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return setState({ status: 'network' })
    const timers: number[] = []
    let settled = false
    let rec: Recognition
    const release = () => {
      timers.forEach((id) => window.clearTimeout(id))
      rec.onresult = rec.onerror = rec.onend = null
      stopRef.current = null
    }
    const settle = (s: RecState) => {
      if (settled) return
      settled = true
      release()
      setState(s)
    }
    try {
      rec = new Ctor()
      rec.lang = lang
      rec.continuous = false
      rec.interimResults = false
      rec.maxAlternatives = MAX_ALTERNATIVES
      rec.onresult = (e) => {
        const first = e.results?.[0]
        const alts: string[] = []
        for (let i = 0; first && i < Math.min(first.length, MAX_ALTERNATIVES); i++) {
          const t = first[i]?.transcript?.trim()
          if (t) alts.push(t)
        }
        settle(alts.length ? { status: 'result', alternatives: alts } : { status: 'no-speech' })
      }
      rec.onerror = (e) => settle(errorState(e?.error))
      rec.onend = () => settle({ status: 'no-speech' }) // natijasiz tugadi
      stopRef.current = () => {
        if (settled) return
        settled = true
        release()
        try {
          rec.abort()
        } catch {
          /* allaqachon toʻxtagan */
        }
      }
      timers.push(
        window.setTimeout(() => {
          try {
            rec.stop() // oxirgi eshitilganini natijaga aylantiradi
          } catch {
            /* ignore */
          }
          timers.push(window.setTimeout(() => settle({ status: 'no-speech' }), STOP_GRACE_MS))
        }, LISTEN_MAX_MS)
      )
      setState({ status: 'listening' })
      rec.start()
    } catch {
      settle({ status: 'error' })
    }
  }, [lang])

  // Ekrandan chiqilganda tinglash toʻxtaydi
  useEffect(() => () => stopRef.current?.(), [])

  return { state, start, cancel, reset: cancel }
}
