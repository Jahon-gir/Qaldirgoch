// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { exercisesOf } from '../content/german'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { InstallProvider } from '../pwa/InstallProvider'
import { resetFeedbackAudio } from '../ui/feedback'
import { LessonsProvider } from './LessonsProvider'
import { localDay } from './srs'
import { lessonWords } from './vocab'
import { WordsProvider } from './WordsProvider'

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1, dailyGoal: 2 }
const NOW = '2026-11-01T00:00:00.000Z'
const done = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, { lessonId: id, score: 1, total: 1, completedAt: NOW }]))
const Where = () => <output data-testid="where">{useLocation().pathname}</output>
const where = () => screen.getByTestId('where').textContent

function seed({ lessons = done('a1-m1-l1'), profile = PROFILE }: { lessons?: Record<string, unknown>; profile?: Record<string, unknown> } = {}) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(profile))
  localStorage.setItem('qaldirgoch.lessons', JSON.stringify(lessons))
}

function renderApp(path: string, lang?: string) {
  if (lang) localStorage.setItem('qaldirgoch.lang', lang)
  return render(
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <ProgressProvider>
            <LessonsProvider>
              <WordsProvider>
                <InstallProvider>
                  <MemoryRouter initialEntries={[path]}>
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

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const stored = (k: string) => JSON.parse(localStorage.getItem(`qaldirgoch.${k}`) ?? 'null')
const TODAY = localDay()
const activityToday = () => stored('activity')?.[TODAY]?.count ?? 0
const L1 = lessonWords('a1-m1-l1')

// ---- ovoz va Web Audio taglari
let speak: ReturnType<typeof vi.fn>
let Ctx: ReturnType<typeof vi.fn>
beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
  speak = vi.fn()
  vi.stubGlobal('speechSynthesis', { getVoices: () => [{ lang: 'de-DE', name: 'de' }], speak, cancel: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() })
  vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; lang = ''; rate = 1; voice: unknown; constructor(t: string) { this.text = t } })
  resetFeedbackAudio()
  const param = () => ({ setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() })
  Ctx = vi.fn(function (this: Record<string, unknown>) {
    Object.assign(this, { currentTime: 0, state: 'running', destination: {}, resume: vi.fn(), createOscillator: () => ({ type: '', frequency: param(), connect: vi.fn(), start: vi.fn(), stop: vi.fn() }), createGain: () => ({ gain: param(), connect: vi.fn() }) })
  })
  vi.stubGlobal('AudioContext', Ctx)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Lugʻat ekrani', () => {
  it('Til ekranidagi "Soʻzlaringiz" kartochkasi Lugʻatga olib boradi', () => {
    seed()
    renderApp('/til/de')
    const link = screen.getByRole('link', { name: /Soʻzlaringiz: \d+ ta/ })
    fireEvent.click(link)
    expect(where()).toBe('/til/lugat')
  })

  it('sarlavha, qulf mantigʻi: tugatilgan dars — havola + "Ochiq"; tugatilmagan — qulf, bosilmaydi', () => {
    seed()
    renderApp('/til/lugat')
    expect(screen.getByRole('heading', { level: 1, name: 'Soʻzlaringiz' })).toBeTruthy()
    expect(screen.getByText(`A1 · ${L1.length} ta soʻz`)).toBeTruthy()
    const open = screen.getByRole('link', { name: /1-dars: Salomlashish/ })
    expect(within(open).getByText('Ochiq')).toBeTruthy()
    expect(within(open).getByText(`${L1.length} ta soʻz`)).toBeTruthy()
    // tugatilmagan dars: havola emas
    expect(screen.queryByRole('link', { name: /2-dars/ })).toBeNull()
    expect(screen.getAllByText('Darsni tugatgach ochiladi')).toHaveLength(4)
    // modul testi chiqmaydi
    expect(screen.queryByText(/Modul testi/)).toBeNull()
  })

  it('ochiq dars bor: "Barcha soʻzlarni aralash mashq qilish" Kartochka rejimida ochadi (faqat ochilgan darslar)', () => {
    seed({ lessons: done('a1-m1-l1', 'a1-m1-l2'), profile: { ...PROFILE, vocabMode: 'test' } })
    renderApp('/til/lugat')
    fireEvent.click(screen.getByRole('link', { name: 'Barcha soʻzlarni aralash mashq qilish' }))
    expect(where()).toBe('/til/lugat/aralash')
    expect(screen.getByText('Kartochka · 8 ta soʻz')).toBeTruthy() // saqlangan rejim Test, lekin aralash — Kartochka
    expect(screen.getByTestId('vocab-card')).toBeTruthy()
  })

  it('ochiq dars yoʻq: tugma oʻrniga "Birinchi darsni tugating" + darsga havola', () => {
    seed({ lessons: {} })
    renderApp('/til/lugat')
    expect(screen.queryByRole('link', { name: 'Barcha soʻzlarni aralash mashq qilish' })).toBeNull()
    expect(screen.getByText('Birinchi darsni tugating')).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Birinchi darsga oʻtish' }))
    expect(where()).toBe('/til/dars/a1-m1-l1')
  })

  it('qulflangan, notanish dars va ochiq dars yoʻq aralash — Lugʻat ekraniga qaytaradi', () => {
    seed()
    renderApp('/til/lugat/a1-m1-l2')
    expect(where()).toBe('/til/lugat')
    cleanup()
    renderApp('/til/lugat/yoq-dars')
    expect(where()).toBe('/til/lugat')
    cleanup()
    localStorage.setItem('qaldirgoch.lessons', '{}')
    renderApp('/til/lugat/aralash')
    expect(where()).toBe('/til/lugat')
  })
})

describe('Dars soʻzlari: Roʻyxat', () => {
  it('standart Roʻyxat/Nemischa: barcha soʻzlar, tarjima yashirin; qator bosilsa ochiladi/yopiladi; ovoz faqat oʻqiydi', () => {
    seed()
    renderApp('/til/lugat/a1-m1-l1')
    expect(screen.getByRole('heading', { level: 1, name: '1-dars: Salomlashish' })).toBeTruthy()
    expect(screen.getByText(`Roʻyxat · ${L1.length} ta soʻz`)).toBeTruthy()
    for (const w of L1) expect(screen.getByText(w.term)).toBeTruthy()
    expect(screen.queryByText(L1[0].tr.uz)).toBeNull()
    const row = screen.getByRole('button', { name: new RegExp(`^${L1[0].term}`) })
    expect(row.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(row)
    expect(screen.getByText(L1[0].tr.uz)).toBeTruthy()
    fireEvent.click(row)
    expect(screen.queryByText(L1[0].tr.uz)).toBeNull()
    // ovoz tugmasi: oʻqiydi, tarjimani ochmaydi
    fireEvent.click(screen.getByRole('button', { name: `Tinglash: ${L1[1].term}` }))
    expect(speak).toHaveBeenCalledTimes(1)
    expect((speak.mock.calls[0][0] as { text: string }).text).toBe(L1[1].term)
    expect(screen.queryByText(L1[1].tr.uz)).toBeNull()
  })

  it('"Hammasi" chipi hammasini ochadi va yopadi', () => {
    seed()
    renderApp('/til/lugat/a1-m1-l1')
    click('Hammasi')
    for (const w of L1) expect(screen.getByText(w.tr.uz)).toBeTruthy()
    click('Hammasi')
    for (const w of L1) expect(screen.queryByText(w.tr.uz)).toBeNull()
  })

  it('old tomoni Oʻzbekcha: oʻzbekcha koʻrinadi, nemischasi yashirin; ovoz baribir nemischani oʻqiydi', () => {
    seed({ profile: { ...PROFILE, vocabFront: 'tr' } })
    renderApp('/til/lugat/a1-m1-l1')
    expect(screen.getByText(L1[0].tr.uz)).toBeTruthy()
    expect(screen.queryByText(L1[0].term)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: `Tinglash: ${L1[0].term}` }))
    expect((speak.mock.calls[0][0] as { text: string }).text).toBe(L1[0].term)
  })
})

describe('Sozlash oynasi va saqlash', () => {
  it('usul bosilsa tanlov profilda saqlanadi, ekran shu usulga oʻtadi, keyingi safar shu bilan ochiladi', () => {
    seed()
    renderApp('/til/lugat/a1-m1-l1')
    click('Mashq sozlamalari')
    expect(screen.getByRole('radio', { name: 'Roʻyxat' }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(screen.getByRole('radio', { name: 'Kartochka' }))
    expect(stored('profile')).toMatchObject({ vocabMode: 'cards' })
    expect(screen.getByTestId('vocab-card')).toBeTruthy() // ekran darhol oʻtdi
    cleanup()
    renderApp('/til/lugat/a1-m1-l1')
    expect(screen.getByText(`Kartochka · ${L1.length} ta soʻz`)).toBeTruthy()
  })
})

describe('Kartochka', () => {
  const cards = () => ({ profile: { ...PROFILE, vocabMode: 'cards' } })
  it('bosilsa aylanadi (orqada tarjima); ovoz tugmasi kartochkani AYLANTIRMAYDI', () => {
    seed(cards())
    renderApp('/til/lugat/a1-m1-l1')
    const card = screen.getByTestId('vocab-card')
    expect(card.getAttribute('data-flipped')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: `Tinglash: ${L1[0].term}`, hidden: true }))
    expect(speak).toHaveBeenCalledTimes(1)
    expect(card.getAttribute('data-flipped')).toBe('false')
    fireEvent.click(card)
    expect(card.getAttribute('data-flipped')).toBe('true')
    fireEvent.click(card)
    expect(card.getAttribute('data-flipped')).toBe('false')
  })

  it('old va orqada til yorligʻi; Oʻzbekcha old tomonda ovoz tugmasi faqat nemischa (orqa) tomonda', () => {
    seed({ profile: { ...PROFILE, vocabMode: 'cards', vocabFront: 'tr' } })
    renderApp('/til/lugat/a1-m1-l1')
    const card = screen.getByTestId('vocab-card')
    expect(within(card).getByText('Oʻzbekcha')).toBeTruthy()
    expect(within(card).getByText('Nemischa')).toBeTruthy()
    const btn = within(card).getByRole('button', { name: `Tinglash: ${L1[0].term}`, hidden: true })
    expect(card.querySelectorAll('button')).toHaveLength(1) // oʻzbekcha tomonda ovoz tugmasi yoʻq
    expect(btn.closest('.card-back')).not.toBeNull()
  })

  it('"Bilmadim" soʻzi oxirida bir marta qaytadi; keyingi kartochka old tomondan; natija; kunlik maqsad +1', () => {
    seed({ profile: { ...PROFILE, vocabMode: 'cards' } })
    renderApp('/til/lugat/a1-m1-l1')
    const n = L1.length
    fireEvent.click(screen.getByTestId('vocab-card')) // aylantirib qoʻyamiz
    click('Bilmadim') // 1-soʻz xato
    expect(screen.getByTestId('vocab-card').getAttribute('data-flipped')).toBe('false') // keyingisi old tomondan
    expect(activityToday()).toBe(0)
    for (let i = 1; i < n; i++) click('Bildim')
    // oxirida 1-soʻz yana bir marta
    expect(within(screen.getByTestId('vocab-card')).getByText(L1[0].term)).toBeTruthy()
    click('Bilmadim') // yana xato — boshqa qaytmaydi
    expect(screen.getByRole('heading', { name: 'Mashq tugadi' })).toBeTruthy()
    expect(screen.getByText(`${n} tadan ${n - 1} tasini bildingiz`)).toBeTruthy()
    const unknown = screen.getByRole('region', { name: 'Bilmaganlaringiz' })
    expect(within(unknown).getByText(L1[0].term)).toBeTruthy()
    expect(screen.getByText('Bugungi maqsadga +1')).toBeTruthy()
    expect(activityToday()).toBe(1)
  })

  it('"Bilmaganlarimni qayta mashq qilish": faqat bilmaganlar; maqsadga qayta +1 qoʻshilmaydi; "Tayyor" orqaga', () => {
    seed({ profile: { ...PROFILE, vocabMode: 'cards' } })
    renderApp('/til/lugat/a1-m1-l1')
    const n = L1.length
    click('Bilmadim')
    for (let i = 1; i < n; i++) click('Bildim')
    click('Bildim') // qaytgan soʻz
    expect(activityToday()).toBe(1)
    click('Bilmaganlarimni qayta mashq qilish')
    expect(within(screen.getByTestId('vocab-card')).getByText(L1[0].term)).toBeTruthy()
    click('Bildim')
    expect(screen.getByText('1 tadan 1 tasini bildingiz')).toBeTruthy()
    expect(screen.queryByText('Bugungi maqsadga +1')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Bilmaganlarimni qayta mashq qilish' })).toBeNull()
    expect(activityToday()).toBe(1)
    click('Tayyor')
    expect(where()).toBe('/til/lugat')
  })

  it('oxirigacha tugatilmasa (chiqib ketilsa) maqsadga +1 yoʻq', () => {
    seed(cards())
    renderApp('/til/lugat/a1-m1-l1')
    click('Bildim')
    click('Orqaga')
    expect(activityToday()).toBe(0)
  })

  it('Lugʻat mashqi SRS jadvalini (keyingi_takror, interval, xatolar) OʻZGARTIRMAYDI', () => {
    seed(cards())
    renderApp('/til/lugat/a1-m1-l1')
    const before = localStorage.getItem('qaldirgoch.words')
    expect(before).toBeTruthy() // dars natijasi soʻzlarni qutiga solgan
    click('Bilmadim')
    for (let i = 1; i < L1.length; i++) click('Bildim')
    click('Bildim')
    expect(screen.getByRole('heading', { name: 'Mashq tugadi' })).toBeTruthy()
    expect(localStorage.getItem('qaldirgoch.words')).toBe(before)
  })

  it('"Bildim": ovoz yoqilgan boʻlsa Web Audio ishlaydi; "Ovoz effektlari" oʻchirilgan boʻlsa AudioContext chaqirilmaydi', () => {
    seed({ profile: { ...PROFILE, vocabMode: 'cards', soundEffects: false } })
    renderApp('/til/lugat/a1-m1-l1')
    click('Bildim')
    click('Bilmadim')
    expect(Ctx).not.toHaveBeenCalled()
    cleanup()
    resetFeedbackAudio()
    seed({ profile: { ...PROFILE, vocabMode: 'cards' } })
    renderApp('/til/lugat/a1-m1-l1')
    click('Bildim')
    expect(Ctx).toHaveBeenCalledTimes(1)
    click('Bilmadim')
    expect(Ctx).toHaveBeenCalledTimes(1) // qayta ishlatiladi
  })
})

describe('Test', () => {
  const testMode = (front?: string) => ({ profile: { ...PROFILE, vocabMode: 'test', ...(front ? { vocabFront: front } : {}) } })
  const group = () => screen.getByRole('group', { name: /Bu soʻz nima degani\?|Nemischasi qaysi\?/ })
  const current = () => L1.find((w) => screen.queryByRole('heading', { level: 1 }) && within(screen.getByText('Bu soʻz nima degani?').parentElement!).queryByText(w.term))!
  const answer = (right: boolean) => {
    const w = current()
    const btns = within(group()).getAllByRole('button')
    fireEvent.click(btns.find((b) => (b.textContent === w.tr.uz) === right)!)
    return w
  }

  it('savol bloki, 4 variant (shu darsdan), sarlavhada "Test · 1 / N"', () => {
    seed(testMode())
    renderApp('/til/lugat/a1-m1-l1')
    expect(screen.getByText(`Test · 1 / ${L1.length}`)).toBeTruthy()
    expect(screen.getByText('Bu soʻz nima degani?')).toBeTruthy()
    const btns = within(group()).getAllByRole('button')
    expect(btns).toHaveLength(4)
    const texts = btns.map((b) => b.textContent)
    expect(texts.every((t) => L1.some((w) => w.tr.uz === t))).toBe(true) // darsda 4 soʻz bor: variantlar shu darsdan
    expect((screen.getByRole('button', { name: 'Davom etish' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('javobdan keyin: toʻgʻrisi yashil + belgi, tanlangan xato qizil + X; toʻgʻri javobda pop, xatoda silkinish', () => {
    seed(testMode())
    renderApp('/til/lugat/a1-m1-l1')
    const w = current()
    const btns = within(group()).getAllByRole('button')
    const right = btns.find((b) => b.textContent === w.tr.uz)!
    const wrong = btns.find((b) => b.textContent !== w.tr.uz)!
    fireEvent.click(wrong)
    expect(wrong.className).toContain('border-danger')
    expect(wrong.className).toContain('fx-shake')
    expect(within(wrong).getByLabelText('Xato')).toBeTruthy()
    expect(right.className).toContain('border-success')
    expect(within(right).getByLabelText('Toʻgʻri')).toBeTruthy()
    expect(right.className).not.toContain('fx-pop')
    expect(btns.every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
    expect((screen.getByRole('button', { name: 'Davom etish' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('toʻgʻri javob: variant "pop" qiladi', () => {
    seed(testMode())
    renderApp('/til/lugat/a1-m1-l1')
    const w = current()
    const right = within(group()).getAllByRole('button').find((b) => b.textContent === w.tr.uz)!
    fireEvent.click(right)
    expect(right.className).toContain('fx-pop')
    expect(right.className).toContain('border-success')
  })

  it('xato soʻz test oxirida yana bir marta soʻraladi; natija; kunlik maqsad +1; SRS oʻzgarmaydi', () => {
    seed(testMode())
    renderApp('/til/lugat/a1-m1-l1')
    const wordsBefore = localStorage.getItem('qaldirgoch.words')
    const first = answer(false)
    click('Davom etish')
    for (let i = 1; i < L1.length; i++) {
      answer(true)
      click('Davom etish')
    }
    expect(screen.getByText(`Test · ${L1.length + 1} / ${L1.length + 1}`)).toBeTruthy()
    expect(within(screen.getByText('Bu soʻz nima degani?').parentElement!).getByText(first.term)).toBeTruthy()
    answer(true)
    click('Davom etish')
    expect(screen.getByRole('heading', { name: 'Mashq tugadi' })).toBeTruthy()
    expect(screen.getByText(`${L1.length} tadan ${L1.length - 1} tasini bildingiz`)).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Bilmaganlaringiz' })).getByText(first.term)).toBeTruthy()
    expect(activityToday()).toBe(1)
    expect(localStorage.getItem('qaldirgoch.words')).toBe(wordsBefore)
  })

  it('vocabFront Oʻzbekcha boʻlsa ham test savol tili doim nemischa → oʻzbekcha', () => {
    seed(testMode('tr'))
    renderApp('/til/lugat/a1-m1-l1')
    expect(screen.getByText('Bu soʻz nima degani?')).toBeTruthy()
    expect(screen.queryByText('Nemischasi qaysi?')).toBeNull()
    expect(within(screen.getByText('Bu soʻz nima degani?').parentElement!).getByText(L1[0].term)).toBeTruthy()
    const btns = within(group()).getAllByRole('button')
    expect(btns.every((b) => L1.some((w) => w.tr.uz === b.textContent))).toBe(true)
  })
})

describe('Rus tili', () => {
  it('Lugʻat va kartochka matnlari ruscha', () => {
    seed({ profile: { ...PROFILE, vocabMode: 'cards' } })
    renderApp('/til/lugat/a1-m1-l1', 'ru')
    expect(screen.getByRole('heading', { level: 1, name: 'Урок 1: Приветствия' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Знаю' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Не знаю' })).toBeTruthy()
  })
})

describe('Dars natijasidagi soʻzlar bloki', () => {
  function playLesson(id: string) {
    for (const ex of exercisesOf(id)) {
      if (ex.type === 'word') click('Keyingisi')
      else if (ex.type === 'choice') {
        fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${ex.options.find((o) => o.correct)!.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }))
        click('Davom etish')
      } else {
        for (const p of ex.pairs) {
          fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${p.term}$`) }))
          fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${p.tr.uz}$`) }))
        }
        click('Davom etish')
      }
    }
  }

  it('"Bu darsda oʻrgangan soʻzlaringiz: N ta": birinchi 3 tasi + "+ yana N ta", ertaga takrorlash, tugma Lugʻatga', () => {
    seed({ lessons: {} })
    renderApp('/til/dars/a1-m1-l1')
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    playLesson('a1-m1-l1')
    vi.useRealTimers()
    const block = screen.getByRole('region', { name: `Bu darsda oʻrgangan soʻzlaringiz: ${L1.length} ta` })
    for (const w of L1.slice(0, 3)) {
      expect(within(block).getByText(w.term)).toBeTruthy()
      expect(within(block).getByText(w.tr.uz)).toBeTruthy()
      expect(within(block).getByRole('button', { name: `Tinglash: ${w.term}` })).toBeTruthy()
    }
    expect(within(block).queryByText(L1[3].term)).toBeNull()
    expect(within(block).getByText(`+ yana ${L1.length - 3} ta`)).toBeTruthy()
    expect(within(block).getByText('Ertaga takrorlashga keladi')).toBeTruthy()
    click('Soʻzlarni mashq qilish')
    expect(where()).toBe('/til/lugat/a1-m1-l1')
    expect(screen.getByRole('heading', { level: 1, name: '1-dars: Salomlashish' })).toBeTruthy()
  })
})

describe('Sozlamalar: Ovoz effektlari', () => {
  it('yoqish/oʻchirish profilda soundEffects ga yoziladi (standart yoqilgan)', () => {
    seed()
    renderApp('/sozlamalar')
    const sw = screen.getByRole('switch', { name: /Ovoz effektlari/ })
    expect(sw.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(sw)
    expect(sw.getAttribute('aria-checked')).toBe('false')
    expect(stored('profile').soundEffects).toBe(false)
    cleanup()
    renderApp('/sozlamalar')
    expect(screen.getByRole('switch', { name: /Ovoz effektlari/ }).getAttribute('aria-checked')).toBe('false')
    fireEvent.click(screen.getByRole('switch', { name: /Ovoz effektlari/ }))
    expect(stored('profile').soundEffects).toBe(true)
  })
})
