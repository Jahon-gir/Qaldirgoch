// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { InstallProvider } from '../pwa/InstallProvider'
import { LessonsProvider } from '../german/LessonsProvider'
import { WordsProvider } from '../german/WordsProvider'
import { localDay, type Words } from '../german/srs'
import { SOON_TOAST_MS } from '../pages/LanguagePicker'
import { koExercisesOf } from '../content/korean'
import { KO_COURSE } from './ko'

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1 }
const NOW = '2026-11-01T00:00:00.000Z'
const TODAY = localDay()
const Where = () => <output data-testid="where">{useLocation().pathname}</output>
const done = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, { lessonId: id, score: 1, total: 1, completedAt: NOW }]))
function seed({ profile = {}, lessons = {}, words }: { profile?: Record<string, unknown>; lessons?: Record<string, unknown>; words?: Words } = {}) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify({ ...PROFILE, ...profile }))
  localStorage.setItem('qaldirgoch.lessons', JSON.stringify(lessons))
  if (words) localStorage.setItem('qaldirgoch.words', JSON.stringify(words))
}
function renderApp(path: string | string[]) {
  const paths = Array.isArray(path) ? path : [path]
  return render(
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <ProgressProvider>
            <LessonsProvider>
              <WordsProvider>
                <InstallProvider>
                  <MemoryRouter initialEntries={paths} initialIndex={paths.length - 1}>
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
const where = () => screen.getByTestId('where').textContent
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const statusText = () => screen.getAllByRole('status').map((e) => e.textContent).join(' | ')
const profile = () => JSON.parse(localStorage.getItem('qaldirgoch.profile')!)

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('/til — til tanlash ekrani', () => {
  it('har safar tanlash ekrani: sarlavha, 4 kafel (2 ochiq, 2 qulf)', () => {
    seed()
    renderApp('/til')
    expect(screen.getByRole('heading', { name: 'Tillar' })).toBeTruthy()
    expect(screen.getByText('2 ta til ochiq, boshqalari tayyorlanmoqda')).toBeTruthy()
    expect(screen.getByTestId('lang-de').textContent).toContain('A1 · 0%')
    expect(screen.getByTestId('lang-ko').textContent).toContain('Yangi')
    for (const id of ['ja', 'en']) {
      const tile = screen.getByTestId(`lang-${id}`).closest('button')!
      expect(tile.getAttribute('aria-disabled')).toBe('true')
      expect(tile.textContent).toContain('Tez orada')
    }
  })
  it('Nemis kafeli → /til/de va activeCourse = de', () => {
    seed()
    renderApp('/til')
    fireEvent.click(screen.getByTestId('lang-de'))
    expect(where()).toBe('/til/de')
    expect(screen.getByRole('heading', { name: 'Nemis tili' })).toBeTruthy()
    expect(profile().activeCourse).toBe('de')
  })
  it('Koreys kafeli → /til/ko va activeCourse = ko; qaytganda koreys kafelida belgi', () => {
    seed()
    renderApp('/til')
    fireEvent.click(screen.getByTestId('lang-ko'))
    expect(where()).toBe('/til/ko')
    expect(screen.getByRole('heading', { name: 'Koreys tili' })).toBeTruthy()
    expect(profile().activeCourse).toBe('ko')
    click('Orqaga')
    expect(where()).toBe('/til')
    expect(within(screen.getByTestId('lang-ko')).getByTestId('lang-last')).toBeTruthy()
    expect(within(screen.getByTestId('lang-de')).queryByTestId('lang-last')).toBeNull()
  })
  it('qulfli kafel: xabar 1,8 s chiqadi, sahifa oʻzgarmaydi, profil yozilmaydi', () => {
    vi.useFakeTimers()
    seed()
    renderApp('/til')
    fireEvent.click(screen.getByTestId('lang-ja').closest('button')!)
    expect(where()).toBe('/til')
    expect(statusText()).toContain('Bu til tayyorlanmoqda — tez orada ochiladi')
    expect(screen.getByTestId('lang-ja').className).toContain('lp-shake')
    expect(profile().activeCourse).toBeUndefined()
    act(() => {
      vi.advanceTimersByTime(SOON_TOAST_MS + 10)
    })
    expect(screen.queryByText('Bu til tayyorlanmoqda — tez orada ochiladi')).toBeNull()
  })
  it('koreys darsi boshlangan boʻlsa — "Hangul · N%"', () => {
    seed({ lessons: done('ko-h-m1-l1', 'ko-h-m1-l2', 'ko-h-m1-l3') })
    renderApp('/til')
    expect(screen.getByTestId('lang-ko').textContent).toContain('Hangul · 50%')
  })
})

describe('nemischa marshrutlar oʻzgarmagan', () => {
  it('eski ichki manzillar ishlaydi; /til/de dan orqaga — /til', () => {
    seed({ lessons: done('a1-m1-l1') })
    renderApp(['/til', '/til/de'])
    expect(screen.getByRole('heading', { name: 'Nemis tili' })).toBeTruthy()
    click('Orqaga')
    expect(where()).toBe('/til')
    cleanup()
    for (const p of ['/til/modul/a1-m1', '/til/dars/a1-m1-l1', '/til/lugat', '/til/lugat/a1-m1-l1', '/til/takrorlash']) {
      renderApp(p)
      expect(where(), p).toBe(p)
      cleanup()
    }
  })
  it('toʻgʻridan-toʻgʻri ochilgan /til/de dan orqaga — tanlash ekrani', () => {
    seed()
    renderApp('/til/de')
    click('Orqaga')
    expect(where()).toBe('/til')
  })
})

describe('koreys kurs ekrani /til/ko', () => {
  it('bayroq va nom, ogohlantirish, darajalar, yoʻnalish yoʻq, 1-modul ochiq, qolganlari "Tez orada"', () => {
    seed()
    renderApp(['/til', '/til/ko'])
    expect(screen.getByRole('heading', { name: 'Koreys tili' })).toBeTruthy()
    expect(screen.getByText('Ilova til kursini toʻldiradi, almashtirmaydi. Darslar tekshiruvda.')).toBeTruthy()
    expect(screen.queryByText(/Yoʻnalish:/)).toBeNull()
    const levels = within(screen.getByRole('group', { name: 'Darajalar' })).getAllByRole('button')
    expect(levels.map((b) => b.textContent)).toEqual(['Hangul0/6', 'TOPIK 10/0', 'TOPIK 2keyin'])
    expect(screen.getByRole('link', { name: /Harflar/ }).getAttribute('href')).toBe('/til/ko/modul/ko-h-m1')
    expect(screen.getByText('Oʻqish qoidalari')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Davom etish' }).getAttribute('href')).toBe('/til/ko/dars/ko-h-m1-l1')
    fireEvent.click(levels[1])
    expect(screen.getByText('Ish joyida: asboblar va xavfsizlik belgilari')).toBeTruthy()
    expect(screen.getAllByText('Tez orada').length).toBe(8)
  })
  it('modul ekrani: 6 dars, havolalar /til/ko/dars/...', () => {
    seed()
    renderApp(['/til/ko', '/til/ko/modul/ko-h-m1'])
    expect(screen.getByText('Hangul · 1-modul')).toBeTruthy()
    expect(screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/til/ko/dars/'))).toHaveLength(6)
    click('Orqaga')
    expect(where()).toBe('/til/ko')
  })
})

describe('koreys darsi: harf kartochkasi va boʻgʻin yigʻish', () => {
  it('letter kartochkasi: katta harf, tovush, izoh, misol soʻz (oʻqilishi bilan); lang="ko"', () => {
    seed()
    renderApp(['/til/ko/modul/ko-h-m1', '/til/ko/dars/ko-h-m1-l1'])
    expect(screen.getByText('Yangi harflar')).toBeTruthy()
    const cards = screen.getAllByTestId('letter-card')
    expect(cards.map((c) => c.querySelector('[lang="ko"]')!.textContent)).toEqual(['ㅏ', 'ㅓ'])
    expect(cards[1].textContent).toContain('eo')
    const note = screen.getByText((_, el) => el?.tagName === 'P' && !!el.textContent?.startsWith('ㅓ — oʻzbekcha «o» ga yaqin'))
    expect([...note.querySelectorAll('[lang="ko"]')].map((e) => e.textContent)).toEqual(['ㅓ', 'ㅇ', '아', '어']) // izohdagi Hangul ham lang="ko"
    expect(screen.getByText('아이').getAttribute('lang')).toBe('ko')
    expect(screen.getByText('a-i · bola')).toBeTruthy()
  })
  it('syllable: toʻgʻri yigʻilsa (ㄴ + ㅏ = 나) — toʻgʻri; xato — toʻgʻri javob koʻrsatiladi', () => {
    seed()
    renderApp(['/til/ko/modul/ko-h-m1', '/til/ko/dars/ko-h-m1-l3'])
    click('Keyingisi') // e1: harf kartasi
    expect(screen.getByText('Boʻgʻinni yigʻing')).toBeTruthy()
    expect(screen.getByText('«na»')).toBeTruthy()
    const letters = within(screen.getByRole('group', { name: 'Harflar' })).getAllByRole('button')
    expect(letters.map((b) => b.textContent).sort()).toEqual(['ㄴ', 'ㄹ', 'ㅏ', 'ㅗ'].sort())
    const check = screen.getByRole('button', { name: 'Tekshirish' }) as HTMLButtonElement
    expect(check.disabled).toBe(true)
    click('ㄴ')
    expect(screen.getByTestId('syllable-preview').textContent).toBe('ㄴ')
    click('ㅏ')
    expect(screen.getByTestId('syllable-preview').textContent).toBe('나') // jonli yigʻiladi
    click('Tekshirish')
    expect(statusText()).toContain('Toʻgʻri:')
    expect(statusText()).toContain('나')
    click('Davom etish')
    // e3: 두 — xato: ㄷ + ㅗ = 도
    expect(screen.getByText('«du»')).toBeTruthy()
    click('ㄷ')
    click('ㅗ')
    expect(screen.getByTestId('syllable-preview').textContent).toBe('도')
    click('Tekshirish')
    expect(statusText()).toContain('Toʻgʻri javob:')
    expect(statusText()).toContain('두')
  })
  it('dars tugasa natija saqlanadi va soʻzlar koreys takrorlash qutisiga tushadi; kunlik maqsad +1', () => {
    seed()
    renderApp(['/til/ko/modul/ko-h-m1', '/til/ko/dars/ko-h-m1-l1'])
    for (const ex of koExercisesOf('ko-h-m1-l1')) {
      if (ex.type === 'letter' || ex.type === 'word') click('Keyingisi')
      else if (ex.type === 'choice') {
        click(ex.options.find((o) => o.correct)!.text)
        click('Davom etish')
      } else if (ex.type === 'match') {
        for (const p of ex.pairs) {
          fireEvent.click(screen.getAllByRole('button', { name: p.term })[0])
          fireEvent.click(screen.getByRole('button', { name: p.tr.uz }))
        }
        click('Davom etish')
      }
    }
    expect(screen.getByText('Dars tugadi')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('qaldirgoch.lessons')!)['ko-h-m1-l1']).toBeTruthy()
    expect(Object.keys(JSON.parse(localStorage.getItem('qaldirgoch.words')!)).sort()).toEqual(['ko-h-m1-ai', 'ko-h-m1-oi'])
    expect(JSON.parse(localStorage.getItem('qaldirgoch.activity')!)[TODAY].count).toBe(1)
  })
})

describe('koreyscha takrorlash va lugʻat', () => {
  const due = (interval: number) => ({ due: TODAY, interval, mistakes: 0, updatedAt: NOW })
  it('takrorlash faqat koreys soʻzlari; yozish va oʻqilishi (pron) yoʻq; 14+ kunlik soʻz — boʻgʻinlardan yigʻish', () => {
    seed({ words: { 'ko-h-m1-nara': due(14), 'ko-h-m1-ne': due(30), 'a1-m1-hallo': due(3) } })
    renderApp(['/til/ko', '/til/ko/takrorlash'])
    expect(screen.getByText('1 / 2')).toBeTruthy() // faqat koreyscha (nemischa Hallo yoʻq)
    expect(document.body.textContent).not.toContain(KO_COURSE.wordById('ko-h-m1-nara')!.pron.uz) // "na-ra" koʻrsatilmaydi
    expect(screen.queryByRole('textbox')).toBeNull() // yozish yoʻq
    expect(screen.getByText('Boʻgʻinlardan yigʻing')).toBeTruthy() // 나라 — yigʻish
    const tiles = within(screen.getByRole('group', { name: 'Boʻgʻinlardan yigʻing' })).getAllByRole('button')
    expect(tiles).toHaveLength(4) // 2 boʻgʻin + 2 chalgʻituvchi
    click('나')
    click('라')
    expect(statusText()).toContain('나라')
    click('Davom etish')
    // 네 — bir boʻgʻinli: yigʻish oʻrniga Test
    expect(screen.getByText('Bu soʻz nima degani?')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('네').getAttribute('lang')).toBe('ko')
    expect(screen.getByText('네').parentElement!.textContent).not.toMatch(/\bne\b/) // oʻqilishi yoʻq
  })
  it('Lugʻat Roʻyxati va Kartochkasida oʻqilishi bor; chip "KO ⇄ UZ"', () => {
    seed({ lessons: done('ko-h-m1-l1'), profile: { vocabMode: 'cards' } })
    renderApp(['/til/ko/lugat', '/til/ko/lugat/ko-h-m1-l1'])
    expect(screen.getByRole('button', { name: /Old tomoni tilini almashtirish \(hozir: Koreyscha\)/ }).textContent).toBe('KO ⇄ UZ')
    const card = screen.getByTestId('vocab-card')
    expect(within(card).getAllByText('아이')[0].getAttribute('lang')).toBe('ko')
    expect(within(card).getByText('a-i')).toBeTruthy()
  })
})
