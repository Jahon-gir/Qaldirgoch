// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'
import { LESSONS } from '../content/german'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { InstallProvider } from '../pwa/InstallProvider'
import type { Question } from './finalTest'
import { LessonsProvider } from './LessonsProvider'
import { WordsProvider } from './WordsProvider'

// Kirgan foydalanuvchi (Supabase sozlanmagan — sinxron ishlamaydi), ismida HTML bor
vi.mock('../auth/AuthProvider', async (orig) => ({
  ...(await orig<typeof import('../auth/AuthProvider')>()),
  useAuth: () => ({ status: 'signedIn', user: { id: 'u1', name: 'Jahongir <img src=x onerror=alert(1)>' }, configured: false, signInWithGoogle: async () => false, signOut: async () => undefined })
}))
const QS: Question[] = [{ kind: 'word', method: 'test', wordId: 'a1-m1-hallo' }]
vi.mock('./finalTest', async (orig) => ({ ...(await orig<typeof import('./finalTest')>()), buildTest: vi.fn(() => QS) }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('natija kartasi: kirgan foydalanuvchi ismi', () => {
  it('ism tozalanib chiqadi, HTML element yaratilmaydi', () => {
    vi.stubGlobal('scrollTo', vi.fn())
    localStorage.clear()
    localStorage.setItem('qaldirgoch.onboarded', '1')
    localStorage.setItem('qaldirgoch.profile', JSON.stringify({ ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1 }))
    localStorage.setItem('qaldirgoch.lessons', JSON.stringify(Object.fromEntries(LESSONS.filter((l) => l.moduleId === 'a1-m1').map((l) => [l.id, { lessonId: l.id, score: 1, total: 1, completedAt: '2026-11-01T00:00:00.000Z' }]))))
    render(
      <I18nProvider>
        <ProfileProvider>
          <ProgressProvider>
            <LessonsProvider>
              <WordsProvider>
                <InstallProvider>
                  <MemoryRouter initialEntries={['/til', '/til/test/a1-m1']} initialIndex={1}>
                    <AppRoutes />
                  </MemoryRouter>
                </InstallProvider>
              </WordsProvider>
            </LessonsProvider>
          </ProgressProvider>
        </ProfileProvider>
      </I18nProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Testni boshlash' }))
    fireEvent.click(within(screen.getByRole('group', { name: 'Bu soʻz nima degani?' })).getByRole('button', { name: 'Salom' }))
    fireEvent.click(screen.getByRole('button', { name: 'Davom etish' }))
    const card = screen.getByTestId('result-card')
    expect(card.textContent).toMatch(/^.*Jahongir img src=x onerror=alert\(1\) · \d{2}\.\d{2}\.\d{4} · 1\/1$/)
    expect(card.querySelector('img')).toBeNull()
  })
})
