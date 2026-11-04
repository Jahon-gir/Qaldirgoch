// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { LessonsProvider } from '../german/LessonsProvider'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { InstallProvider } from './InstallProvider'
import { useInstall } from './useInstall'

const wrapper = ({ children }: { children: ReactNode }) => <InstallProvider>{children}</InstallProvider>

function promptEvent(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & { prompt: ReturnType<typeof vi.fn>; userChoice: Promise<{ outcome: string }> }
  e.prompt = vi.fn(() => Promise.resolve())
  e.userChoice = Promise.resolve({ outcome })
  return e
}
const standalone = (matches: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: matches && q.includes('standalone'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }))

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  Object.defineProperty(navigator, 'standalone', { value: undefined, configurable: true })
})

describe('useInstall', () => {
  it('boshida: oʻrnatilmagan, oyna tayyor emas', () => {
    const { result } = renderHook(() => useInstall(), { wrapper })
    expect(result.current).toMatchObject({ installed: false, canPrompt: false })
  })

  it('beforeinstallprompt kelganda canPrompt true va hodisa bekor qilinadi (preventDefault)', () => {
    const { result } = renderHook(() => useInstall(), { wrapper })
    const e = promptEvent()
    act(() => void window.dispatchEvent(e))
    expect(e.defaultPrevented).toBe(true)
    expect(result.current.canPrompt).toBe(true)
  })

  it('install() prompt() ni chaqiradi, natijani kutadi va hodisani tozalaydi', async () => {
    const { result } = renderHook(() => useInstall(), { wrapper })
    const e = promptEvent()
    act(() => void window.dispatchEvent(e))
    await act(async () => {
      await result.current.install()
    })
    expect(e.prompt).toHaveBeenCalledTimes(1)
    expect(result.current.canPrompt).toBe(false)
    await act(async () => {
      await result.current.install() // hodisa yoʻq — hech narsa qilmaydi
    })
    expect(e.prompt).toHaveBeenCalledTimes(1)
  })

  it('prompt() xato bersa ham ilova qulamaydi', async () => {
    const { result } = renderHook(() => useInstall(), { wrapper })
    const e = promptEvent()
    e.prompt = vi.fn(() => Promise.reject(new Error('x')))
    act(() => void window.dispatchEvent(e))
    await act(async () => {
      await result.current.install()
    })
    expect(result.current.canPrompt).toBe(false)
  })

  it('standalone rejimda installed true', () => {
    standalone(true)
    expect(renderHook(() => useInstall(), { wrapper }).result.current.installed).toBe(true)
  })

  it('iOS navigator.standalone === true boʻlsa installed true', () => {
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true })
    expect(renderHook(() => useInstall(), { wrapper }).result.current.installed).toBe(true)
  })

  it('appinstalled hodisasida installed true, canPrompt false', () => {
    const { result } = renderHook(() => useInstall(), { wrapper })
    act(() => void window.dispatchEvent(promptEvent()))
    act(() => void window.dispatchEvent(new Event('appinstalled')))
    expect(result.current).toMatchObject({ installed: true, canPrompt: false })
  })
})

/* ---------- Sozlamalar va koʻrsatma ekrani ---------- */

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1 }
const Where = () => <output data-testid="where">{useLocation().pathname}</output>
const where = () => screen.getByTestId('where').textContent

function renderApp(path: string, lang?: string) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(PROFILE))
  if (lang) localStorage.setItem('qaldirgoch.lang', lang)
  return render(
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <ProgressProvider>
            <LessonsProvider>
              <InstallProvider>
                <MemoryRouter initialEntries={[path]}>
                  <AppRoutes />
                  <Where />
                </MemoryRouter>
              </InstallProvider>
            </LessonsProvider>
          </ProgressProvider>
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

describe('Sozlamalar: Telefonga oʻrnatish qatori', () => {
  it('oʻrnatilgan boʻlsa qator yoʻq', () => {
    standalone(true)
    renderApp('/sozlamalar')
    expect(screen.getByRole('link', { name: 'Profil' })).toBeTruthy()
    expect(screen.queryByText('Telefonga oʻrnatish')).toBeNull()
  })

  it('brauzer oynasi tayyor boʻlsa: bosilganda prompt() chaqiriladi, marshrut oʻzgarmaydi', async () => {
    renderApp('/sozlamalar')
    const e = promptEvent()
    act(() => void window.dispatchEvent(e))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Telefonga oʻrnatish' }))
    })
    expect(e.prompt).toHaveBeenCalledTimes(1)
    expect(where()).toBe('/sozlamalar')
  })

  it('aks holda koʻrsatma ekraniga oʻtadi; orqaga qaytadi', () => {
    renderApp('/sozlamalar')
    fireEvent.click(screen.getByRole('link', { name: 'Telefonga oʻrnatish' }))
    expect(where()).toBe('/sozlamalar/ornatish')
    expect(screen.getByRole('heading', { level: 1, name: 'Telefonga oʻrnatish' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Orqaga' }))
    expect(where()).toBe('/sozlamalar')
    expect(screen.getByRole('heading', { level: 1, name: 'Sozlamalar' })).toBeTruthy()
  })
})

describe('Koʻrsatma ekrani', () => {
  it('lotin: 3 qadam', () => {
    renderApp('/sozlamalar/ornatish')
    expect(screen.getByText('Ilova bosh ekranda ikonka boʻlib turadi va tezroq ochiladi.')).toBeTruthy()
    const steps = within(screen.getByRole('main')).getAllByRole('listitem')
    expect(steps).toHaveLength(3)
    expect(steps[0].textContent).toContain('Havolani Safari brauzerida oching.')
    expect(steps[1].textContent).toContain('Pastdagi Ulashish tugmasini bosing')
    expect(steps[1].querySelector('strong')?.textContent).toBe('Ulashish')
    expect(steps[1].querySelector('svg')).toBeTruthy()
    expect(steps[2].textContent).toContain('Bosh ekranga qoʻshish ni tanlang.')
    expect(steps[2].querySelector('strong')?.textContent).toBe('Bosh ekranga qoʻshish')
  })
  it('kirill: qoʻlda yozilgan matn', () => {
    renderApp('/sozlamalar/ornatish', 'uz-Cyrl')
    expect(screen.getByRole('heading', { level: 1, name: 'Телефонга ўрнатиш' })).toBeTruthy()
    const steps = within(screen.getByRole('main')).getAllByRole('listitem')
    expect(steps).toHaveLength(3)
    expect(steps[1].textContent).toContain('Пастдаги Улашиш тугмасини босинг')
    expect(steps[2].textContent).toContain('Бош экранга қўшиш ни танланг.')
  })
  it('rus: 3 qadam', () => {
    renderApp('/sozlamalar/ornatish', 'ru')
    const steps = within(screen.getByRole('main')).getAllByRole('listitem')
    expect(steps).toHaveLength(3)
    expect(steps[1].textContent).toContain('Нажмите кнопку Поделиться внизу')
    expect(steps[2].textContent).toContain('Выберите На экран «Домой».')
  })
  it('oʻrnatilgan boʻlsa ham ochiladi: "allaqachon oʻrnatilgan"', () => {
    standalone(true)
    renderApp('/sozlamalar/ornatish')
    expect(screen.getByText('Ilova allaqachon oʻrnatilgan.')).toBeTruthy()
    expect(within(screen.getByRole('main')).queryAllByRole('listitem')).toHaveLength(0)
  })
  it('Bosh sahifada oʻrnatish bilan bogʻliq hech narsa yoʻq', () => {
    renderApp('/')
    expect(screen.queryByText(/oʻrnatish/i)).toBeNull()
  })
})
