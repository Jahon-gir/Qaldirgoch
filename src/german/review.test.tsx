// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { wordById } from '../content/german/words'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { RIGHT_ADVANCE_MS } from '../pages/german/ReviewPage'
import { InstallProvider } from '../pwa/InstallProvider'
import { LessonsProvider } from './LessonsProvider'
import { addDays, localDay, type Words } from './srs'
import { WordsProvider } from './WordsProvider'

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1 }
const NOW = '2026-11-01T00:00:00.000Z'
const Where = () => <output data-testid="where">{useLocation().pathname}</output>
let goBack: (() => void) | null = null
/** Telefonning "orqaga" tugmasi: tarixda bir qadam orqaga. */
function BackKey() {
  const nav = useNavigate()
  goBack = () => nav(-1)
  return null
}

function seed({ words = {}, activity = {}, profile = PROFILE }: { words?: Words; activity?: Record<string, unknown>; profile?: Record<string, unknown> } = {}) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(profile))
  localStorage.setItem('qaldirgoch.words', JSON.stringify(words))
  localStorage.setItem('qaldirgoch.activity', JSON.stringify(activity))
}

function renderApp(path: string | string[], lang?: string) {
  if (lang) localStorage.setItem('qaldirgoch.lang', lang)
  return render(
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <ProgressProvider>
            <LessonsProvider>
              <WordsProvider>
                <InstallProvider>
                  <MemoryRouter initialEntries={Array.isArray(path) ? path : [path]} initialIndex={Array.isArray(path) ? path.length - 1 : 0}>
                    <AppRoutes />
                    <Where />
                    <BackKey />
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

const TODAY = localDay()
const due = (interval = 3, mistakes = 0) => ({ due: TODAY, interval, mistakes, updatedAt: NOW })
const WORDS3: Words = { 'a1-m1-hallo': due(3), 'a1-m1-guten-tag': due(7), 'a1-m1-der-koch': due(1, 1) }
const stored = (): Words => JSON.parse(localStorage.getItem('qaldirgoch.words')!)
const activityToday = () => JSON.parse(localStorage.getItem('qaldirgoch.activity')!)[TODAY]?.count ?? 0
const where = () => screen.getByTestId('where').textContent

/** Joriy savoldagi soʻz va variantlar. */
function currentWord() {
  const de = screen.getByRole('heading', { level: 1 }).textContent!
  const w = [...Object.keys(WORDS3), 'a1-m1-guten-morgen', 'a1-m1-tschuess'].map(wordById).find((x) => x?.de === de)!
  const group = screen.getByRole('group', { name: 'Bu soʻz nima degani?' })
  return { w, buttons: within(group).getAllByRole('button') }
}
function answer(right: boolean) {
  const { w, buttons } = currentWord()
  const b = buttons.find((x) => (x.textContent === w.tr.uz) === right)!
  fireEvent.click(b)
  return w
}
const advance = () => act(() => vi.advanceTimersByTime(RIGHT_ADVANCE_MS))

beforeEach(() => {
  localStorage.clear()
  goBack = null
  vi.stubGlobal('scrollTo', vi.fn())
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('takrorlash sessiyasi (/til/takrorlash)', () => {
  it('savol: nemischa soʻz, 4 variant, "1 / 3"', () => {
    seed({ words: WORDS3 })
    renderApp(['/til', '/til/takrorlash'])
    expect(screen.getByText('Bu soʻz nima degani?')).toBeTruthy()
    expect(screen.getByText('1 / 3')).toBeTruthy()
    const { w, buttons } = currentWord()
    expect(buttons).toHaveLength(4)
    expect(buttons.filter((b) => b.textContent === w.tr.uz)).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Takrorlashni yopish' })).toBeTruthy()
  })

  it('toʻgʻri javob: yashil, "N kundan keyin", jadval keyingi oraliqqa; oʻzi keyingi savolga oʻtadi', () => {
    seed({ words: WORDS3 })
    renderApp(['/til', '/til/takrorlash'])
    const w = answer(true)
    const before = WORDS3[w.id]
    const after = stored()[w.id]
    expect(after.interval).toBeGreaterThan(before.interval)
    expect(screen.getByText(`Toʻgʻri. Bu soʻz ${after.interval} kundan keyin yana soʻraladi.`)).toBeTruthy()
    expect(screen.getByRole('button', { name: new RegExp(w.tr.uz) }).className).toContain('border-success')
    expect(activityToday()).toBe(1)
    advance()
    expect(screen.getByText('2 / 3')).toBeTruthy()
  })

  it('xato javob: tanlangan qizil, toʻgʻrisi yashil, "Davom etish"; soʻz sessiya oxirida yana soʻraladi', () => {
    seed({ words: WORDS3 })
    renderApp(['/til', '/til/takrorlash'])
    const { w, buttons } = currentWord()
    const wrong = buttons.find((b) => b.textContent !== w.tr.uz)!
    fireEvent.click(wrong)
    expect(wrong.className).toContain('border-danger')
    expect(buttons.find((b) => b.textContent === w.tr.uz)!.className).toContain('border-success')
    expect(screen.getByText('Xato qilish odatiy hol. Bu soʻz shu sessiya oxirida va ertaga yana keladi.')).toBeTruthy()
    expect(stored()[w.id]).toMatchObject({ interval: 1, due: addDays(TODAY, 1), mistakes: WORDS3[w.id].mistakes + 1 })
    fireEvent.click(screen.getByRole('button', { name: 'Davom etish' }))
    expect(screen.getByText('2 / 4')).toBeTruthy() // navbat oxiriga qoʻshildi
  })

  it('natija: soni, toʻgʻrilari, streak, xatolar roʻyxati; "Tayyor" oldingi ekranga qaytaradi', () => {
    seed({ words: WORDS3 })
    renderApp(['/til', '/til/takrorlash'])
    const missed = answer(false)
    fireEvent.click(screen.getByRole('button', { name: 'Davom etish' }))
    answer(true)
    advance()
    answer(true)
    advance()
    // xato soʻz yana: endi toʻgʻri, lekin jadval oʻzgarmaydi (ertaga)
    expect(currentWord().w.id).toBe(missed.id)
    answer(true)
    expect(stored()[missed.id]).toMatchObject({ interval: 1, due: addDays(TODAY, 1) })
    advance()
    expect(screen.getByRole('heading', { name: 'Takrorlash tugadi' })).toBeTruthy() // 4 mashq < 10
    expect(screen.getByText('3 ta soʻz takrorlandi, 2 tasi toʻgʻri')).toBeTruthy()
    expect(screen.getByText('0 kun ketma-ket')).toBeTruthy()
    expect(activityToday()).toBe(4)
    fireEvent.click(screen.getByRole('button', { name: 'Xato qilingan 1 ta soʻzni koʻrish' }))
    expect(screen.getByText(missed.de)).toBeTruthy()
    expect(screen.getByText(missed.tr.uz)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tayyor' }))
    expect(where()).toBe('/til')
    expect(screen.getByText(/Bugun takrorlash yoʻq\. Keyingisi: ertaga/)).toBeTruthy()
  })

  it('maqsad bajarilsa: "Bugungi maqsad bajarildi" va streak 1', () => {
    seed({ words: { 'a1-m1-hallo': due() }, activity: { [TODAY]: { count: 9, forgiven: false } } })
    renderApp(['/til', '/til/takrorlash'])
    answer(true)
    advance()
    expect(screen.getByRole('heading', { name: 'Bugungi maqsad bajarildi' })).toBeTruthy()
    expect(screen.getByText('1 kun ketma-ket')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Xato qilingan/ })).toBeNull()
  })

  it('toʻgʻridan-toʻgʻri ochilsa ham "orqaga" ilovadan chiqarmaydi: Til ekraniga qaytadi', () => {
    seed({ words: WORDS3 })
    renderApp('/til/takrorlash')
    expect(where()).toBe('/til/takrorlash')
    act(() => goBack!())
    expect(where()).toBe('/til')
    expect(screen.getByRole('heading', { name: 'Nemis tili' })).toBeTruthy()
  })

  it('X — sessiyani yopadi, berilgan javoblar saqlanib qoladi', () => {
    seed({ words: WORDS3 })
    renderApp(['/', '/til/takrorlash'])
    const w = answer(true)
    fireEvent.click(screen.getByRole('button', { name: 'Takrorlashni yopish' }))
    expect(where()).toBe('/')
    expect(stored()[w.id].due > TODAY).toBe(true)
  })

  it('bugun soʻz yoʻq — sokin xabar va "Tayyor"', () => {
    seed()
    renderApp(['/til', '/til/takrorlash'])
    expect(screen.getByRole('heading', { name: 'Bugun takrorlash yoʻq' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tayyor' }))
    expect(where()).toBe('/til')
  })

  it('rus va kirill interfeysida', () => {
    seed({ words: { 'a1-m1-hallo': due() } })
    renderApp(['/til', '/til/takrorlash'], 'ru')
    expect(screen.getByText('Что значит это слово?')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Привет' })).toBeTruthy()
    cleanup()
    renderApp(['/til', '/til/takrorlash'], 'uz-Cyrl')
    expect(screen.getByText('Бу сўз нима дегани?')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Салом' }))
    expect(screen.getByText('Тўғри. Бу сўз 7 кундан кейин яна сўралади.')).toBeTruthy()
  })
})

describe('Til ekrani', () => {
  it('maqsad halqasi, hafta, streak, takrorlash kartochkasi, soʻzlar holati, daraja', () => {
    const yesterday = addDays(TODAY, -1)
    seed({
      words: { ...WORDS3, 'a1-m1-tschuess': { due: addDays(TODAY, 2), interval: 14, mistakes: 0, updatedAt: NOW }, 'a1-m1-gute-nacht': { due: addDays(TODAY, 1), interval: 1, mistakes: 0, updatedAt: NOW } },
      activity: { [TODAY]: { count: 6, forgiven: false }, [yesterday]: { count: 10, forgiven: false } }
    })
    renderApp('/til')
    expect(screen.getByRole('img', { name: 'Bugun 6 / 10 mashq' })).toBeTruthy()
    expect(screen.getByText('Bugungi maqsad')).toBeTruthy()
    expect(screen.getByText('Yana 4 ta mashq qoldi')).toBeTruthy()
    expect(screen.getByRole('list', { name: 'Shu hafta kunlari' }).querySelectorAll('li')).toHaveLength(7)
    expect(screen.getByText('1 kun ketma-ket. Rekordingiz: 1 kun')).toBeTruthy()
    expect(screen.getByText('Bugun 3 ta soʻzni qaytarish vaqti')).toBeTruthy()
    expect(screen.getByText('Soʻzlaringiz: 5 ta')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Soʻzlar holati: Yangi 1, Oʻrganilmoqda 3, Mustahkam 1' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'A1 darajasi' })).toBeTruthy()
    expect(screen.getByText('0 / 6 dars tugatildi')).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Takrorlashni boshlash' }))
    expect(where()).toBe('/til/takrorlash')
  })

  it('maqsad bajarilgan holat', () => {
    seed({ activity: { [TODAY]: { count: 12, forgiven: false } } })
    renderApp('/til')
    expect(screen.getByText('Bugungi maqsad bajarildi')).toBeTruthy()
    expect(screen.queryByText(/mashq qoldi/)).toBeNull()
    expect(screen.getByText(/Bugun takrorlash yoʻq/)).toBeTruthy()
  })
})

describe('dars → takrorlash qutisi va kunlik maqsad', () => {
  it('har mashq maqsadga qoʻshiladi, dars tugasa soʻzlari ertaga keladi', () => {
    seed()
    renderApp(['/til/modul/a1-m1', '/til/dars/a1-m1-l1'])
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: 'Keyingisi' }))
    expect(activityToday()).toBe(4)
    expect(stored()).toEqual({}) // dars tugamaguncha qutiga tushmaydi
  })
})

describe('Bosh sahifa va Sozlamalar', () => {
  it('"Nemis tili" kartochkasi: bugungi maqsad va streak; takrorlash qatori faqat soʻz boʻlsa', () => {
    seed({ words: WORDS3, activity: { [TODAY]: { count: 6, forgiven: false } } })
    renderApp('/')
    expect(screen.getByText('Bugun 6/10 · 0 kun ketma-ket')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Bugungi maqsad boʻyicha progress' }).getAttribute('aria-valuenow')).toBe('60')
    fireEvent.click(screen.getByRole('link', { name: '3 ta soʻz takrorlashni kutyapti' }))
    expect(where()).toBe('/til/takrorlash')
    cleanup()
    seed()
    renderApp('/')
    expect(screen.queryByText(/takrorlashni kutyapti/)).toBeNull()
  })

  it('Sozlamalarda "Kunlik maqsad": 15 tanlansa profilga yoziladi va maqsad oʻzgaradi', () => {
    seed({ activity: { [TODAY]: { count: 12, forgiven: false } } })
    renderApp(['/', '/sozlamalar'])
    const group = screen.getByRole('radiogroup', { name: 'Kunlik maqsad' })
    expect(within(group).getByRole('radio', { name: '10 ta mashq' }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(within(group).getByRole('radio', { name: '15 ta mashq' }))
    expect(JSON.parse(localStorage.getItem('qaldirgoch.profile')!).dailyGoal).toBe(15)
    fireEvent.click(screen.getByRole('button', { name: 'Orqaga' }))
    expect(screen.getByText('Bugun 12/15 · 0 kun ketma-ket')).toBeTruthy()
  })

  it('Sozlamalar toʻgʻridan-toʻgʻri ochilsa "Orqaga" Bosh sahifaga olib boradi', () => {
    seed()
    renderApp('/sozlamalar')
    fireEvent.click(screen.getByRole('button', { name: 'Orqaga' }))
    expect(where()).toBe('/')
  })
})
