// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { LessonsProvider } from '../german/LessonsProvider'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1 }
const Where = () => <output data-testid="where">{useLocation().pathname}</output>

function renderHome(profile: Record<string, unknown> = PROFILE) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(profile))
  return render(
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <ProgressProvider>
            <LessonsProvider>
              <MemoryRouter initialEntries={['/']}>
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

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Bosh sahifa', () => {
  it('logotip, salomlashuv va kasb bor; davlat belgisi yoʻq', () => {
    renderHome()
    expect(screen.getByTestId('logo')).toBeTruthy()
    expect(screen.getByText('Xush kelibsiz')).toBeTruthy()
    expect(screen.getByText('Kasb: Payvandchi')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Tanlangan davlat/ })).toBeNull()
    expect(screen.queryByText('Germaniya')).toBeNull()
    expect(screen.getByRole('link', { name: 'Sozlamalar' })).toBeTruthy()
  })
  it('"Qaldirgʻoch" faqat sr-only h1 da, koʻrinadigan sarlavha emas', () => {
    renderHome()
    const h1 = screen.getByRole('heading', { level: 1, name: 'Qaldirgʻoch' })
    expect(h1.className).toContain('sr-only')
    expect(screen.getAllByText('Qaldirgʻoch')).toHaveLength(1)
  })
  it('"Boshqa" kasb matnsiz boʻlsa kasb koʻrsatilmaydi', () => {
    renderHome({ ...PROFILE, profession: 'other' })
    expect(screen.queryByText(/^Kasb:/)).toBeNull()
  })
  it('Yoʻl kartasi Ausbildung xaritasiga olib boradi', () => {
    renderHome()
    fireEvent.click(screen.getByRole('link', { name: /Yoʻlingiz: 2 \/ 10 bosqich/ }))
    expect(screen.getByTestId('where').textContent).toBe('/yol/de/ausbildung')
    expect(screen.getByRole('heading', { level: 1, name: 'Sizning yoʻlingiz' })).toBeTruthy()
  })
  it('xavfsizlik kartasi bor', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /Taklif oldingizmi\?/ })).toBeTruthy()
  })
})
