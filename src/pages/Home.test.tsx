// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { LessonsProvider } from '../german/LessonsProvider'
import { WordsProvider } from '../german/WordsProvider'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { COUNTRIES } from '../content/countries'
import { AUSBILDUNG_STEPS, AUTO_DONE_STEPS } from '../content/ausbildung'
import { LAST_PATH_KEY } from '../home/lastPath'
import { FULL, SHORT } from '../home/flight'

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1 }
const Where = () => <output data-testid="where">{useLocation().pathname}</output>

function renderHome(profile: Record<string, unknown> = PROFILE) {
  return renderAt('/', profile)
}

function renderAt(path: string, profile: Record<string, unknown> = PROFILE) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(profile))
  return render(
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <ProgressProvider>
            <LessonsProvider>
              <WordsProvider>
              <MemoryRouter initialEntries={[path]}>
                <AppRoutes />
                <Where />
              </MemoryRouter>
              </WordsProvider>
            </LessonsProvider>
          </ProgressProvider>
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const continueLink = () => screen.queryByRole('link', { name: /^Davom etish/ })

describe('Bosh sahifa', () => {
  it('hero: logotip (soʻzsiz), sozlamalar, xarita aria-hidden, sarlavha h1', () => {
    renderHome()
    expect(screen.getByTestId('logo')).toBeTruthy()
    expect(screen.queryByText('Qaldirgʻoch')).toBeNull()
    expect(screen.getByRole('link', { name: 'Sozlamalar' }).getAttribute('href')).toBe('/sozlamalar')
    expect(screen.getByTestId('world-map').getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByRole('heading', { level: 1, name: 'Oʻzbekistondan chet elga, faqat qonuniy yoʻl bilan' })).toBeTruthy()
  })
  it('4 ta davlat kartasi; ochiq yoʻllar soni hisoblanadi, yopiqlar "Tez orada"', () => {
    renderHome()
    const list = screen.getByRole('heading', { level: 2, name: 'Qaysi davlatga?' }).nextElementSibling as HTMLElement
    const cards = within(list).getAllByRole('link')
    expect(cards).toHaveLength(COUNTRIES.length)
    const de = COUNTRIES.find((c) => c.id === 'de')!
    const n = de.programs.filter((p) => p.status === 'open').length
    expect(n).toBeGreaterThan(0)
    expect(within(list).getByRole('link', { name: new RegExp(`Germaniya.*${n} ta yoʻl ochiq`) }).getAttribute('href')).toBe('/yol/de')
    expect(within(list).getAllByText('Tez orada')).toHaveLength(COUNTRIES.filter((c) => c.status !== 'open').length)
    expect(within(list).getByRole('link', { name: /Yaponiya/ }).getAttribute('href')).toBe('/yol/jp')
  })
  it('davlat kartasi /yol/:country ga olib boradi', () => {
    renderHome()
    fireEvent.click(screen.getByRole('link', { name: /Janubiy Koreya/ }))
    expect(screen.getByTestId('where').textContent).toBe('/yol/kr')
  })
  it('agentlik kartasi /xavfsizlik/agentlik ga', () => {
    renderHome()
    const a = screen.getByRole('link', { name: /Agentlikni rasmiy reestrdan tekshiring/ })
    expect(a.getAttribute('href')).toBe('/xavfsizlik/agentlik')
  })
  it('eski kartalar (nemis tili, yoʻl, taklif) yoʻq', () => {
    renderHome()
    expect(screen.queryByText(/Nemis tili/)).toBeNull()
    expect(screen.queryByText(/Yoʻlingiz:/)).toBeNull()
    expect(screen.queryByText(/Taklif oldingizmi/)).toBeNull()
  })
  it('lastPath ham, progress ham yoʻq — "Davom etish" yoʻq', () => {
    renderHome()
    expect(continueLink()).toBeNull()
  })
  it('lastPath Ausbildung — qadamlar soni bilan, yoʻl xaritasiga olib boradi', () => {
    localStorage.setItem(LAST_PATH_KEY, JSON.stringify({ country: 'de', program: 'ausbildung' }))
    renderHome()
    const a = continueLink()!
    expect(a.textContent).toContain('Germaniya · Ausbildung · 2/10')
    fireEvent.click(a)
    expect(screen.getByTestId('where').textContent).toBe('/yol/de/ausbildung')
  })
  it('boshqa yoʻl — "x/y" koʻrsatilmaydi, kirish sahifasiga olib boradi', () => {
    localStorage.setItem(LAST_PATH_KEY, JSON.stringify({ country: 'de', program: 'chancenkarte' }))
    renderHome()
    const a = continueLink()!
    expect(a.textContent).toContain('Germaniya · Chancenkarte')
    expect(a.textContent).not.toMatch(/\d+\/\d+/)
    expect(a.getAttribute('href')).toBe('/yol/de/chancenkarte/kirish')
  })
  it('notoʻgʻri lastPath eʼtiborsiz qoldiriladi', () => {
    localStorage.setItem(LAST_PATH_KEY, '{buzilgan')
    renderHome()
    expect(continueLink()).toBeNull()
  })
  it('progress bor, lastPath yoʻq — Ausbildung', () => {
    const task = AUSBILDUNG_STEPS.find((s) => !AUTO_DONE_STEPS.includes(s.id) && s.tasks.length)!.tasks[0]
    localStorage.setItem('qaldirgoch.progress', JSON.stringify({ [task.id]: '2026-11-01T00:00:00.000Z' }))
    renderHome()
    expect(continueLink()!.getAttribute('href')).toBe('/yol/de/ausbildung')
  })
  it('yoʻl xaritasi va kirish sahifasi ochilganda lastPath yoziladi', () => {
    renderAt('/yol/de/ausbildung')
    expect(JSON.parse(localStorage.getItem(LAST_PATH_KEY)!)).toEqual({ country: 'de', program: 'ausbildung' })
    cleanup()
    renderAt('/yol/de/oqish/kirish')
    expect(JSON.parse(localStorage.getItem(LAST_PATH_KEY)!)).toEqual({ country: 'de', program: 'oqish' })
  })
})

describe('davlat kartasi: oʻtish animatsiyasi', () => {
  const animate = vi.fn(() => ({ cancel: vi.fn() }))
  const where = () => screen.getByTestId('where').textContent
  const card = (name: RegExp) => within(screen.getByRole('heading', { level: 2, name: 'Qaysi davlatga?' }).nextElementSibling as HTMLElement).getByRole('link', { name })
  const stubMotion = (reduce: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }))

  beforeEach(() => {
    vi.useFakeTimers()
    animate.mockClear()
    Object.defineProperty(Element.prototype, 'animate', { value: animate, configurable: true, writable: true })
    stubMotion(false)
  })
  afterEach(() => {
    vi.useRealTimers()
    delete (Element.prototype as { animate?: unknown }).animate
  })

  it('birinchi marta: toʻliq animatsiya, tugagach /yol/:country ga', () => {
    renderHome()
    fireEvent.click(card(/Janubiy Koreya/))
    expect(screen.getByTestId('flight')).toBeTruthy()
    expect(screen.getByTestId('swallow')).toBeTruthy() // haqiqiy qaldirgʻoch uchadi
    expect(where()).toBe('/')
    act(() => vi.advanceTimersByTime(FULL.navAt - 1))
    expect(where()).toBe('/')
    act(() => vi.advanceTimersByTime(1))
    expect(where()).toBe('/yol/kr')
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.queryByTestId('flight')).toBeNull() // overlay olib tashlandi
    expect(animate).toHaveBeenCalled()
    expect(localStorage.getItem('qaldirgoch.countryFlightSeen')).toBe('1')
  })

  it('keyingi safar: qisqa (faqat tunnel)', () => {
    localStorage.setItem('qaldirgoch.countryFlightSeen', '1')
    renderHome()
    fireEvent.click(card(/Germaniya/))
    expect(screen.queryByTestId('swallow')).toBeNull()
    act(() => vi.advanceTimersByTime(SHORT.navAt))
    expect(where()).toBe('/yol/de')
  })

  it('reduced-motion: animatsiyasiz darhol oʻtadi', () => {
    stubMotion(true)
    renderHome()
    fireEvent.click(card(/Yaponiya/))
    expect(where()).toBe('/yol/jp')
    expect(screen.queryByTestId('flight')).toBeNull()
    expect(localStorage.getItem('qaldirgoch.countryFlightSeen')).toBeNull()
  })

  it('ikki marta bosish bloklanadi: faqat birinchisi', () => {
    renderHome()
    fireEvent.click(card(/Germaniya/))
    fireEvent.click(card(/Germaniya/))
    fireEvent.click(card(/Buyuk Britaniya/))
    expect(screen.getAllByTestId('flight')).toHaveLength(1)
    act(() => vi.advanceTimersByTime(FULL.navAt + 2000))
    expect(where()).toBe('/yol/de')
  })
})
