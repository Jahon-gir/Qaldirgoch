// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { InstallProvider } from '../pwa/InstallProvider'
import { LessonsProvider } from './LessonsProvider'
import { WordsProvider } from './WordsProvider'

// Haqiqiy kasbiy paketlar bilan
vi.unmock('../content/german/packs')

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'electrician', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1 }

function renderApp(path: string) {
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

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(PROFILE))
})
afterEach(() => cleanup())

describe('kasbiy soʻz kartasi', () => {
  it('xavfsizlik soʻzida "Xavfsizlik soʻzi" belgisi chiqadi', () => {
    renderApp('/til/dars/general-xavfsizlik-l1')
    expect(screen.getByRole('heading', { name: 'Vorsicht!' })).toBeTruthy()
    expect(screen.getByText('Xavfsizlik soʻzi')).toBeTruthy()
  })

  it('otda koʻplik shakli chiqadi, oddiy soʻzda xavfsizlik belgisi yoʻq', () => {
    renderApp('/til/dars/technical-asboblar-l1')
    expect(screen.getByRole('heading', { name: 'der Hammer' })).toBeTruthy()
    expect(screen.getByText('die Hämmer')).toBeTruthy()
    expect(screen.queryByText('Xavfsizlik soʻzi')).toBeNull()
  })
})
