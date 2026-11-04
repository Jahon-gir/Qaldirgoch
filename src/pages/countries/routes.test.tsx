// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../../App'
import { AuthProvider } from '../../auth/AuthProvider'
import { I18nProvider } from '../../i18n/I18nProvider'
import { LessonsProvider } from '../../german/LessonsProvider'
import { ProfileProvider } from '../../profile/ProfileProvider'
import { ProgressProvider } from '../../progress/ProgressProvider'

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1 }

function Where() {
  return <output data-testid="where">{useLocation().pathname}</output>
}

function renderApp(path: string, { lang, profile = PROFILE }: { lang?: string; profile?: Record<string, unknown> } = {}) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(profile))
  if (lang) localStorage.setItem('qaldirgoch.lang', lang)
  return render(
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <ProgressProvider>
            <LessonsProvider>
              <MemoryRouter initialEntries={[path]}>
                <AppRoutes />
                <Where />
              </MemoryRouter>
            </LessonsProvider>
          </ProgressProvider>
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
const where = () => screen.getByTestId('where').textContent
const h1 = (name: string) => expect(screen.getByRole('heading', { level: 1, name })).toBeTruthy()
const link = (name: string | RegExp) => fireEvent.click(screen.getByRole('link', { name }))
const savedProfile = () => JSON.parse(localStorage.getItem('qaldirgoch.profile')!)

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('marshrut: davlatlar → yoʻllar', () => {
  it('Bosh → Yoʻl menyusi → Davlatlar → Germaniya → Ausbildung → bosqich → orqaga', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderApp('/')
    link('Yoʻl') // pastki menyu — doim davlatlar roʻyxatiga
    expect(where()).toBe('/yol')
    h1('Qaysi davlatni tanlaysiz?')
    expect(screen.getByText('Faqat qonuniy, tekshirilgan yoʻllar')).toBeTruthy()
    link(/^Germaniya/)
    expect(where()).toBe('/yol/de')
    h1('Germaniya')
    expect(screen.getByText('Qaysi yoʻl bilan borasiz?')).toBeTruthy()
    link(/^Ausbildung/)
    expect(where()).toBe('/yol/de/ausbildung')
    h1('Sizning yoʻlingiz')
    link(/^8Viza/)
    expect(where()).toBe('/yol/de/ausbildung/viza')
    h1('Viza')
    link('Orqaga')
    expect(where()).toBe('/yol/de/ausbildung')
    h1('Sizning yoʻlingiz')
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('Davlatlar → Koreya → orqaga; "oʻtish" tugmasi yoʻq; yopiq davlat tanlovni oʻzgartirmaydi', () => {
    renderApp('/yol')
    expect(savedProfile().selectedCountry).toBeUndefined()
    link(/^Janubiy Koreya/)
    expect(where()).toBe('/yol/kr')
    h1('Janubiy Koreya')
    expect(screen.getByText('Keyingi versiyada ochiladi')).toBeTruthy()
    expect(screen.getByText('EPS davlatlararo dastur. «Tez joylashtiramiz» degan xususiy vositachilarga ishonmang.')).toBeTruthy()
    expect(screen.getByText('Yoʻl xaritasi, til kursi va talablar hali tekshirilmoqda')).toBeTruthy()
    expect(savedProfile().selectedCountry).toBeUndefined()
    expect(screen.queryByRole('link', { name: 'Germaniyaga oʻtish' })).toBeNull()
    link('Davlatlar') // orqaga strelka
    expect(where()).toBe('/yol')
    h1('Qaysi davlatni tanlaysiz?')
  })

  it('yopiq davlat bosilganda profildagi tanlov oʻzgarmaydi (oldindan Germaniya)', () => {
    renderApp('/yol', { profile: { ...PROFILE, selectedCountry: 'de' } })
    for (const name of [/^Yaponiya/, /^Buyuk Britaniya/]) {
      link(name)
      expect(screen.getByText('Keyingi versiyada ochiladi')).toBeTruthy()
      link(/Davlatlar/)
      expect(savedProfile().selectedCountry).toBe('de')
    }
    link(/^Yaponiya/)
    expect(screen.queryByText('Yoʻl xaritasi, til kursi va talablar hali tekshirilmoqda')).toBeNull()
  })

  it('Germaniya → Chancenkarte → orqaga; "oʻtish" tugmasi yoʻq; rasmiy havola xavfsiz', () => {
    renderApp('/yol/de')
    link(/^Chancenkarte/)
    expect(where()).toBe('/yol/de/chancenkarte')
    h1('Chancenkarte')
    expect(screen.getByTestId('source').textContent).toBe('Manba: make-it-in-germany.com · tekshirilgan: 2026-11-04')
    const a = screen.getByRole('link', { name: /Rasmiy sahifani ochish/ }) as HTMLAnchorElement
    expect(a.href).toBe('https://www.make-it-in-germany.com/en/for-qualified-professionals/visa/kinds-of-visa')
    expect(a.target).toBe('_blank')
    expect(a.rel).toContain('noopener')
    expect(screen.queryByRole('link', { name: 'Ausbildung yoʻliga oʻtish' })).toBeNull()
    link('Orqaga')
    expect(where()).toBe('/yol/de')
    h1('Germaniya')
  })

  it('Koreya yoʻli tafsiloti: gov.uz manbasi va tekshiruvda belgisi', () => {
    renderApp('/yol/kr/eps')
    h1('EPS (E-9 viza)')
    expect(screen.getByTestId('source').textContent).toBe('Manba: gov.uz · tekshirilgan: 2026-11-04')
    expect(screen.getByText('Tekshiruvda')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Germaniyaga oʻtish' })).toBeNull()
    link('Orqaga')
    expect(where()).toBe('/yol/kr')
    h1('Janubiy Koreya')
  })

  it('eski havolalar yangi manzilga oʻtadi; notanish manzil boʻsh ekran bermaydi', () => {
    renderApp('/yol/viza')
    expect(where()).toBe('/yol/de/ausbildung/viza')
    h1('Viza')
    cleanup()
    for (const [from, to, title] of [
      ['/yol/yoq', '/yol', 'Qaysi davlatni tanlaysiz?'],
      ['/yol/de/yoq', '/yol/de', 'Germaniya'],
      ['/yol/yoq/yoq', '/yol', 'Qaysi davlatni tanlaysiz?'],
      ['/yol/de/chancenkarte/viza', '/yol', 'Qaysi davlatni tanlaysiz?'],
      ['/yol/a/b/c/d', '/yol', 'Qaysi davlatni tanlaysiz?']
    ] as const) {
      renderApp(from)
      expect(where(), from).toBe(to)
      h1(title)
      cleanup()
    }
  })

  it('kirill interfeysda davlatlar roʻyxati', () => {
    renderApp('/yol', { lang: 'uz-Cyrl' })
    expect(screen.getByRole('link', { name: /^Германия/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /^Жанубий Корея/ })).toBeTruthy()
  })

  it('ochiq davlatni bosish tanlovni saqlaydi', () => {
    renderApp('/yol')
    link(/^Germaniya/)
    expect(where()).toBe('/yol/de')
  })
})
