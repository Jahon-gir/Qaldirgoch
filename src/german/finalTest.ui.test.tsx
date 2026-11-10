// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { LESSONS } from '../content/german'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { InstallProvider } from '../pwa/InstallProvider'
import type { Question } from './finalTest'
import { cleanText } from '../profile/sync'
import { LessonsProvider } from './LessonsProvider'
import { localDay } from './srs'
import { WordsProvider } from './WordsProvider'

// Savollar boshqariladigan boʻlsin: 2 soʻz (Test usuli) + gap-tanlash + gap-yozish (ß faqat "heiße" da)
const QS: Question[] = [
  { kind: 'word', method: 'test', wordId: 'a1-m1-hallo' },
  { kind: 'word', method: 'test', wordId: 'a1-m1-guten-tag' },
  { kind: 'gap', mode: 'choice', gapId: 'g3' },
  { kind: 'gap', mode: 'write', gapId: 'g2' }
]
vi.mock('./finalTest', async (orig) => ({ ...(await orig<typeof import('./finalTest')>()), buildTest: vi.fn(() => QS) }))

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1, dailyGoal: 2 }
const NOW = '2026-11-01T00:00:00.000Z'
const TODAY = localDay()
const M1 = LESSONS.filter((l) => l.moduleId === 'a1-m1').map((l) => l.id)
const done = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { lessonId: id, score: 1, total: 1, completedAt: NOW }]))
const Where = () => <output data-testid="where">{useLocation().pathname}</output>
const where = () => screen.getByTestId('where').textContent
const stored = (k: string) => JSON.parse(localStorage.getItem(`qaldirgoch.${k}`) ?? 'null')
const activityToday = () => stored('activity')?.[TODAY]?.count ?? 0
/** Javob xabari (<output> ham status rolida boʻlgani uchun faqat <p>). */
const verdict = () => screen.getAllByRole('status').find((el) => el.tagName === 'P')?.textContent
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

function seed(lessons: string[] = M1) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(PROFILE))
  localStorage.setItem('qaldirgoch.lessons', JSON.stringify(done(lessons)))
}
function renderApp(path: string) {
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

let spoken: string[]
beforeEach(() => {
  localStorage.clear()
  spoken = []
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('speechSynthesis', { getVoices: () => [{ lang: 'de-DE', name: 'de' }], speak: (u: { text: string }) => spoken.push(u.text), cancel: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() })
  vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; lang = ''; rate = 1; voice: unknown; constructor(t: string) { this.text = t } })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** Joriy Test savoliga javob: toʻgʻri yoki xato variant. */
function answerWord(tr: string, right: boolean) {
  const group = screen.getByRole('group', { name: 'Bu soʻz nima degani?' })
  fireEvent.click(within(group).getAllByRole('button').find((b) => (b.textContent === tr) === right)!)
  click('Davom etish')
}
function playAll({ firstRight = true } = {}) {
  click('Testni boshlash')
  expect(screen.getByText('1/4')).toBeTruthy()
  answerWord('Salom', firstRight)
  answerWord('Xayrli kun', true)
  // gap-tanlash: ovoz tugmasi javobdan oldin yoʻq
  expect(screen.queryByRole('button', { name: 'Gapni tinglash' })).toBeNull()
  fireEvent.click(within(screen.getByRole('group', { name: 'Boʻsh joyga mos soʻzni tanlang' })).getByRole('button', { name: 'Morgen' }))
  click('Gapni tinglash')
  expect(spoken[spoken.length - 1]).toBe('Guten Morgen, Frau Schmidt!')
  click('Davom etish')
  // gap-yozish: accept dagi "bin" ham toʻgʻri
  fireEvent.change(screen.getByRole('textbox', { name: 'Nemischa javob' }), { target: { value: 'bin' } })
  click('Tekshirish')
  expect(verdict()).toBe('Toʻgʻri')
  click('Davom etish')
}

describe('kartochkalar va ochilish', () => {
  it('modul darslari tugamaguncha modul testi kartochkasi yoʻq; daraja testi qulf', () => {
    seed(M1.slice(0, 5))
    renderApp('/til/de')
    expect(screen.queryByText('1-modul yakuniy testi')).toBeNull()
    expect(screen.getByText('A1 daraja testi')).toBeTruthy()
    expect(screen.getByText('Barcha A1 modullari tugagach ochiladi')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /A1 daraja testi/ })).toBeNull()
  })

  it('6 dars tugagach: "1-modul yakuniy testi · Ochiq · 12 savol" (Til va modul ekranida); daraja testi baribir qulf (draft modul)', () => {
    seed()
    renderApp('/til/de')
    const card = screen.getByRole('link', { name: /1-modul yakuniy testi/ })
    expect(card.getAttribute('href')).toBe('/til/test/a1-m1')
    expect(within(card).getByText('Ochiq · 12 savol')).toBeTruthy()
    expect(screen.getByText('Barcha A1 modullari tugagach ochiladi')).toBeTruthy()
    cleanup()
    renderApp('/til/modul/a1-m1')
    expect(screen.getByRole('link', { name: /1-modul yakuniy testi/ })).toBeTruthy()
  })

  it('oʻtilgan boʻlsa: "Oʻtildi · 11/12"', () => {
    seed()
    localStorage.setItem('qaldirgoch.lessons', JSON.stringify({ ...done(M1), 'test:a1-m1': { lessonId: 'test:a1-m1', score: 11, total: 12, completedAt: NOW } }))
    renderApp('/til/de')
    expect(within(screen.getByRole('link', { name: /1-modul yakuniy testi/ })).getByText('Oʻtildi · 11/12')).toBeTruthy()
  })

  it('ochilmagan test manzili toʻgʻridan-toʻgʻri ochilsa — Til ekraniga; daraja testi ham', () => {
    seed(M1.slice(0, 2))
    renderApp('/til/test/a1-m1')
    expect(where()).toBe('/til/de')
    cleanup()
    seed()
    renderApp('/til/test/level-A1')
    expect(where()).toBe('/til/de')
    cleanup()
    renderApp('/til/test/yoq')
    expect(where()).toBe('/til/de')
  })
})

describe('kirish ekrani va savollar', () => {
  it('sarlavha, "Savollar 12", "Oʻtish uchun 11 ta toʻgʻri", qayta topshirish matni, pastki menyu yoʻq', () => {
    seed()
    renderApp('/til/test/a1-m1')
    expect(screen.getByRole('heading', { level: 1, name: '1-modul yakuniy testi' })).toBeTruthy()
    expect(screen.getByText('Salomlashish va tanishuv')).toBeTruthy()
    expect(screen.getByText('Savollar').nextElementSibling?.textContent).toBe('12')
    expect(screen.getByText('Oʻtish uchun').nextElementSibling?.textContent).toBe('11')
    expect(screen.getByText('ta toʻgʻri')).toBeTruthy()
    expect(screen.getByText('Istalgancha qayta topshirish mumkin')).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: /menyu/i })).toBeNull()
  })

  it('gap-yozish: ß tugmasi faqat "heiße" javobida (boshqa harf yoʻq)', () => {
    seed()
    renderApp('/til/test/a1-m1')
    click('Testni boshlash')
    answerWord('Salom', true)
    answerWord('Xayrli kun', true)
    fireEvent.click(screen.getByRole('button', { name: 'Morgen' }))
    click('Davom etish')
    expect(screen.getAllByRole('button', { name: /harfini qoʻyish/ }).map((b) => b.textContent)).toEqual(['ß'])
    expect(screen.queryByRole('button', { name: 'Gapni tinglash' })).toBeNull()
    fireEvent.change(screen.getByRole('textbox', { name: 'Nemischa javob' }), { target: { value: 'heisse' } })
    click('Tekshirish')
    expect(verdict()).toBe('Toʻgʻri. Asl yozilishi: heiße')
    expect(screen.getByRole('button', { name: 'Gapni tinglash' })).toBeTruthy()
  })

  it('oʻrtada chiqish: "Testdan chiqasizmi? Natija saqlanmaydi"; chiqilsa kunlik maqsad +1 yoʻq, natija saqlanmaydi', () => {
    seed()
    renderApp('/til/test/a1-m1')
    click('Testni boshlash')
    answerWord('Salom', true)
    click('Testdan chiqish')
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Testdan chiqasizmi?')).toBeTruthy()
    expect(screen.getByText('Natija saqlanmaydi.')).toBeTruthy()
    click('Qolish')
    expect(screen.queryByRole('dialog')).toBeNull()
    click('Testdan chiqish')
    click('Chiqish')
    expect(where()).toBe('/til/de')
    expect(activityToday()).toBe(0)
    expect(stored('lessons')['test:a1-m1']).toBeUndefined()
  })
})

describe('natija', () => {
  it('oʻtdi: "Modul yakunlandi", natija kartasi (mehmon — ismsiz), rasmiy sertifikat emas; saqlanadi; kunlik maqsad +1; SRS oʻzgarmaydi', () => {
    seed()
    renderApp('/til/test/a1-m1')
    const wordsBefore = localStorage.getItem('qaldirgoch.words')
    playAll()
    expect(screen.getByRole('heading', { name: 'Modul yakunlandi' })).toBeTruthy()
    expect(screen.getByText('4 savoldan 4 tasi toʻgʻri')).toBeTruthy()
    const card = screen.getByTestId('result-card')
    expect(within(card).getByText('Qaldirgʻoch · ilova ichidagi natija')).toBeTruthy()
    expect(within(card).getByText('1-modul yakuniy testi')).toBeTruthy()
    const line = `${TODAY.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3.$2.$1')} · 4/4`
    expect(within(card).getByText(line)).toBeTruthy()
    expect(card.textContent).not.toMatch(/Mehmon/)
    expect(screen.getByText('Bu rasmiy til sertifikati emas. Rasmiy imtihon: Goethe, telc yoki ÖSD.')).toBeTruthy()
    expect(screen.queryByText('Xato qilgan soʻzlaringiz takrorlashga qoʻshildi')).toBeNull()
    expect(stored('lessons')['test:a1-m1']).toMatchObject({ score: 4, total: 4 })
    expect(activityToday()).toBe(1)
    expect(localStorage.getItem('qaldirgoch.words')).toBe(wordsBefore)
  })

  it('oʻtmadi: kartochka YOʻQ, "4 ta kerak edi, sizda 3 ta", xato soʻz takrorlashga (interval 1); toʻgʻrilari oʻzgarmaydi; kunlik maqsad +1', () => {
    seed()
    renderApp('/til/test/a1-m1')
    const before = stored('words')
    playAll({ firstRight: false })
    expect(screen.queryByTestId('result-card')).toBeNull()
    expect(screen.queryByText(/rasmiy til sertifikati/)).toBeNull()
    expect(screen.getByText('Yana bir oz mashq qiling: 4 ta kerak edi, sizda 3 ta')).toBeTruthy()
    const added = screen.getByRole('region', { name: 'Xato qilgan soʻzlaringiz takrorlashga qoʻshildi' })
    expect(within(added).getByText('Hallo')).toBeTruthy()
    const after = stored('words')
    expect(after['a1-m1-hallo']).toMatchObject({ interval: 1, mistakes: (before['a1-m1-hallo']?.mistakes ?? 0) + 1 })
    expect(after['a1-m1-guten-tag']).toEqual(before['a1-m1-guten-tag'])
    expect(activityToday()).toBe(1)
    expect(stored('lessons')['test:a1-m1']).toMatchObject({ score: 3, total: 4 })
  })

  it('qayta topshirish: yangi urinish boshlanadi; eng yuqori natija qoladi', () => {
    seed()
    renderApp('/til/test/a1-m1')
    playAll({ firstRight: false })
    click('Qayta topshirish')
    expect(screen.getByText('1/4')).toBeTruthy()
    answerWord('Salom', true)
    answerWord('Xayrli kun', true)
    fireEvent.click(screen.getByRole('button', { name: 'Morgen' }))
    click('Davom etish')
    fireEvent.change(screen.getByRole('textbox', { name: 'Nemischa javob' }), { target: { value: 'heiße' } })
    click('Tekshirish')
    click('Davom etish')
    expect(stored('lessons')['test:a1-m1']).toMatchObject({ score: 4, total: 4 })
    expect(activityToday()).toBe(2)
    click('Til sahifasiga qaytish')
    expect(where()).toBe('/til/de')
  })
})

describe('ism', () => {
  it('ism tozalanadi (CLAUDE.md 3); ism boʻlmasa qator ismsiz', async () => {
    const { resultLine } = await import('./finalTest')
    expect(resultLine(cleanText('Ali <script>'), '06.11.2026', 11, 12)).toBe('Ali script · 06.11.2026 · 11/12')
    expect(resultLine(undefined, '06.11.2026', 11, 12)).toBe('06.11.2026 · 11/12')
    expect(resultLine(cleanText('   '), '06.11.2026', 11, 12)).toBe('06.11.2026 · 11/12')
  })
})
