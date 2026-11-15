// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { InstallProvider } from '../pwa/InstallProvider'
import { DE_COURSE } from '../lang/de'
import { KO_COURSE } from '../lang/ko'
import { ALL_RESULT_IDS, courseIdOfLesson } from '../lang/registry'
import { buildTest, fieldScope, isScopeUnlocked, isTestId, passMark, scopeInfo, testId, testParts, testSize } from './finalTest'
import { lessonsOf } from './logic'
import { LessonsProvider } from './LessonsProvider'
import { WordsProvider } from './WordsProvider'

// Haqiqiy paketlar bilan (setup'dagi oʻchirishni bekor qilamiz)
vi.unmock('../content/german/packs')

const NOW = '2026-11-01T00:00:00.000Z'
const careModules = DE_COURSE.modules.filter((m) => m.direction === 'care')
const careLessons = careModules.flatMap((m) => lessonsOf(m.id, DE_COURSE.lessons).map((l) => l.id))
const done = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { lessonId: id, score: 1, total: 1, completedAt: NOW }]))

describe('soha yakuniy testi (mantiq)', () => {
  it('scope "field-care": sohaning barcha vaziyatlari, 20 soʻz savoli', () => {
    const info = scopeInfo(fieldScope('care'), 'technical', DE_COURSE)!
    expect(info.type).toBe('field')
    expect(info.field).toBe('care')
    expect(info.moduleIds.sort()).toEqual(careModules.map((m) => m.id).sort())
    expect(testParts(info)).toEqual({ words: 20, gaps: 0 })
    expect(testSize(info)).toBe(20)
    expect(passMark(20)).toBe(19)
  })

  it('umumiy, nomaʼlum soha va koreys kursida soha testi yoʻq', () => {
    expect(scopeInfo(fieldScope('general'), 'general', DE_COURSE)).toBeNull()
    expect(scopeInfo('field-xyz', 'general', DE_COURSE)).toBeNull()
    expect(scopeInfo(fieldScope('care'), 'general', KO_COURSE)).toBeNull()
  })

  it('savollar turli vaziyatlardan, takrorlanmaydi, faqat shu sohadan', () => {
    const info = scopeInfo(fieldScope('care'), 'care', DE_COURSE)!
    const qs = buildTest(info, { canListen: true, seed: 7, course: DE_COURSE })
    expect(qs).toHaveLength(20)
    const ids = qs.map((q) => (q.kind === 'word' ? q.wordId : ''))
    expect(new Set(ids).size).toBe(20)
    const mods = new Set(ids.map((id) => DE_COURSE.wordById(id)!.moduleId))
    for (const m of mods) expect(m.startsWith('care-')).toBe(true)
    expect(mods.size).toBeGreaterThan(5)
  })

  it('barcha vaziyat darslari tugagach ochiladi', () => {
    const info = scopeInfo(fieldScope('care'), 'care', DE_COURSE)!
    expect(isScopeUnlocked(info, done(careLessons.slice(1)))).toBe(false)
    expect(isScopeUnlocked(info, done(careLessons))).toBe(true)
  })

  it('natija id "test:field-<soha>" saqlanadi (nemis kursi), umumiy uchun yoʻq', () => {
    for (const d of DE_COURSE.directions!.filter((x) => x !== 'general')) {
      expect(ALL_RESULT_IDS.has(testId(fieldScope(d)))).toBe(true)
      expect(isTestId(testId(fieldScope(d)))).toBe(true)
    }
    expect(ALL_RESULT_IDS.has('test:field-general')).toBe(false)
    expect(courseIdOfLesson('test:field-care')).toBe('de')
    expect(testId(fieldScope('agriculture')).length).toBeLessThanOrEqual(64)
  })
})

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'nurse', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: NOW, schemaVersion: 1, dailyGoal: 2 }
const Where = () => <output data-testid="where">{useLocation().pathname}</output>

function renderApp(path: string, lessons: string[]) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(PROFILE))
  localStorage.setItem('qaldirgoch.lessons', JSON.stringify(done(lessons)))
  return render(
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <ProgressProvider>
            <LessonsProvider>
              <WordsProvider>
                <InstallProvider>
                  <MemoryRouter initialEntries={['/til/de', path]} initialIndex={1}>
                    <AppRoutes />
                    <Where />
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
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('soha yakuniy testi (ekran)', () => {
  it('kasb sahifasida qulfli kartochka; test manzili ochilmaguncha qaytaradi', () => {
    renderApp('/til/kasblar/care', [])
    expect(screen.getByRole('heading', { name: 'Yakuniy test' })).toBeTruthy()
    expect(screen.getByText('Shu sohaning barcha vaziyatlari tugagach ochiladi')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Soha yakuniy testi/ })).toBeNull()
    cleanup()
    renderApp('/til/test/field-care', [])
    expect(screen.getByTestId('where').textContent).toBe('/til/de')
  })

  it('hamma vaziyat tugagach: ochiq kartochka → test sahifasi (20 savol, 19 ta toʻgʻri)', () => {
    renderApp('/til/kasblar/care', careLessons)
    fireEvent.click(screen.getByRole('link', { name: /Soha yakuniy testi/ }))
    expect(screen.getByTestId('where').textContent).toBe('/til/test/field-care')
    expect(screen.getByText('Parvarish va tibbiyot')).toBeTruthy()
    expect(screen.getByText('20')).toBeTruthy()
    expect(screen.getByText('19')).toBeTruthy()
    expect(screen.getByText(/Har savolga bir marta javob beriladi/).textContent).not.toMatch(/Gap savollari/)
  })
})
