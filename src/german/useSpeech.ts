import { useCallback, useEffect, useRef, useState } from 'react'

/** Brauzerda shu til ovozi bormi: avval aniq ("ko-KR"), keyin til boʻyicha ("ko"). speechSynthesis yoʻq boʻlsa — yoʻq. Xato tashlamaydi. */
export function voiceFor(synth: Pick<SpeechSynthesis, 'getVoices'> | undefined | null, lang: string): SpeechSynthesisVoice | null {
  try {
    const voices = synth?.getVoices?.() ?? []
    const full = lang.toLowerCase()
    const base = full.split('-')[0]
    return voices.find((v) => v.lang?.toLowerCase().replace('_', '-') === full) ?? voices.find((v) => v.lang?.toLowerCase().startsWith(base)) ?? null
  } catch {
    return null
  }
}

/** Brauzerda nemis ovozi bormi. */
export const germanVoice = (synth: Pick<SpeechSynthesis, 'getVoices'> | undefined | null) => voiceFor(synth, 'de-DE')

const getSynth = (): SpeechSynthesis | null => (typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined' ? window.speechSynthesis : null)

/**
 * Kurs tilidagi matnni ovozda oʻqish (lang — course.speechLang, standart de-DE). audioUrl boʻlsa — fayl, aks holda brauzerning speechSynthesis.
 * Kalit ham, tashqi TTS ham yoʻq. Ovoz yoʻq boʻlsa `canSpeak` false — ekran buzilmaydi.
 */
export function useSpeech(lang: string = 'de-DE') {
  const [hasVoice, setHasVoice] = useState<boolean | null>(() => (getSynth() ? (voiceFor(getSynth(), lang) ? true : null) : false))
  const audioRef = useRef<HTMLAudioElement | null>(null)
  /** Hozir oʻqilmoqdami (tugmani toʻq rangda koʻrsatish uchun). Hodisa kelmasa ham taymer bilan oʻchadi. */
  const [speaking, setSpeaking] = useState(false)
  const stopTimer = useRef<number | undefined>(undefined)
  const seq = useRef(0)

  // Ovozlar brauzerda kechroq yuklanadi: voiceschanged'ni kutamiz, kelmasa "yoʻq" deymiz
  useEffect(() => {
    const synth = getSynth()
    if (!synth) {
      setHasVoice(false)
      return
    }
    const check = () => setHasVoice(voiceFor(synth, lang) ? true : null)
    check()
    const timer = window.setTimeout(() => setHasVoice((v) => (v === null ? false : v)), 1500)
    try {
      synth.addEventListener?.('voiceschanged', check)
    } catch {
      /* eski brauzer */
    }
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(stopTimer.current)
      try {
        synth.removeEventListener?.('voiceschanged', check)
        synth.cancel()
      } catch {
        /* ovoz toʻxtatib boʻlmasa ham ekran yopilaveradi */
      }
      audioRef.current?.pause()
    }
  }, [lang])

  /** Tugma koʻrsatiladimi: fayl bor yoki shu til ovozi bor (yoki hali aniqlanmoqda). */
  const canSpeak = useCallback((audioUrl?: string) => !!audioUrl || hasVoice !== false, [hasVoice])

  const speak = useCallback((text: string, opts: { audioUrl?: string; slow?: boolean; rate?: number } = {}) => {
    const mine = ++seq.current
    const begin = () => {
      setSpeaking(true)
      window.clearTimeout(stopTimer.current)
      stopTimer.current = window.setTimeout(() => setSpeaking(false), 6000) // end hodisasi kelmasa
    }
    const end = () => {
      if (mine !== seq.current) return // yangi oʻqish boshlangan: eskisining tugashi uni oʻchirmasin
      window.clearTimeout(stopTimer.current)
      setSpeaking(false)
    }
    try {
      audioRef.current?.pause()
      getSynth()?.cancel()
      if (opts.audioUrl) {
        const a = new Audio(opts.audioUrl)
        if (opts.rate || opts.slow) a.playbackRate = opts.rate ?? 0.7
        audioRef.current = a
        a.onended = end
        begin()
        // play() Promise qaytaradi: rad etilishi ekranni buzmasin
        void Promise.resolve(a.play()).catch(() => undefined)
        return
      }
      const synth = getSynth()
      if (!synth) return
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      u.rate = opts.rate ?? (opts.slow ? 0.7 : 1)
      const voice = voiceFor(synth, lang)
      if (voice) u.voice = voice
      u.onend = end
      u.onerror = end
      begin()
      synth.speak(u)
    } catch {
      /* ovoz ishlamasa ham mashq davom etadi */
    }
  }, [lang])

  return { canSpeak, speak, speaking }
}
