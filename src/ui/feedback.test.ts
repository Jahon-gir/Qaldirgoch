// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { burst, PARTICLES, playRightSound, playWrongSound, resetFeedbackAudio, rightFeedback, wrongFeedback } from './feedback'

type Param = { setValueAtTime: ReturnType<typeof vi.fn>; linearRampToValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> }
const oscs: { type: string; frequency: Param; start: ReturnType<typeof vi.fn> }[] = []
const gains: { gain: Param }[] = []
const param = (): Param => ({ setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() })
let Ctx: ReturnType<typeof vi.fn>

beforeEach(() => {
  oscs.length = 0
  gains.length = 0
  resetFeedbackAudio()
  Ctx = vi.fn(function (this: Record<string, unknown>) {
    this.currentTime = 1
    this.state = 'running'
    this.destination = {}
    this.resume = vi.fn()
    this.createOscillator = vi.fn(() => {
      const o = { type: '', frequency: param(), connect: vi.fn(), start: vi.fn(), stop: vi.fn() }
      oscs.push(o)
      return o
    })
    this.createGain = vi.fn(() => {
      const g = { gain: param(), connect: vi.fn() }
      gains.push(g)
      return g
    })
  })
  vi.stubGlobal('AudioContext', Ctx)
})
afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

const vibrate = () => {
  const fn = vi.fn()
  Object.defineProperty(navigator, 'vibrate', { value: fn, configurable: true })
  return fn
}

describe('toʻgʻri javob ovozi', () => {
  it('sine, uch nota: G5 784, C6 1047, E6 1319 Hz; balandlik 0,18; notalar boshi 0,11 s oraliqda', () => {
    playRightSound()
    expect(oscs.map((o) => [o.type, o.frequency.setValueAtTime.mock.calls[0][0]])).toEqual([['sine', 784], ['sine', 1047], ['sine', 1319]])
    expect(oscs.map((o) => o.start.mock.calls[0][0])).toEqual([1, expect.closeTo(1.11, 5), expect.closeTo(1.22, 5)])
    expect(gains.every((g) => g.gain.linearRampToValueAtTime.mock.calls[0][0] === 0.18)).toBe(true)
  })

  it('AudioContext bir marta yaratiladi va qayta ishlatiladi', () => {
    playRightSound()
    playWrongSound()
    playRightSound()
    expect(Ctx).toHaveBeenCalledTimes(1)
  })

  it('toʻxtatilgan kontekst bosish ichida davom ettiriladi', () => {
    playRightSound()
    const inst = Ctx.mock.instances[0] as { state: string; resume: ReturnType<typeof vi.fn> }
    inst.state = 'suspended'
    playRightSound()
    expect(inst.resume).toHaveBeenCalled()
  })
})

describe('xato javob ovozi', () => {
  it('square, 180 → 140 Hz 0,22 s da, balandlik 0,06', () => {
    playWrongSound()
    expect(oscs).toHaveLength(1)
    expect(oscs[0].type).toBe('square')
    expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(180, 1)
    expect(oscs[0].frequency.linearRampToValueAtTime).toHaveBeenCalledWith(140, expect.closeTo(1.22, 5))
    expect(gains[0].gain.linearRampToValueAtTime.mock.calls[0][0]).toBe(0.06)
  })
})

describe('ovoz effektlari yoqilgan/oʻchirilgan', () => {
  it('yoqilgan: toʻgʻrida ovoz + vibrate(30); xatoda faqat ovoz (titrashsiz)', () => {
    const v = vibrate()
    rightFeedback(null, true)
    expect(Ctx).toHaveBeenCalledTimes(1)
    expect(v).toHaveBeenCalledWith(30)
    v.mockClear()
    wrongFeedback(true)
    expect(v).not.toHaveBeenCalled()
    expect(oscs[oscs.length - 1].type).toBe('square')
  })

  it('oʻchirilgan: AudioContext umuman chaqirilmaydi, titrash ham yoʻq', () => {
    const v = vibrate()
    rightFeedback(document.body, false)
    wrongFeedback(false)
    expect(Ctx).not.toHaveBeenCalled()
    expect(v).not.toHaveBeenCalled()
  })

  it('Web Audio yoʻq brauzerda xato tashlamaydi', () => {
    vi.stubGlobal('AudioContext', undefined)
    expect(() => {
      rightFeedback(null, true)
      wrongFeedback(true)
    }).not.toThrow()
  })
})

describe('zarralar', () => {
  const fakeAnimate = () => {
    const animate = vi.fn()
    Object.defineProperty(Element.prototype, 'animate', { value: animate, configurable: true, writable: true })
    return animate
  }
  const reduced = (on: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('reduce'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  afterEach(() => {
    // @ts-expect-error jsdom'da yoʻq edi
    delete Element.prototype.animate
  })

  it(`~${PARTICLES} ta zarra (kvadrat va doira) qoʻshiladi va keyin olib tashlanadi`, () => {
    vi.useFakeTimers()
    reduced(false)
    const animate = fakeAnimate()
    burst(document.body)
    expect(animate).toHaveBeenCalledTimes(PARTICLES)
    const root = document.querySelector('[data-fx-burst]')!
    expect(root.children).toHaveLength(PARTICLES)
    const radii = new Set([...root.children].map((c) => (c as HTMLElement).style.borderRadius))
    expect(radii.size).toBe(2)
    vi.advanceTimersByTime(900)
    expect(document.querySelector('[data-fx-burst]')).toBeNull()
    vi.useRealTimers()
  })

  it('prefers-reduced-motion: zarralar yoʻq', () => {
    reduced(true)
    const animate = fakeAnimate()
    burst(document.body)
    expect(animate).not.toHaveBeenCalled()
    expect(document.querySelector('[data-fx-burst]')).toBeNull()
  })
})
