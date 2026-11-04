import { useCallback, useEffect, useRef, useState } from 'react'

/** Brauzerda nemis ovozi bormi (speechSynthesis yoʻq boʻlsa — yoʻq). Xato tashlamaydi. */
export function germanVoice(synth: Pick<SpeechSynthesis, 'getVoices'> | undefined | null): SpeechSynthesisVoice | null {
  try {
    const voices = synth?.getVoices?.() ?? []
    return voices.find((v) => v.lang?.toLowerCase().replace('_', '-') === 'de-de') ?? voices.find((v) => v.lang?.toLowerCase().startsWith('de')) ?? null
  } catch {
    return null
  }
}

const getSynth = (): SpeechSynthesis | null => (typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined' ? window.speechSynthesis : null)

/**
 * Nemis tilidagi matnni ovozda oʻqish. audioUrl boʻlsa — fayl, aks holda brauzerning speechSynthesis (de-DE).
 * Kalit ham, tashqi TTS ham yoʻq. Ovoz yoʻq boʻlsa `canSpeak` false — ekran buzilmaydi.
 */
export function useSpeech() {
  const [hasVoice, setHasVoice] = useState<boolean | null>(() => (getSynth() ? (germanVoice(getSynth()) ? true : null) : false))
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Ovozlar brauzerda kechroq yuklanadi: voiceschanged'ni kutamiz, kelmasa "yoʻq" deymiz
  useEffect(() => {
    const synth = getSynth()
    if (!synth) {
      setHasVoice(false)
      return
    }
    const check = () => setHasVoice(germanVoice(synth) ? true : null)
    check()
    const timer = window.setTimeout(() => setHasVoice((v) => (v === null ? false : v)), 1500)
    try {
      synth.addEventListener?.('voiceschanged', check)
    } catch {
      /* eski brauzer */
    }
    return () => {
      window.clearTimeout(timer)
      try {
        synth.removeEventListener?.('voiceschanged', check)
        synth.cancel()
      } catch {
        /* ovoz toʻxtatib boʻlmasa ham ekran yopilaveradi */
      }
      audioRef.current?.pause()
    }
  }, [])

  /** Tugma koʻrsatiladimi: fayl bor yoki nemis ovozi bor (yoki hali aniqlanmoqda). */
  const canSpeak = useCallback((audioUrl?: string) => !!audioUrl || hasVoice !== false, [hasVoice])

  const speak = useCallback((text: string, opts: { audioUrl?: string; slow?: boolean } = {}) => {
    try {
      audioRef.current?.pause()
      getSynth()?.cancel()
      if (opts.audioUrl) {
        const a = new Audio(opts.audioUrl)
        if (opts.slow) a.playbackRate = 0.7
        audioRef.current = a
        // play() Promise qaytaradi: rad etilishi ekranni buzmasin
        void Promise.resolve(a.play()).catch(() => undefined)
        return
      }
      const synth = getSynth()
      if (!synth) return
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'de-DE'
      u.rate = opts.slow ? 0.7 : 1
      const voice = germanVoice(synth)
      if (voice) u.voice = voice
      synth.speak(u)
    } catch {
      /* ovoz ishlamasa ham mashq davom etadi */
    }
  }, [])

  return { canSpeak, speak }
}
