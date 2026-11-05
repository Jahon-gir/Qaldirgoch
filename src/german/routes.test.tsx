// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { LESSONS, exercisesOf, type ChoiceExercise, type Lesson, type MatchExercise } from '../content/german'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { LessonsProvider } from './LessonsProvider'
import { addDays, localDay } from './srs'
import { WordsProvider } from './WordsProvider'

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1 }

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
              <WordsProvider>
              <MemoryRouter initialEntries={[path]}>
                <AppRoutes />
              </MemoryRouter>
              </WordsProvider>
            </LessonsProvider>
          </ProgressProvider>
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const exact = (s: string) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)

/** Darsni kontent boʻyicha oxirigacha bajaradi. wrongOnce — birinchi choice da xato variant tanlanadi. */
async function playLesson(lesson: Lesson, { wrongOnce = false } = {}) {
  let first = true
  for (const ex of exercisesOf(lesson.id)) {
    if (ex.type === 'word') {
      expect(screen.getByRole('heading', { name: ex.de })).toBeTruthy()
      click('Keyingisi')
    } else if (ex.type === 'choice') {
      const pick = wrongOnce && first ? ex.options.find((o) => !o.correct)! : ex.options.find((o) => o.correct)!
      fireEvent.click(screen.getByRole('button', { name: exact(pick.text) }))
      expect(screen.getByText(pick.correct ? 'Toʻgʻri' : 'Xato')).toBeTruthy()
      first = false
      click('Davom etish')
    } else {
      await playMatch(ex, false)
      click('Davom etish')
    }
  }
}

async function playMatch(ex: MatchExercise, withMistake: boolean) {
  if (withMistake) {
    fireEvent.click(screen.getByRole('button', { name: exact(ex.pairs[0].de) }))
    fireEvent.click(screen.getByRole('button', { name: exact(ex.pairs[1].tr.uz) })) // xato juft
    await waitFor(() => expect(within(screen.getByRole('group', { name: 'Tarjima' })).getAllByRole('button').every((b) => !b.className.includes('border-danger'))).toBe(true))
  }
  for (const p of ex.pairs) {
    fireEvent.click(screen.getByRole('button', { name: exact(p.de) }))
    fireEvent.click(screen.getByRole('button', { name: exact(p.tr.uz) }))
  }
  await waitFor(() => expect((screen.getByRole('button', { name: 'Davom etish' }) as HTMLButtonElement).disabled).toBe(false))
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('marshrut: Bosh → Til → modul → dars → natija → modulga qaytish', () => {
  it('bosh ekran chiqmay qolmaydi, darsni tugatib modulga qaytiladi', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderApp('/')
    click('Boshlash') // Bosh
    expect(screen.getByRole('heading', { name: 'Nemis tili' })).toBeTruthy() // Til
    expect(screen.getByText('Yoʻnalish: Texnik kasblar')).toBeTruthy() // payvandchi → technical
    expect(screen.getByText('Ish joyida')).toBeTruthy() // technical modul koʻrinadi
    expect(screen.getAllByText('Tez orada').length).toBe(2) // 2- va 3-modul

    fireEvent.click(screen.getByRole('link', { name: /Salomlashish va tanishuv/ }))
    expect(screen.getByRole('heading', { name: 'Salomlashish va tanishuv' })).toBeTruthy() // modul
    expect(screen.getByText('Kontent tekshiruvda')).toBeTruthy()

    fireEvent.click(screen.getByRole('link', { name: /^Salomlashish/ })) // 1-dars
    expect(screen.getByText('1/8')).toBeTruthy()
    expect(screen.getByText('Bu qurilmada nemis ovozi yoʻq')).toBeTruthy() // jsdom'da ovoz yoʻq: sokin yozuv

    const lesson = LESSONS[0]
    await playLesson(lesson, { wrongOnce: true })
    expect(screen.getByRole('heading', { name: 'Dars tugadi' })).toBeTruthy() // natija
    expect(screen.getByText('6/7')).toBeTruthy()
    expect(screen.getByText('Xato qilingan')).toBeTruthy()
    const firstChoice = exercisesOf(lesson.id).find((e): e is ChoiceExercise => e.type === 'choice')!
    expect(screen.getByText(firstChoice.full)).toBeTruthy()

    click('Modulga qaytish')
    expect(screen.getByRole('heading', { name: 'Salomlashish va tanishuv' })).toBeTruthy()
    expect(screen.getByText('1 / 6 dars')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('qaldirgoch.lessons')!)['a1-m1-l1']).toMatchObject({ score: 6, total: 7 })
    // Dars soʻzlari takrorlash qutisiga tushdi (ertaga keladi), har mashq kunlik maqsadga qoʻshildi
    const words = JSON.parse(localStorage.getItem('qaldirgoch.words')!)
    expect(Object.keys(words)).toEqual(['a1-m1-hallo', 'a1-m1-guten-morgen', 'a1-m1-guten-tag', 'a1-m1-guten-abend'])
    expect(words['a1-m1-hallo']).toMatchObject({ due: addDays(localDay(), 1), interval: 1, mistakes: 0 })
    expect(JSON.parse(localStorage.getItem('qaldirgoch.activity')!)[localDay()].count).toBe(8)
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('X bosilsa tasdiq soʻraladi; "Chiqish" natijani saqlamaydi', () => {
    renderApp('/til/dars/a1-m1-l1')
    click('Darsdan chiqish')
    expect(screen.getByText('Darsdan chiqasizmi?')).toBeTruthy()
    expect(screen.getByText('Natija saqlanmaydi.')).toBeTruthy()
    click('Qolish')
    expect(screen.queryByText('Darsdan chiqasizmi?')).toBeNull()
    click('Darsdan chiqish')
    click('Chiqish')
    expect(screen.getByRole('heading', { name: 'Salomlashish va tanishuv' })).toBeTruthy()
    expect(localStorage.getItem('qaldirgoch.lessons')).toBeNull()
  })

  it('juftlash: xato juft xato hisoblanadi, hammasi topilmaguncha "Davom etish" yopiq', async () => {
    renderApp('/til/dars/a1-m1-l1')
    for (let i = 0; i < 4; i++) click('Keyingisi')
    for (let i = 0; i < 3; i++) {
      const ex = exercisesOf('a1-m1-l1')[4 + i] as ChoiceExercise
      fireEvent.click(screen.getByRole('button', { name: exact(ex.options.find((o) => o.correct)!.text) }))
      click('Davom etish')
    }
    const m = exercisesOf('a1-m1-l1')[7] as MatchExercise
    expect((screen.getByRole('button', { name: 'Davom etish' }) as HTMLButtonElement).disabled).toBe(true)
    await playMatch(m, true)
    click('Davom etish')
    expect(screen.getByText('6/7')).toBeTruthy()
    expect(screen.getByText(m.pairs[0].de)).toBeTruthy() // xato qilingan roʻyxatda
  })

  it('kirill interfeysda dars ochiladi', () => {
    renderApp('/til/dars/a1-m1-l1', 'uz-Cyrl')
    expect(screen.getByRole('heading', { name: 'Hallo' })).toBeTruthy()
    expect(screen.getByText('Салом')).toBeTruthy()
    expect(screen.getByText('ха-ло')).toBeTruthy()
  })

  it('nomaʼlum dars/modul — Til ekraniga qaytadi (boʻsh ekran emas)', () => {
    renderApp('/til/dars/yoq')
    expect(screen.getByRole('heading', { name: 'Nemis tili' })).toBeTruthy()
    cleanup()
    renderApp('/til/modul/yoq')
    expect(screen.getByRole('heading', { name: 'Nemis tili' })).toBeTruthy()
  })

  it('yoʻnalishni qoʻlda oʻzgartirish profilga yoziladi', () => {
    renderApp('/til')
    click('oʻzgartirish')
    fireEvent.click(screen.getByRole('radio', { name: 'Parvarish va tibbiyot' }))
    expect(screen.getByText('Yoʻnalish: Parvarish va tibbiyot')).toBeTruthy()
    expect(screen.queryByText('Ish joyida')).toBeNull()
    expect(JSON.parse(localStorage.getItem('qaldirgoch.profile')!).germanDirection).toBe('care')
  })
})
