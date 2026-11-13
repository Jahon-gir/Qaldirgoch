// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { InstallProvider } from '../pwa/InstallProvider'
import { LessonsProvider } from '../german/LessonsProvider'
import { WordsProvider } from '../german/WordsProvider'
import { localDay } from '../german/srs'
import { koExercisesOf, KO_LESSONS } from '../content/korean'
import type { Exercise } from '../content/german'
import { KO_COURSE } from './ko'

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1, dailyGoal: 2 }
const NOW = '2026-11-01T00:00:00.000Z'
const TODAY = localDay()
const Where = () => <output data-testid="where">{useLocation().pathname}</output>
const ids = (m: string) => KO_LESSONS.filter((l) => l.moduleId === m).map((l) => l.id)
const done = (...list: string[]) => Object.fromEntries(list.map((id) => [id, { lessonId: id, score: 1, total: 1, completedAt: NOW }]))
function seed({ lessons = {}, words }: { lessons?: Record<string, unknown>; words?: Record<string, unknown> } = {}) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(PROFILE))
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

/** Birinchi bosilishi mumkin boʻlgan (oʻchirilmagan) tugma: boʻgʻin tugmalarida bir xil harf ikki marta boʻlishi mumkin (밥 = ㅂ + ㅏ + ㅂ). */
const tile = (ch: string) => screen.getAllByRole('button', { name: ch }).find((b) => !(b as HTMLButtonElement).disabled)!

/** Bitta qadamni toʻgʻri javob bilan bajaradi. */
function play(ex: Exercise) {
  if (ex.type === 'word' || ex.type === 'letter') return click('Keyingisi')
  if (ex.type === 'choice') {
    click(ex.options.find((o) => o.correct)!.text)
    return click('Davom etish')
  }
  if (ex.type === 'match') {
    for (const p of ex.pairs) {
      fireEvent.click(screen.getAllByRole('button', { name: p.term })[0])
      fireEvent.click(screen.getByRole('button', { name: p.tr.uz }))
    }
    return click('Davom etish')
  }
  if (ex.type !== 'syllable') throw new Error(`kutilmagan mashq: ${ex.type}`)
  fireEvent.click(tile(ex.initial))
  fireEvent.click(tile(ex.vowel))
  if (ex.final) fireEvent.click(tile(ex.final))
  else if (ex.showFinal) click('Pastki harf yoʻq')
  click('Tekshirish')
  expect(statusText()).toContain('Toʻgʻri:')
  click('Davom etish')
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Hangul 2-modul: kurs ekrani va modul', () => {
  it('Til ekranida 2-modul ochiq (6 dars); 1-modul tugagach "Davom etish" 2-modulga olib boradi', () => {
    seed({ lessons: done(...ids('ko-h-m1')) })
    renderApp(['/til/ko'])
    const mods = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/til/ko/modul/'))
    expect(mods.map((a) => a.getAttribute('href'))).toEqual(['/til/ko/modul/ko-h-m1', '/til/ko/modul/ko-h-m2'])
    expect(screen.getByRole('link', { name: 'Davom etish' }).getAttribute('href')).toBe('/til/ko/dars/ko-h-m2-l1')
    expect(screen.getByText('Qattiq undoshlar')).toBeTruthy()
  })
  it('modul ekrani: 6 dars, sarlavha "Hangul · 2-modul", kontent tekshiruvda', () => {
    seed()
    renderApp(['/til/ko', '/til/ko/modul/ko-h-m2'])
    expect(screen.getByText('Hangul · 2-modul')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Oʻqish qoidalari' })).toBeTruthy()
    expect(screen.getByText('Kontent tekshiruvda')).toBeTruthy()
    expect(screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/til/ko/dars/ko-h-m2-'))).toHaveLength(6)
  })
})

describe('letter kartalari', () => {
  it('1-dars: qattiq undoshlar kartasi (5 harf) va 가/카/까 solishtirish jadvali (9 boʻgʻin, 3 qator)', () => {
    seed()
    renderApp(['/til/ko/modul/ko-h-m2', '/til/ko/dars/ko-h-m2-l1'])
    expect(screen.getAllByTestId('letter-card').map((c) => c.querySelector('[lang="ko"]')!.textContent)).toEqual(['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'])
    click('Keyingisi')
    const cards = screen.getAllByTestId('letter-card')
    expect(cards.map((c) => c.querySelector('[lang="ko"]')!.textContent)).toEqual(['가', '카', '까', '다', '타', '따', '바', '파', '빠'])
    expect(cards.map((c) => c.textContent!.replace(/^./, '').trim())).toEqual(['ga', 'ka', 'kka', 'da', 'ta', 'tta', 'ba', 'pa', 'ppa'].map((x) => x.trim()))
    expect(cards[0].parentElement!.className).toContain('grid-cols-3') // 3 ustun = 3 qator
  })
  it('4-dars: bogʻlanib oʻqish kartasi 한국어 = 한 + 국 + 어 → [한구거]', () => {
    seed()
    renderApp(['/til/ko/modul/ko-h-m2', '/til/ko/dars/ko-h-m2-l4'])
    expect(screen.getAllByTestId('letter-card').map((c) => c.querySelector('[lang="ko"]')!.textContent)).toEqual(['한', '국', '어'])
    const note = screen.getByText((_, el) => el?.tagName === 'P' && !!el.textContent?.includes('[한구거]'))
    expect([...note.querySelectorAll('[lang="ko"]')].map((e) => e.textContent)).toContain('[한구거]'.slice(1, -1))
    expect(screen.getByText('han-gu-go · koreys tili')).toBeTruthy()
  })
  it('5-dars: belgilar kartasi — uzun yozuv 1 ustunda', () => {
    seed()
    renderApp(['/til/ko/modul/ko-h-m2', '/til/ko/dars/ko-h-m2-l5'])
    const cards = screen.getAllByTestId('letter-card')
    expect(cards.map((c) => c.querySelector('[lang="ko"]')!.textContent)).toEqual(['입구', '감사합니다'])
    expect(cards[0].parentElement!.className).toContain('grid-cols-1')
  })
})

describe('syllable: pastki harf va murakkab unli', () => {
  it('2-dars: ㄱ + ㅘ = 과 — murakkab unli bitta tugma', () => {
    seed()
    renderApp(['/til/ko/modul/ko-h-m2', '/til/ko/dars/ko-h-m2-l2'])
    for (let i = 0; i < 11; i++) click('Keyingisi')
    expect(screen.getByText('«gva»')).toBeTruthy()
    const letters = within(screen.getByRole('group', { name: 'Harflar' })).getAllByRole('button')
    expect(letters.map((b) => b.textContent).sort()).toEqual(['ㄱ', 'ㅏ', 'ㅘ', 'ㅝ'].sort()) // ㅘ — bitta tugma
    expect(screen.queryByRole('button', { name: 'Pastki harf: boʻsh' })).toBeNull() // 2 katak
    click('ㄱ')
    click('ㅘ')
    expect(screen.getByTestId('syllable-preview').textContent).toBe('과')
    click('Tekshirish')
    expect(statusText()).toContain('Toʻgʻri:')
  })
  it('3-dars: ㅂ + ㅏ + ㅂ = 밥 (3 katak, bir xil harf ikki tugmada); toʻgʻri', () => {
    seed()
    renderApp(['/til/ko/modul/ko-h-m2', '/til/ko/dars/ko-h-m2-l3'])
    for (let i = 0; i < 13; i++) click('Keyingisi')
    expect(screen.getByText('«bap»')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pastki harf: boʻsh' })).toBeTruthy() // 3-katak
    expect(screen.getAllByRole('button', { name: 'ㅂ' })).toHaveLength(2)
    const check = screen.getByRole('button', { name: 'Tekshirish' }) as HTMLButtonElement
    expect(check.disabled).toBe(true)
    fireEvent.click(tile('ㅂ'))
    fireEvent.click(tile('ㅏ'))
    expect(screen.getByTestId('syllable-preview').textContent).toBe('바')
    expect(check.disabled).toBe(true) // pastki katak toʻldirilmagan
    fireEvent.click(tile('ㅂ')) // ikkinchi ㅂ — pastki katakka
    expect(screen.getByTestId('syllable-preview').textContent).toBe('밥')
    expect(check.disabled).toBe(false)
    click('Tekshirish')
    expect(statusText()).toContain('Toʻgʻri:')
    expect(statusText()).toContain('밥')
  })
  it('3-dars: xato pastki harf (ㅁ → 밤) — xato, toʻgʻri javob 밥 koʻrsatiladi; boʻsh katakni bosib aniq katak tanlash', () => {
    seed()
    renderApp(['/til/ko/modul/ko-h-m2', '/til/ko/dars/ko-h-m2-l3'])
    for (let i = 0; i < 13; i++) click('Keyingisi')
    fireEvent.click(tile('ㅂ'))
    fireEvent.click(tile('ㅏ'))
    click('Pastki harf: boʻsh') // keyingi undosh pastki katakka tushadi
    fireEvent.click(tile('ㅁ'))
    expect(screen.getByTestId('syllable-preview').textContent).toBe('밤')
    click('Tekshirish')
    expect(statusText()).toContain('Toʻgʻri javob:')
    expect(statusText()).toContain('밥')
  })
  it('toʻldirilgan pastki katak bosilsa boʻshaydi', () => {
    seed()
    renderApp(['/til/ko/modul/ko-h-m2', '/til/ko/dars/ko-h-m2-l3'])
    for (let i = 0; i < 13; i++) click('Keyingisi')
    fireEvent.click(tile('ㅂ'))
    fireEvent.click(tile('ㅏ'))
    fireEvent.click(tile('ㅂ'))
    expect(screen.getByTestId('syllable-preview').textContent).toBe('밥')
    click('Pastki harf: ㅂ')
    expect(screen.getByTestId('syllable-preview').textContent).toBe('바')
    expect(screen.getByRole('button', { name: 'Pastki harf: boʻsh' })).toBeTruthy()
  })
  it('6-dars: pastki harf yoʻq — "Yoʻq" tugmasi: 사 toʻgʻri, ㄴ qoʻyilsa 산 — xato', () => {
    seed()
    renderApp(['/til/ko/modul/ko-h-m2', '/til/ko/dars/ko-h-m2-l6'])
    const ex = koExercisesOf('ko-h-m2-l6')
    for (const e of ex.slice(0, 7)) play(e)
    expect(screen.getByText('«sa»')).toBeTruthy()
    fireEvent.click(tile('ㅅ'))
    fireEvent.click(tile('ㅏ'))
    click('Pastki harf yoʻq')
    expect(screen.getByTestId('syllable-preview').textContent).toBe('사')
    click('Tekshirish')
    expect(statusText()).toContain('Toʻgʻri:')
    cleanup()
    // xato: ㄴ pastki katakka
    renderApp(['/til/ko/modul/ko-h-m2', '/til/ko/dars/ko-h-m2-l6'])
    for (const e of ex.slice(0, 7)) play(e)
    fireEvent.click(tile('ㅅ'))
    fireEvent.click(tile('ㅏ'))
    fireEvent.click(tile('ㄴ'))
    expect(screen.getByTestId('syllable-preview').textContent).toBe('산')
    click('Tekshirish')
    expect(statusText()).toContain('Toʻgʻri javob:')
  })
})

describe('2-modul: barcha darslar toʻliq oʻtiladi', () => {
  it('6 dars oxirigacha: natija saqlanadi, 44 soʻz koreys takrorlash qutisiga tushadi, maqsad +1', () => {
    seed()
    for (const lesson of KO_LESSONS.filter((l) => l.moduleId === 'ko-h-m2')) {
      renderApp(['/til/ko/modul/ko-h-m2', `/til/ko/dars/${lesson.id}`])
      for (const ex of koExercisesOf(lesson.id)) play(ex)
      expect(screen.getByText('Dars tugadi'), lesson.id).toBeTruthy()
      expect(JSON.parse(localStorage.getItem('qaldirgoch.lessons')!)[lesson.id], lesson.id).toBeTruthy()
      cleanup()
    }
    const words = Object.keys(JSON.parse(localStorage.getItem('qaldirgoch.words')!))
    expect(words.sort()).toEqual(KO_COURSE.vocab.filter((w) => w.moduleId === 'ko-h-m2').map((w) => w.id).sort())
    expect(words).toHaveLength(44)
    expect(JSON.parse(localStorage.getItem('qaldirgoch.activity')!)[TODAY].count).toBe(6)
  })
})

describe('koreyscha takrorlash va lugʻat: 2-modul soʻzlari', () => {
  const due = (interval: number) => ({ due: TODAY, interval, mistakes: 0, updatedAt: NOW })
  it('pastki harfli soʻz (14+ kun) — boʻgʻin bloklaridan yigʻish; bir boʻgʻinli (물) — Test; pron yoʻq', () => {
    seed({ words: { 'ko-h-m2-hanguk': due(14), 'ko-h-m2-mul': due(30) } })
    renderApp(['/til/ko', '/til/ko/takrorlash'])
    expect(screen.getByText('Boʻgʻinlardan yigʻing')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    click('한')
    click('국')
    expect(statusText()).toContain('한국')
    expect(document.body.textContent).not.toContain('han-guk')
    click('Davom etish')
    expect(screen.getByText('Bu soʻz nima degani?')).toBeTruthy() // 물 — bir boʻgʻinli: Test
    expect(document.body.textContent).not.toContain('«mul»')
  })
  it('Lugʻat Roʻyxatida 2-modul darslari ochiq (tugatilgan) va soʻzda oʻqilishi bor', () => {
    seed({ lessons: done('ko-h-m2-l4'), words: {} })
    renderApp(['/til/ko', '/til/ko/lugat'])
    expect(screen.getByText('4-dars: Bogʻlanib oʻqish')).toBeTruthy()
    expect(screen.getAllByText('Darsni tugatgach ochiladi').length).toBeGreaterThan(0)
  })
})

describe('yakuniy testlar koreys kursida: 2-modul va Hangul darajasi', () => {
  it('modul testi: 2-modul darslari tugagach /til/ko/test/ko-h-m2 ochiladi (8 savol), boshlanadi, yozish yoʻq', () => {
    seed({ lessons: done(...ids('ko-h-m2')) })
    renderApp(['/til/ko', '/til/ko/test/ko-h-m2'])
    expect(where()).toBe('/til/ko/test/ko-h-m2')
    expect(screen.getByRole('heading', { name: '2-modul yakuniy testi' })).toBeTruthy()
    expect(screen.getByText('Oʻqish qoidalari')).toBeTruthy()
    expect(screen.getByText('Savollar').nextElementSibling!.textContent).toBe('8')
    click('Testni boshlash')
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('1/8')).toBeTruthy()
  })
  it('modul testi: 2-modul tugamagan boʻlsa — kurs ekraniga', () => {
    seed({ lessons: done(...ids('ko-h-m1')) })
    renderApp(['/til/ko', '/til/ko/test/ko-h-m2'])
    expect(where()).toBe('/til/ko')
  })
  it('Hangul daraja testi: ikkala modul tugagach ochiladi (16 savol); faqat 1-modul tugagan boʻlsa — qulf', () => {
    seed({ lessons: done(...ids('ko-h-m1'), ...ids('ko-h-m2')) })
    renderApp(['/til/ko', '/til/ko/test/level-ko-H'])
    expect(where()).toBe('/til/ko/test/level-ko-H')
    expect(screen.getByRole('heading', { name: 'Hangul daraja testi' })).toBeTruthy()
    expect(screen.getByText('Savollar').nextElementSibling!.textContent).toBe('16')
    cleanup()
    localStorage.clear()
    seed({ lessons: done(...ids('ko-h-m1')) })
    renderApp(['/til/ko', '/til/ko/test/level-ko-H'])
    expect(where()).toBe('/til/ko')
    expect(screen.getByText('Barcha Hangul modullari tugagach ochiladi')).toBeTruthy()
  })
  it('kurs ekranida modul testi kartasi 2-modul tagida (darslar tugagach) va Hangul daraja testi kartasi', () => {
    seed({ lessons: done(...ids('ko-h-m1'), ...ids('ko-h-m2')) })
    renderApp(['/til/ko'])
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/til/ko/test/ko-h-m1')
    expect(hrefs).toContain('/til/ko/test/ko-h-m2')
    expect(hrefs).toContain('/til/ko/test/level-ko-H')
  })
})
