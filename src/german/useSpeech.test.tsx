// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { germanVoice, useSpeech, voiceFor } from './useSpeech'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const voice = (lang: string) => ({ lang, name: lang }) as SpeechSynthesisVoice

describe('voiceFor', () => {
  it('til boʻyicha: aniq mos afzal, keyin shu til; boshqa til olinmaydi', () => {
    const synth = { getVoices: () => [voice('de-DE'), voice('ko_KR'), voice('ko-KP')] }
    expect(voiceFor(synth, 'ko-KR')?.lang).toBe('ko_KR')
    expect(voiceFor({ getVoices: () => [voice('de-DE'), voice('ko-KP')] }, 'ko-KR')?.lang).toBe('ko-KP')
    expect(voiceFor({ getVoices: () => [voice('de-DE')] }, 'ko-KR')).toBeNull()
    expect(voiceFor(synth, 'de-DE')?.lang).toBe('de-DE')
  })
})

describe('germanVoice', () => {
  it('de-DE afzal; boshqa de ham mos; yoʻq boʻlsa null; API yoʻq boʻlsa null', () => {
    expect(germanVoice({ getVoices: () => [voice('en-US'), voice('de-AT'), voice('de-DE')] })?.lang).toBe('de-DE')
    expect(germanVoice({ getVoices: () => [voice('de-CH')] })?.lang).toBe('de-CH')
    expect(germanVoice({ getVoices: () => [voice('en-US')] })).toBeNull()
    expect(germanVoice(undefined)).toBeNull()
    expect(germanVoice({ getVoices: () => { throw new Error('x') } })).toBeNull()
  })
})

describe('useSpeech', () => {
  it('speechSynthesis yoʻq: tugma yoʻq, speak xato tashlamaydi', () => {
    // jsdom'da speechSynthesis yoʻq
    const { result } = renderHook(() => useSpeech())
    expect(result.current.canSpeak()).toBe(false)
    expect(() => result.current.speak('Hallo')).not.toThrow()
    expect(() => result.current.speak('Hallo', { slow: true })).not.toThrow()
  })

  it('audioUrl boʻlsa fayl oʻynaydi (ovoz yoʻq boʻlsa ham); play rad etilsa xato chiqmaydi', async () => {
    const play = vi.fn(() => Promise.reject(new Error('NotAllowed')))
    const Audio = vi.fn(function (this: { play: typeof play }) {
      this.play = play
    })
    vi.stubGlobal('Audio', Audio)
    const { result } = renderHook(() => useSpeech())
    expect(result.current.canSpeak('https://example.com/a.mp3')).toBe(true)
    await act(async () => {
      result.current.speak('Hallo', { audioUrl: 'https://example.com/a.mp3' })
    })
    expect(Audio).toHaveBeenCalledWith('https://example.com/a.mp3')
    expect(play).toHaveBeenCalled()
  })

  it('nemis ovozi bor: de-DE, normal va sekin (0.7) tezlik', () => {
    const spoken: { text: string; lang: string; rate: number }[] = []
    const synth = { getVoices: () => [voice('de-DE')], speak: (u: never) => spoken.push(u), cancel: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }
    class Utt {
      voice: unknown
      lang = ''
      rate = 1
      constructor(public text: string) {}
    }
    vi.stubGlobal('speechSynthesis', synth)
    vi.stubGlobal('SpeechSynthesisUtterance', Utt)
    const { result } = renderHook(() => useSpeech())
    expect(result.current.canSpeak()).toBe(true)
    act(() => result.current.speak('Guten Tag'))
    act(() => result.current.speak('Guten Tag', { slow: true }))
    expect(spoken.map((s) => [s.text, s.lang, s.rate])).toEqual([['Guten Tag', 'de-DE', 1], ['Guten Tag', 'de-DE', 0.7]])
  })

  it('nemis ovozi topilmasa (kutilgandan keyin) tugma oʻrniga yozuv uchun canSpeak=false', () => {
    vi.useFakeTimers()
    const synth = { getVoices: () => [voice('en-US')], speak: vi.fn(), cancel: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }
    vi.stubGlobal('speechSynthesis', synth)
    vi.stubGlobal('SpeechSynthesisUtterance', class {})
    const { result } = renderHook(() => useSpeech())
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.canSpeak()).toBe(false)
    expect(() => act(() => result.current.speak('Hallo'))).not.toThrow()
  })
})
