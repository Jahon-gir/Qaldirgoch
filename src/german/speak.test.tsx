// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { MIC_PRIVACY_KEY } from '../components/vocab/ex/SpeakStep'
import { I18nProvider } from '../i18n/I18nProvider'
import { cyrlOverrides } from '../i18n/cyrl'
import { ru } from '../i18n/ru'
import { uz } from '../i18n/uz'
import { PROFILE_SCHEMA_VERSION, VOCAB_MODES, type Profile } from '../profile/questions'
import { ProfileProvider } from '../profile/ProfileProvider'
import { normalizeProfile } from '../profile/sync'
import { ProgressProvider } from '../progress/ProgressProvider'
import { InstallProvider } from '../pwa/InstallProvider'
import { check } from './answer'
import { kindsFor, mixedKinds, nextMixedKind, reviewKind } from './exercises'
import { methodCounts } from './finalTest'
import { LessonsProvider } from './LessonsProvider'
import { judgeSpoken, numberWord } from './speakCheck'
import { localDay } from './srs'
import { LISTEN_MAX_MS, speechRecognitionSupported, useSpeechRecognition } from './useSpeechRecognition'
import { VOCAB } from '../content/german/words'
import { lessonWords } from './vocab'
import { WordsProvider } from './WordsProvider'

/* ---------- Soxta SpeechRecognition ---------- */

class FakeRec {
  static instances: FakeRec[] = []
  lang = ''
  continuous = true
  interimResults = true
  maxAlternatives = 1
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  onend: (() => void) | null = null
  started = false
  stopped = false
  aborted = false
  endOnStop = true
  constructor() {
    FakeRec.instances.push(this)
  }
  start() {
    this.started = true
  }
  stop() {
    this.stopped = true
    if (this.endOnStop) this.onend?.()
  }
  abort() {
    this.aborted = true
  }
  say(alts: string[]) {
    this.onresult?.({ results: [alts.map((transcript) => ({ transcript }))] })
    this.onend?.()
  }
  fail(error: string) {
    this.onerror?.({ error })
    this.onend?.()
  }
}
const rec = () => FakeRec.instances[FakeRec.instances.length - 1]
const withRec = (name: 'SpeechRecognition' | 'webkitSpeechRecognition' = 'SpeechRecognition') => vi.stubGlobal(name, FakeRec)

/* ---------- Ilova ---------- */

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1, dailyGoal: 2 }
const NOW = '2026-11-01T00:00:00.000Z'
const TODAY = localDay()
const L1 = lessonWords('a1-m1-l1') // Hallo, Guten Morgen, Guten Tag, Guten Abend
const stored = (k: string) => JSON.parse(localStorage.getItem(`qaldirgoch.${k}`) ?? 'null')
const activityToday = () => stored('activity')?.[TODAY]?.count ?? 0

function seed({ mode = 'speak', privacy = true }: { mode?: string; privacy?: boolean } = {}) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify({ ...PROFILE, vocabMode: mode }))
  localStorage.setItem('qaldirgoch.lessons', JSON.stringify({ 'a1-m1-l1': { lessonId: 'a1-m1-l1', score: 1, total: 1, completedAt: NOW } }))
  if (privacy) localStorage.setItem(MIC_PRIVACY_KEY, '1')
}
function renderApp(path = '/til/lugat/a1-m1-l1', lang?: string) {
  if (lang) localStorage.setItem('qaldirgoch.lang', lang)
  return render(
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <ProgressProvider>
            <LessonsProvider>
              <WordsProvider>
                <InstallProvider>
                  <MemoryRouter initialEntries={['/til', path]} initialIndex={1}>
                    <AppRoutes />
                  </MemoryRouter>
                </InstallProvider>
              </WordsProvider>
            </LessonsProvider>
          </ProgressProvider>
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
const btn = (name: string | RegExp) => screen.getByRole('button', { name })
const click = (name: string | RegExp) => fireEvent.click(btn(name))
const mic = () => btn('Gapirish uchun bosing')
const say = (...alts: string[]) => act(() => rec().say(alts))
const fail = (e: string) => act(() => rec().fail(e))
const pressMic = () => click('Gapirish uchun bosing')

beforeEach(() => {
  localStorage.clear()
  FakeRec.instances = []
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

/* ---------- Sof funksiyalar ---------- */

describe('judgeSpoken / numberWord', () => {
  it('alternativlardan BIRORTASI toʻgʻri boʻlsa — tanildi; koʻrsatiladigan matn mos kelgani', () => {
    expect(judgeSpoken(['Dunki', 'Danke'], 'Danke')).toMatchObject({ ok: true, heard: 'Danke' })
    expect(judgeSpoken(['Dunki', 'Donka'], 'Danke')).toMatchObject({ ok: false, heard: 'Dunki' })
    expect(judgeSpoken([], 'Danke')).toMatchObject({ ok: false, heard: '' })
  })
  it('katta-kichik harf va oxiridagi nuqta / savol belgisi farq qilmaydi (normalize)', () => {
    for (const s of ['danke', 'Danke.', 'danke?', 'Danke!', ' Danke ']) expect(check(s, 'Danke')).not.toBe('wrong')
    expect(judgeSpoken(['guten morgen.'], 'Guten Morgen').ok).toBe(true)
  })
  it('deyarli (1 harf farq, 5+ harf) ham tanildi hisoblanadi', () => {
    expect(judgeSpoken(['Guten Morgan'], 'Guten Morgen')).toMatchObject({ ok: true, result: 'almost' })
  })
  it('raqamlar: 0–20 oraligʻida nemischa soʻzga', () => {
    expect(numberWord('1')).toBe('eins')
    expect(numberWord('2.')).toBe('zwei')
    expect(numberWord('12')).toBe('zwölf')
    expect(numberWord('20')).toBe('zwanzig')
    expect(numberWord('0')).toBe('null')
    expect(numberWord('21')).toBeNull()
    expect(numberWord('abc')).toBeNull()
    expect(judgeSpoken(['1'], 'eins')).toMatchObject({ ok: true, heard: '1' })
    expect(judgeSpoken(['5'], 'fünf').ok).toBe(true)
    expect(judgeSpoken(['3'], 'zwei').ok).toBe(false)
  })
})

describe("'speak' faqat lugʻat usuli: Aralash, takrorlash va yakuniy testga kirmaydi", () => {
  it('kindsFor / Aralash', () => {
    for (const w of VOCAB) for (const l of [true, false]) expect(kindsFor(w, l)).not.toContain('speak')
    const words = VOCAB.slice(0, 60)
    for (const l of [true, false]) {
      expect(mixedKinds(words, l)).not.toContain('speak')
      for (const w of words) for (let i = 0; i < 5; i++) expect(nextMixedKind(w, undefined, l)).not.toBe('speak')
    }
  })
  it('takrorlash (SRS) usullari', () => {
    for (const iv of [1, 3, 7, 14, 30]) for (const w of VOCAB.slice(0, 30)) for (const l of [true, false]) for (const n of [0, 1]) expect(reviewKind(iv, w, l, n)).not.toBe('speak')
  })
  it('yakuniy test', () => {
    for (const n of [5, 10, 20, 40]) for (const l of [true, false]) expect([...methodCounts(n, l, 5).keys()]).not.toContain('speak')
  })
  it('VOCAB_MODES da bor; i18n: uz/ru/kirill matnlari toʻliq', () => {
    expect(VOCAB_MODES).toContain('speak')
    for (const k of Object.keys(uz).filter((k) => k.startsWith('ex.speak.') || k === 'vocab.mode.speak' || k === 'vocab.summarySpeak')) {
      expect(ru[k as keyof typeof ru], k).toBeTruthy()
      expect(cyrlOverrides[k as keyof typeof cyrlOverrides], k).toBeTruthy()
    }
  })
})

describe('profil: vocabMode tekshiruvi', () => {
  const base: Profile = { ageRange: '18-24', education: 'school', profession: 'electrician', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-01-01T00:00:00.000Z', schemaVersion: PROFILE_SCHEMA_VERSION }
  it("'speak' qabul qilinadi; notanish qiymat (eski mijoz uchun yangi usul) e'tiborsiz qoldiriladi, profil buzilmaydi", () => {
    expect(normalizeProfile({ ...base, vocabMode: 'speak' })?.vocabMode).toBe('speak')
    const p = normalizeProfile({ ...base, vocabMode: 'telepathy' })
    expect(p).not.toBeNull()
    expect(p?.vocabMode).toBeUndefined()
  })
})

/* ---------- Hook ---------- */

describe('useSpeechRecognition', () => {
  it('sozlamalar: de-DE, continuous=false, interimResults=false, maxAlternatives=3', () => {
    withRec()
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    expect(rec()).toMatchObject({ lang: 'de-DE', continuous: false, interimResults: false, maxAlternatives: 3, started: true })
    expect(result.current.state.status).toBe('listening')
  })
  it('feature detect: ikkala nom ham, yoʻq boʻlsa false', () => {
    expect(speechRecognitionSupported()).toBe(false)
    withRec('webkitSpeechRecognition')
    expect(speechRecognitionSupported()).toBe(true)
  })
  it('~8 soniyadan keyin oʻzi toʻxtaydi (natija yoʻq — no-speech)', () => {
    vi.useFakeTimers()
    withRec()
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    act(() => void vi.advanceTimersByTime(LISTEN_MAX_MS - 1))
    expect(rec().stopped).toBe(false)
    act(() => void vi.advanceTimersByTime(2))
    expect(rec().stopped).toBe(true)
    expect(result.current.state.status).toBe('no-speech')
  })
  it('stop() dan keyin end hodisasi kelmasa ham tinglash holatida qotib qolmaydi', () => {
    vi.useFakeTimers()
    withRec()
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    rec().endOnStop = false
    act(() => void vi.advanceTimersByTime(LISTEN_MAX_MS + 2000))
    expect(result.current.state.status).toBe('no-speech')
  })
  it('natija: 3 tagacha variant, boʻsh variantlar tashlanadi', () => {
    withRec()
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    act(() => rec().say(['a', ' ', 'b', 'c', 'd']))
    expect(result.current.state).toEqual({ status: 'result', alternatives: ['a', 'b'] })
  })
  it('xato kodlari: not-allowed → denied, network, no-speech, boshqasi → error', () => {
    withRec()
    const { result } = renderHook(() => useSpeechRecognition())
    for (const [code, status] of [['not-allowed', 'denied'], ['service-not-allowed', 'denied'], ['network', 'network'], ['no-speech', 'no-speech'], ['weird', 'error']] as const) {
      act(() => result.current.start())
      act(() => rec().fail(code))
      expect(result.current.state.status).toBe(status)
    }
  })
  it('bekor qilish va unmount mikrofonni toʻxtatadi (abort)', () => {
    withRec()
    const a = renderHook(() => useSpeechRecognition())
    act(() => a.result.current.start())
    act(() => a.result.current.cancel())
    expect(rec().aborted).toBe(true)
    expect(a.result.current.state.status).toBe('idle')
    const b = renderHook(() => useSpeechRecognition())
    act(() => b.result.current.start())
    const r = rec()
    b.unmount()
    expect(r.aborted).toBe(true)
  })
  it('internet yoʻq: tinglash boshlanmaydi, network', () => {
    withRec()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    expect(FakeRec.instances).toHaveLength(0)
    expect(result.current.state.status).toBe('network')
    vi.restoreAllMocks()
  })
})

/* ---------- Ekran ---------- */

describe('Talaffuz mashqi', () => {
  beforeEach(() => {
    withRec()
    seed()
  })

  it('boshlanish: sarlavha, koʻk karta, mikrofon (≥72 px), Oʻtkazib yuborish; pastki menyu yoʻq', () => {
    renderApp()
    expect(screen.getByText('Talaffuz · 1 / 4')).toBeTruthy()
    expect(screen.getByText('Eshiting va takrorlang')).toBeTruthy()
    expect(screen.getByText(L1[0].de)).toBeTruthy()
    expect(screen.getByText('Salom')).toBeTruthy()
    expect(mic().className).toContain('h-[80px]')
    expect(btn('Oʻtkazib yuborish')).toBeTruthy()
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByText(/%/)).toBeNull() // foiz/ball yoʻq
  })

  it('tinglash: "Eshitilmoqda…", "Bekor qilish" mikrofonni toʻxtatadi', () => {
    renderApp()
    pressMic()
    expect(screen.getByText('Eshitilmoqda…')).toBeTruthy()
    expect(screen.getByText('Soʻzni aniq ayting')).toBeTruthy()
    click('Bekor qilish')
    expect(rec().aborted).toBe(true)
    expect(screen.getByText('Gapirish uchun bosing', { selector: 'p' })).toBeTruthy()
  })

  it('toʻgʻri tanildi: yashil quti, "Siz aytdingiz", Qayta aytish, Davom etish → keyingi soʻz', () => {
    renderApp()
    pressMic()
    say('Hallo')
    expect(screen.getByText('Toʻgʻri tanildi')).toBeTruthy()
    expect(screen.getByText('Siz aytdingiz: Hallo')).toBeTruthy()
    expect(btn('Qayta aytish')).toBeTruthy()
    click('Davom etish')
    expect(screen.getByText('Talaffuz · 2 / 4')).toBeTruthy()
    expect(screen.getByText(L1[1].de)).toBeTruthy()
  })

  it('toʻgʻri: faqat ikkinchi alternativ mos kelsa ham; "Qayta aytish" boshlanishga qaytaradi', () => {
    renderApp()
    pressMic()
    say('Banane', 'hallo.')
    expect(screen.getByText('Siz aytdingiz: hallo.')).toBeTruthy()
    click('Qayta aytish')
    expect(screen.queryByText('Toʻgʻri tanildi')).toBeNull()
    expect(mic()).toBeTruthy()
  })

  it('deyarli (bitta harf farq) — toʻgʻri tanildi', () => {
    renderApp()
    click('Oʻtkazib yuborish') // 2-soʻz: Guten Morgen
    pressMic()
    say('Guten Morgan')
    expect(screen.getByText('Toʻgʻri tanildi')).toBeTruthy()
  })

  it('tanilmadi: sariq quti, nima eshitilgani, Qayta urinish va Oʻtkazib yuborish; Davom etish yoʻq', () => {
    renderApp()
    pressMic()
    say('Banane')
    expect(screen.getByText('Telefon “Banane” deb eshitdi')).toBeTruthy()
    expect(screen.getByText('Avval soʻzni eshiting, keyin yana urinib koʻring.')).toBeTruthy()
    const box = screen.getByText('Telefon “Banane” deb eshitdi').closest('[role="status"]')!
    expect(box.className).toContain('bg-warn-soft')
    expect(box.className).not.toContain('danger') // qizil ishlatilmaydi
    expect(btn('Qayta urinish')).toBeTruthy()
    expect(btn('Oʻtkazib yuborish')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Davom etish' })).toBeNull()
  })

  it('3 marta tanilmasa "Davom etish" chiqadi; Oʻtkazib yuborish ham qoladi', () => {
    renderApp()
    for (let i = 0; i < 3; i++) {
      expect(screen.queryByRole('button', { name: 'Davom etish' })).toBeNull()
      i === 0 ? pressMic() : click('Qayta urinish')
      say('Banane')
    }
    expect(btn('Davom etish')).toBeTruthy()
    expect(btn('Oʻtkazib yuborish')).toBeTruthy()
    click('Davom etish')
    expect(screen.getByText('Talaffuz · 2 / 4')).toBeTruthy()
  })

  it('hech narsa eshitilmadi / mikrofon rad etildi / internet yoʻq: bir jumlali sariq xabar + Oʻtkazib yuborish', () => {
    renderApp()
    pressMic()
    fail('no-speech')
    expect(screen.getByText('Hech narsa eshitilmadi. Yana urinib koʻring.')).toBeTruthy()
    expect(btn('Oʻtkazib yuborish')).toBeTruthy()
    click('Qayta urinish')
    fail('not-allowed')
    expect(screen.getByText('Mikrofonga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering yoki mashqni oʻtkazib yuboring.')).toBeTruthy()
    expect(btn('Oʻtkazib yuborish')).toBeTruthy()
    click('Qayta urinish')
    fail('network')
    expect(screen.getByText('Ovozni tanish uchun internet kerak.')).toBeTruthy()
    expect(btn('Oʻtkazib yuborish')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Davom etish' })).toBeNull() // bular "tanilmadi" urinishi emas
  })

  it('ekran oʻqigich: holatlar aria-live="polite" ichida', () => {
    renderApp()
    pressMic()
    expect(screen.getByText('Eshitilmoqda…').closest('[aria-live="polite"]')).not.toBeNull()
  })

  it('ekrandan chiqilganda tinglash toʻxtaydi', () => {
    const { unmount } = renderApp()
    pressMic()
    const r = rec()
    expect(r.aborted).toBe(false)
    unmount()
    expect(r.aborted).toBe(true)
  })

  it('bilmaganlar roʻyxati va natija: hammasi oʻtkazilsa/tanilmasa ham roʻyxat paydo boʻlmaydi; maqsadga +1 faqat oxirida', () => {
    renderApp()
    const wordsBefore = JSON.stringify(stored('words'))
    pressMic()
    for (let i = 0; i < 3; i++) {
      say('Banane')
      if (i < 2) click('Qayta urinish')
    }
    click('Davom etish') // 1-soʻz: 3 marta tanilmadi
    expect(activityToday()).toBe(0)
    for (let i = 1; i < L1.length - 1; i++) click('Oʻtkazib yuborish')
    expect(activityToday()).toBe(0) // hali oxiriga yetmadi
    expect(screen.getByText('Talaffuz · 4 / 4')).toBeTruthy()
    click('Oʻtkazib yuborish')
    expect(screen.getByRole('heading', { name: 'Mashq tugadi' })).toBeTruthy()
    expect(screen.getByText(`${L1.length} ta soʻz mashq qilindi`)).toBeTruthy()
    expect(screen.queryByText(/tasini bildingiz/)).toBeNull()
    expect(screen.queryByRole('region', { name: 'Bilmaganlaringiz' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Bilmaganlarimni qayta mashq qilish' })).toBeNull()
    expect(screen.getByText('Bugungi maqsadga +1')).toBeTruthy()
    expect(activityToday()).toBe(1)
    expect(JSON.stringify(stored('words'))).toBe(wordsBefore) // soʻz holati (SRS / bilmaganlar) oʻzgarmadi
  })

  it('Aralash usulda Talaffuz chiqmaydi (mikrofon tugmasi yoʻq)', () => {
    seed({ mode: 'mixed' })
    renderApp()
    expect(screen.queryByRole('button', { name: 'Gapirish uchun bosing' })).toBeNull()
    expect(FakeRec.instances).toHaveLength(0)
  })
})

describe('Maxfiylik oynasi', () => {
  beforeEach(() => {
    withRec()
    seed({ privacy: false })
  })

  it('birinchi bosishda brauzer soʻrashidan OLDIN chiqadi; "Bekor qilish" — tinglanmaydi va belgi qoʻyilmaydi', () => {
    renderApp()
    pressMic()
    const dlg = screen.getByRole('dialog')
    expect(within(dlg).getByText('Ovoz telefoningiz brauzeri orqali matnga aylantiriladi (Chromeʼda bu Google xizmati). Qaldirgʻoch ovozingizni saqlamaydi va oʻz serveriga yubormaydi.')).toBeTruthy()
    expect(FakeRec.instances).toHaveLength(0)
    fireEvent.click(within(dlg).getByRole('button', { name: 'Bekor qilish' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(FakeRec.instances).toHaveLength(0)
    expect(localStorage.getItem(MIC_PRIVACY_KEY)).toBeNull()
    pressMic() // yana chiqadi
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('"Davom etish": belgi localStorage ga (profilga emas) yoziladi, tinglash boshlanadi; keyin oyna chiqmaydi', () => {
    renderApp()
    pressMic()
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Davom etish' }))
    expect(localStorage.getItem(MIC_PRIVACY_KEY)).toBe('1')
    expect(stored('profile')).not.toHaveProperty('micPrivacy')
    expect(rec().started).toBe(true)
    expect(screen.getByText('Eshitilmoqda…')).toBeTruthy()
    click('Bekor qilish')
    pressMic()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(FakeRec.instances).toHaveLength(2)
  })

  it('rus va kirill tilida', () => {
    cleanup()
    renderApp('/til/lugat/a1-m1-l1', 'ru')
    fireEvent.click(screen.getByRole('button', { name: 'Нажмите, чтобы говорить' }))
    expect(within(screen.getByRole('dialog')).getByText(/Qaldirgʻoch не сохраняет ваш голос/)).toBeTruthy()
    cleanup()
    localStorage.setItem('qaldirgoch.lang', 'uz-Cyrl')
    renderApp('/til/lugat/a1-m1-l1', 'uz-Cyrl')
    fireEvent.click(screen.getByRole('button', { name: 'Гапириш учун босинг' }))
    expect(within(screen.getByRole('dialog')).getByText(/овозингизни сақламайди/)).toBeTruthy()
  })
})

describe('Usul oynasi va qoʻllab-quvvatlash', () => {
  const sheet = () => screen.getByRole('radiogroup')
  const radios = () => within(sheet()).getAllByRole('radio').map((r) => r.textContent)

  it('qoʻllab-quvvatlanmasa: "Talaffuz" kafelda yoʻq; profildagi speak — Roʻyxatga qaytadi, xato yoʻq', () => {
    seed({ mode: 'speak' })
    renderApp()
    expect(screen.getByText(/^Roʻyxat · /)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Gapirish uchun bosing' })).toBeNull()
    click('Mashq sozlamalari')
    expect(radios().some((t) => t?.includes('Talaffuz'))).toBe(false)
    expect(within(sheet()).getByRole('radio', { name: 'Roʻyxat' }).getAttribute('aria-checked')).toBe('true')
    expect(stored('profile').vocabMode).toBe('speak') // profil oʻzgarmaydi: boshqa qurilmada ishlayveradi
  })

  it('qoʻllab-quvvatlansa (webkit prefiksi bilan ham): kafel bor, tanlansa saqlanadi va ekran Talaffuzga oʻtadi', () => {
    withRec('webkitSpeechRecognition')
    seed({ mode: 'list' })
    renderApp()
    click('Mashq sozlamalari')
    expect(radios().some((t) => t?.includes('Talaffuz'))).toBe(true)
    fireEvent.click(within(sheet()).getByRole('radio', { name: 'Talaffuz' }))
    expect(stored('profile').vocabMode).toBe('speak')
    expect(screen.getByText('Talaffuz · 1 / 4')).toBeTruthy()
    expect(mic()).toBeTruthy()
  })
})
