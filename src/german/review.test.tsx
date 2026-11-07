// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { exercisesOf } from '../content/german'
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
const PROFILE2 = { ...PROFILE, dailyGoal: 2 } // kunlik maqsad: 2 (dars yoki takrorlash)
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
// Hammasi 1/3 kunlik oraliqda — Test usuli (0.6.3: 7+ kunlik soʻzlar boshqa usulda keladi, alohida testda)
const WORDS3: Words = { 'a1-m1-hallo': due(3), 'a1-m1-guten-tag': due(3), 'a1-m1-der-koch': due(1, 1) }
const stored = (): Words => JSON.parse(localStorage.getItem('qaldirgoch.words')!)
const activityToday = () => JSON.parse(localStorage.getItem('qaldirgoch.activity')!)[TODAY]?.count ?? 0
const where = () => screen.getByTestId('where').textContent
const exact = (x: string) => new RegExp(`^${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

/** Darsni oxirigacha bajaradi (hammasi toʻgʻri); oxirgi qadamdan keyin natija ekrani ochiladi. */
function playLesson(lessonId: string) {
  for (const ex of exercisesOf(lessonId)) {
    if (ex.type === 'word') click('Keyingisi')
    else if (ex.type === 'choice') {
      fireEvent.click(screen.getByRole('button', { name: exact(ex.options.find((o) => o.correct)!.text) }))
      click('Davom etish')
    } else {
      for (const p of ex.pairs) {
        fireEvent.click(screen.getByRole('button', { name: exact(p.de) }))
        fireEvent.click(screen.getByRole('button', { name: exact(p.tr.uz) }))
      }
      click('Davom etish')
    }
  }
}

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
    expect(activityToday()).toBe(0) // alohida javob maqsadga qoʻshilmaydi
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

  it('natija: soni, toʻgʻrilari, streak, xatolar roʻyxati; "Tayyor" oldingi ekranga qaytaradi (maqsad 2: hali bajarilmagan)', () => {
    seed({ words: WORDS3, profile: PROFILE2 })
    renderApp(['/til', '/til/takrorlash'])
    const missed = answer(false)
    fireEvent.click(screen.getByRole('button', { name: 'Davom etish' }))
    answer(true)
    advance()
    answer(true)
    advance()
    expect(activityToday()).toBe(0) // sessiya hali tugamadi
    // xato soʻz yana: endi toʻgʻri, lekin jadval oʻzgarmaydi (ertaga)
    expect(currentWord().w.id).toBe(missed.id)
    answer(true)
    expect(stored()[missed.id]).toMatchObject({ interval: 1, due: addDays(TODAY, 1) })
    advance()
    expect(screen.getByRole('heading', { name: 'Takrorlash tugadi' })).toBeTruthy() // 1 < 2
    expect(screen.getByText('3 ta soʻz takrorlandi, 2 tasi toʻgʻri')).toBeTruthy()
    expect(screen.getByText('0 kun ketma-ket')).toBeTruthy()
    expect(activityToday()).toBe(1) // oxirigacha tugatilgan sessiya = +1 (4 ta javob emas)
    fireEvent.click(screen.getByRole('button', { name: 'Xato qilingan 1 ta soʻzni koʻrish' }))
    expect(screen.getByText(missed.de)).toBeTruthy()
    expect(screen.getByText(missed.tr.uz)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tayyor' }))
    expect(where()).toBe('/til')
    expect(screen.getByText(/Bugun takrorlash yoʻq\. Keyingisi: ertaga/)).toBeTruthy()
  })

  it('maqsad (standart 1) bajarilsa: "Bugungi maqsad bajarildi" va streak 1', () => {
    seed({ words: { 'a1-m1-hallo': due() } })
    renderApp(['/til', '/til/takrorlash'])
    answer(true)
    expect(activityToday()).toBe(0) // natija ekrani ochilmaguncha hisoblanmaydi
    advance()
    expect(screen.getByRole('heading', { name: 'Bugungi maqsad bajarildi' })).toBeTruthy()
    expect(screen.getByText('1 kun ketma-ket')).toBeTruthy()
    expect(activityToday()).toBe(1)
    expect(screen.queryByRole('button', { name: /Xato qilingan/ })).toBeNull()
  })

  it('takrorlash ikkinchi marta tugatilsa yana +1', () => {
    seed({ words: { 'a1-m1-hallo': due() }, profile: PROFILE2 })
    renderApp(['/til', '/til/takrorlash'])
    answer(true)
    advance()
    expect(activityToday()).toBe(1)
    click('Tayyor')
    // bir xil soʻz bugun yana kelsin (masalan, boshqa qurilmada oʻzgargan)
    localStorage.setItem('qaldirgoch.words', JSON.stringify({ 'a1-m1-hallo': due() }))
    cleanup()
    renderApp(['/til', '/til/takrorlash'])
    answer(true)
    advance()
    expect(activityToday()).toBe(2)
    expect(screen.getByRole('heading', { name: 'Bugungi maqsad bajarildi' })).toBeTruthy()
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
    expect(activityToday()).toBe(0) // tashlab chiqilgan sessiya hech narsa qoʻshmaydi
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
      profile: PROFILE2,
      words: { ...WORDS3, 'a1-m1-tschuess': { due: addDays(TODAY, 2), interval: 14, mistakes: 0, updatedAt: NOW }, 'a1-m1-gute-nacht': { due: addDays(TODAY, 1), interval: 1, mistakes: 0, updatedAt: NOW } },
      activity: { [TODAY]: { count: 1, goal: 2, forgiven: false }, [yesterday]: { count: 2, goal: 2, forgiven: false } }
    })
    renderApp('/til')
    expect(screen.getByRole('img', { name: 'Bugun 1 / 2 dars yoki takrorlash' })).toBeTruthy()
    expect(screen.getByText('1/2')).toBeTruthy()
    expect(screen.getByText('Bugungi maqsad')).toBeTruthy()
    expect(screen.getByText('Yana 1 ta dars yoki takrorlash qoldi')).toBeTruthy()
    expect(screen.getByRole('list', { name: 'Shu hafta kunlari' }).querySelectorAll('li')).toHaveLength(7)
    expect(screen.getByText('1 kun ketma-ket. Rekordingiz: 1 kun')).toBeTruthy()
    expect(screen.getByText('Bugun 3 ta soʻzni qaytarish vaqti')).toBeTruthy()
    // "Davom eting" — takrorlash kartochkasidan keyin, "Soʻzlaringiz" dan oldin
    const order = ['Bugun 3 ta soʻzni qaytarish vaqti', 'Davom eting', 'Soʻzlaringiz: 5 ta'].map((x) => screen.getByText(x))
    expect(order[0].compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(order[1].compareDocumentPosition(order[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Davom etish' }).getAttribute('href')).toBe('/til/dars/a1-m1-l1')
    expect(screen.getByText('Soʻzlaringiz: 5 ta')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Soʻzlar holati: Yangi 1, Oʻrganilmoqda 3, Mustahkam 1' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'A1 darajasi' })).toBeTruthy()
    expect(screen.getByText('0 / 6 dars tugatildi')).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Takrorlashni boshlash' }))
    expect(where()).toBe('/til/takrorlash')
  })

  it('maqsad bajarilgan holat', () => {
    seed({ activity: { [TODAY]: { count: 1, goal: 1, forgiven: false } } })
    renderApp('/til')
    expect(screen.getByText('Bugungi maqsad bajarildi')).toBeTruthy()
    expect(screen.queryByText(/qoldi/)).toBeNull()
    expect(screen.getByText(/Bugun takrorlash yoʻq/)).toBeTruthy()
  })
})

describe('"Davom eting" → dars → qaytish', () => {
  it('Til ekranidan kirilgan dars "Modulga qaytish"da modul ekraniga, "orqaga" — Til ekraniga olib boradi', () => {
    seed()
    renderApp('/til')
    fireEvent.click(screen.getByRole('link', { name: 'Davom etish' }))
    expect(where()).toBe('/til/dars/a1-m1-l1')
    fireEvent.click(screen.getByRole('button', { name: 'Darsdan chiqish' }))
    fireEvent.click(screen.getByRole('button', { name: 'Chiqish' }))
    expect(where()).toBe('/til/modul/a1-m1')
    act(() => goBack!())
    expect(where()).toBe('/til')
  })
})

describe('dars → takrorlash qutisi va kunlik maqsad (birlik — dars yoki takrorlash)', () => {
  it('tashlab chiqilgan dars hech narsa qoʻshmaydi: maqsad ham, takrorlash qutisi ham oʻzgarmaydi', () => {
    seed()
    renderApp(['/til/modul/a1-m1', '/til/dars/a1-m1-l1'])
    for (let i = 0; i < 4; i++) click('Keyingisi') // 4 qadam (mashqlar) bajarildi, lekin dars tugamadi
    expect(activityToday()).toBe(0)
    click('Darsdan chiqish')
    click('Chiqish')
    expect(where()).toBe('/til/modul/a1-m1')
    expect(activityToday()).toBe(0)
    expect(stored()).toEqual({})
  })

  it('dars OXIRIGACHA tugatilsa +1 (natija ekrani ochilganda), soʻzlari ertaga keladi; maqsad bajarilgan boʻlsa natijada yozuv', () => {
    seed()
    renderApp(['/til/modul/a1-m1', '/til/dars/a1-m1-l1'])
    playLesson('a1-m1-l1')
    expect(screen.getByRole('heading', { name: 'Dars tugadi' })).toBeTruthy()
    expect(screen.getByText('Bugungi maqsad bajarildi')).toBeTruthy() // standart maqsad 1
    expect(activityToday()).toBe(1)
    expect(Object.keys(stored())).toHaveLength(4)
  })

  it('maqsad hali bajarilmagan boʻlsa natijada "Bugungi maqsad bajarildi" yoʻq', () => {
    seed({ profile: PROFILE2 })
    renderApp(['/til/modul/a1-m1', '/til/dars/a1-m1-l1'])
    playLesson('a1-m1-l1')
    expect(screen.getByRole('heading', { name: 'Dars tugadi' })).toBeTruthy()
    expect(screen.queryByText('Bugungi maqsad bajarildi')).toBeNull()
    expect(activityToday()).toBe(1)
  })

  it('bitta darsni qayta tugatish ham +1', () => {
    seed({ profile: PROFILE2 })
    renderApp(['/til/modul/a1-m1', '/til/dars/a1-m1-l1'])
    playLesson('a1-m1-l1')
    click('Modulga qaytish')
    expect(where()).toBe('/til/modul/a1-m1')
    fireEvent.click(screen.getByRole('link', { name: /^Salomlashish/ }))
    playLesson('a1-m1-l1')
    expect(activityToday()).toBe(2)
    expect(screen.getByText('Bugungi maqsad bajarildi')).toBeTruthy()
  })
})

describe('Bosh sahifa va Sozlamalar', () => {
  it('Bosh ekranda nemis tili kartochkasi yoʻq; bugungi maqsad va takrorlash Til boʻlimida', () => {
    seed({ words: WORDS3, profile: PROFILE2, activity: { [TODAY]: { count: 1, goal: 2, forgiven: false } } })
    renderApp('/')
    expect(screen.queryByText(/^Bugun /)).toBeNull()
    expect(screen.queryByText(/takrorlash/i)).toBeNull()
    cleanup()
    renderApp('/til')
    expect(screen.getByRole('img', { name: 'Bugun 1 / 2 dars yoki takrorlash' })).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Takrorlashni boshlash' }))
    expect(where()).toBe('/til/takrorlash')
  })

  it('Sozlamalarda "Kunlik maqsad": 1 / 2 / 3, har birining ostida izoh; 3 tanlansa profilga yoziladi va bugungi maqsad oʻzgaradi', () => {
    seed({ activity: { [TODAY]: { count: 1, goal: 1, forgiven: false } } })
    renderApp(['/til', '/sozlamalar'])
    const group = screen.getByRole('radiogroup', { name: 'Kunlik maqsad' })
    expect(within(group).getAllByRole('radio').map((r) => r.getAttribute('aria-label'))).toEqual(['kuniga 1 dars yoki takrorlash', 'kuniga 2 dars yoki takrorlash', 'kuniga 3 dars yoki takrorlash'])
    expect(within(group).getByRole('radio', { name: 'kuniga 1 dars yoki takrorlash' }).getAttribute('aria-checked')).toBe('true')
    expect(within(group).getByText('kuniga 3 dars yoki takrorlash')).toBeTruthy() // koʻrinadigan izoh
    fireEvent.click(within(group).getByRole('radio', { name: 'kuniga 3 dars yoki takrorlash' }))
    expect(JSON.parse(localStorage.getItem('qaldirgoch.profile')!).dailyGoal).toBe(3)
    expect(JSON.parse(localStorage.getItem('qaldirgoch.activity')!)[TODAY]).toEqual({ count: 1, goal: 3, forgiven: false }) // bugungi kunga yangi maqsad
    fireEvent.click(screen.getByRole('button', { name: 'Orqaga' }))
    expect(screen.getByRole('img', { name: 'Bugun 1 / 3 dars yoki takrorlash' })).toBeTruthy()
  })

  it('maqsad 3 ga oshirilsa kechagi bajarilgan kun va streak saqlanadi', () => {
    const y = addDays(TODAY, -1)
    const y2 = addDays(TODAY, -2)
    seed({ activity: { [y2]: { count: 1, goal: 1, forgiven: false }, [y]: { count: 1, goal: 1, forgiven: false } } })
    renderApp(['/til', '/sozlamalar'])
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Kunlik maqsad' })).getByRole('radio', { name: 'kuniga 3 dars yoki takrorlash' }))
    fireEvent.click(screen.getByRole('button', { name: 'Orqaga' }))
    expect(screen.getByRole('img', { name: 'Bugun 0 / 3 dars yoki takrorlash' })).toBeTruthy()
    expect(screen.getByText(/^2 kun ketma-ket/)).toBeTruthy()
    const a = JSON.parse(localStorage.getItem('qaldirgoch.activity')!)
    expect(a[y]).toEqual({ count: 1, goal: 1, forgiven: false })
    expect(Object.values(a).some((d) => (d as { forgiven: boolean }).forgiven)).toBe(false)
  })

  it('Sozlamalar toʻgʻridan-toʻgʻri ochilsa "Orqaga" Bosh sahifaga olib boradi', () => {
    seed()
    renderApp('/sozlamalar')
    fireEvent.click(screen.getByRole('button', { name: 'Orqaga' }))
    expect(where()).toBe('/')
  })
})

describe('0.6.0 dan oʻtish: eski mashq birligidagi maʼlumot', () => {
  it('profildagi dailyGoal 10 / 15 / 20 → 1 / 2 / 3', () => {
    for (const [old, now] of [[10, 1], [15, 2], [20, 3]]) {
      seed({ profile: { ...PROFILE, dailyGoal: old } })
      renderApp(['/', '/sozlamalar'])
      const group = screen.getByRole('radiogroup', { name: 'Kunlik maqsad' })
      expect(within(group).getByRole('radio', { name: `kuniga ${now} dars yoki takrorlash` }).getAttribute('aria-checked')).toBe('true')
      cleanup()
    }
  })

  it('bugungi eski yozuv bajarilgan: maqsad bajarildi, oʻtgan kunlar oʻz birligida, streak va rekord saqlanadi', () => {
    const [y, y2, y3] = [1, 2, 3].map((n) => addDays(TODAY, -n))
    seed({
      profile: { ...PROFILE, dailyGoal: 10 },
      activity: {
        [TODAY]: { count: 12, goal: 10, forgiven: false },
        [y]: { count: 11, goal: 10, forgiven: false },
        [y2]: { count: 15, goal: 15, forgiven: false },
        [y3]: { count: 20, goal: 20, forgiven: false }
      }
    })
    renderApp('/til')
    expect(screen.getByText('Bugungi maqsad bajarildi')).toBeTruthy()
    expect(screen.getByText('4 kun ketma-ket. Rekordingiz: 4 kun')).toBeTruthy()
    const a = JSON.parse(localStorage.getItem('qaldirgoch.activity')!)
    expect(a[TODAY]).toEqual({ count: 1, goal: 1, forgiven: false }) // soni = yangi maqsad
    expect(a[y]).toEqual({ count: 11, goal: 10, forgiven: false })
    expect(a[y3]).toEqual({ count: 20, goal: 20, forgiven: false })
    expect(Object.values(a).some((d) => (d as { forgiven: boolean }).forgiven)).toBe(false) // kechirim sarflanmadi
  })

  it('bugungi eski yozuv bajarilmagan: 0 / yangi maqsad', () => {
    seed({ profile: { ...PROFILE, dailyGoal: 15 }, activity: { [TODAY]: { count: 9, goal: 15, forgiven: false } } })
    renderApp('/til')
    expect(screen.getByRole('img', { name: 'Bugun 0 / 2 dars yoki takrorlash' })).toBeTruthy()
    expect(screen.getByText('Yana 2 ta dars yoki takrorlash qoldi')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('qaldirgoch.activity')!)[TODAY]).toEqual({ count: 0, goal: 2, forgiven: false })
  })
})
