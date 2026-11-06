// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { I18nProvider } from '../i18n/I18nProvider'
import { ProfileProvider } from '../profile/ProfileProvider'
import { ProgressProvider } from '../progress/ProgressProvider'
import { InstallProvider } from '../pwa/InstallProvider'
import { LessonsProvider } from './LessonsProvider'
import { localDay, type Words } from './srs'
import { act } from '@testing-library/react'
import { CLOSE_MS, PICK_DELAY_MS } from '../components/vocab/SettingsSheet'
import { lessonWords } from './vocab'
import { WordsProvider } from './WordsProvider'

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1, dailyGoal: 2 }
const NOW = '2026-11-01T00:00:00.000Z'
const TODAY = localDay()
const done = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, { lessonId: id, score: 1, total: 1, completedAt: NOW }]))

function seed({ lessons = done('a1-m1-l1'), profile = {}, words }: { lessons?: Record<string, unknown>; profile?: Record<string, unknown>; words?: Words } = {}) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify({ ...PROFILE, ...profile }))
  localStorage.setItem('qaldirgoch.lessons', JSON.stringify(lessons))
  if (words) localStorage.setItem('qaldirgoch.words', JSON.stringify(words))
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
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const stored = (k: string) => JSON.parse(localStorage.getItem(`qaldirgoch.${k}`) ?? 'null')

type Utt = { text: string; rate: number }
let spoken: Utt[]
function withVoice() {
  vi.stubGlobal('speechSynthesis', { getVoices: () => [{ lang: 'de-DE', name: 'de' }], speak: (u: Utt) => spoken.push(u), cancel: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() })
  vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; lang = ''; rate = 1; voice: unknown; constructor(t: string) { this.text = t } })
}
beforeEach(() => {
  localStorage.clear()
  spoken = []
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/* ---------- Harflardan yigʻish ---------- */

const tilesGroup = () => screen.getByRole('group', { name: 'Nemischa yozing' })
const tile = (c: string) => within(tilesGroup()).getAllByRole('button').find((b) => b.textContent === c && !(b as HTMLButtonElement).disabled)!
const answerLabel = () => screen.getByRole('img', { name: /^Javobingiz:/ }).getAttribute('aria-label')

describe('Harflardan yigʻish', () => {
  beforeEach(() => {
    withVoice()
    seed({ profile: { vocabMode: 'build' } })
    renderApp('/til/lugat/a1-m1-l1')
  })

  it('savol tarjima, kataklar har harfga; target harflari + 2 chalgʻituvchi; bosilgan harf xiralashadi', () => {
    expect(screen.getByText('Harflardan yigʻish · 1 / 4')).toBeTruthy()
    expect(screen.getByText('Salom')).toBeTruthy() // Hallo
    expect(within(tilesGroup()).getAllByRole('button')).toHaveLength(5 + 2)
    const h = tile('H')
    fireEvent.click(h)
    expect((h as HTMLButtonElement).disabled).toBe(true)
    expect(answerLabel()).toBe('Javobingiz: H')
  })

  it('"Orqaga" oxirgi harfni qaytaradi', () => {
    fireEvent.click(tile('H'))
    fireEvent.click(tile('a'))
    click('Orqaga: oxirgisini qaytarish')
    expect(answerLabel()).toBe('Javobingiz: H')
    expect(within(tilesGroup()).getAllByRole('button').filter((b) => b.textContent === 'a' && !(b as HTMLButtonElement).disabled).length).toBeGreaterThan(0)
  })

  it('"Yordam": keyingi toʻgʻri harf; avval qoʻyilganlar notoʻgʻri boʻlsa — hammasini tozalaydi', () => {
    click('Yordam: keyingi toʻgʻri harf')
    expect(answerLabel()).toBe('Javobingiz: H')
    fireEvent.click(tile('o')) // notoʻgʻri
    click('Yordam: keyingi toʻgʻri harf')
    expect(answerLabel()).toBe('Javobingiz: H') // tozalanib, toʻgʻri harf qoʻyildi
    click('Yordam: keyingi toʻgʻri harf')
    expect(answerLabel()).toBe('Javobingiz: Ha')
  })

  it('hamma katak toʻlganda avtomatik tekshiriladi: toʻgʻri — soʻz oʻqiladi', () => {
    for (const c of 'Hallo') fireEvent.click(tile(c))
    expect(screen.getByText('Toʻgʻri: Hallo')).toBeTruthy()
    expect(spoken.map((u) => u.text)).toContain('Hallo')
    expect((screen.getByRole('button', { name: 'Davom etish' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('xato: toʻgʻri javob koʻrsatiladi + "Davom etish"', () => {
    for (const c of 'Halol') fireEvent.click(tile(c))
    expect(screen.getByText('Xato. Toʻgʻri javob: Hallo')).toBeTruthy()
    expect(spoken).toHaveLength(0)
    click('Davom etish')
    expect(screen.getByText('Harflardan yigʻish · 2 / 5')).toBeTruthy() // xato soʻz oxirida yana
  })
})

describe('Soʻz boʻlaklaridan yigʻish (3+ soʻz)', () => {
  it('boʻlaklar + 1 chalgʻituvchi; qoʻyilganini bosish qaytaradi; hammasi qoʻyilganda tekshiriladi', () => {
    withVoice()
    seed({ lessons: done('a1-m1-l5'), profile: { vocabMode: 'build' } })
    renderApp('/til/lugat/a1-m1-l5')
    const first = lessonWords('a1-m1-l5')[0]
    const parts = first.de.split(' ')
    expect(parts.length).toBe(3)
    const pool = () => screen.getByRole('group', { name: 'Soʻzlardan gap tuzing' })
    expect(within(pool()).getAllByRole('button')).toHaveLength(4)
    const put = (c: string) => fireEvent.click(within(pool()).getAllByRole('button').find((b) => b.textContent === c && !(b as HTMLButtonElement).disabled)!)
    put(parts[1])
    const answer = screen.getByRole('group', { name: /^Javobingiz:/ })
    fireEvent.click(within(answer).getByRole('button', { name: parts[1] })) // qaytarildi
    expect(screen.getByRole('group', { name: 'Javobingiz: boʻsh' })).toBeTruthy()
    for (const p of parts) put(p)
    expect(screen.getByText(`Toʻgʻri: ${first.de}`)).toBeTruthy()
  })
})

/* ---------- Tinglab topish ---------- */

describe('Tinglab topish', () => {
  it('yozuv yoʻq; ochilganda bir marta oʻqiladi (0.8); sekin — 0.45; toʻgʻri variant yashil va tarjimasi', () => {
    withVoice()
    seed({ profile: { vocabMode: 'listen' } })
    renderApp('/til/lugat/a1-m1-l1')
    expect(screen.getByText('Qaysi soʻzni eshitdingiz?')).toBeTruthy()
    expect(spoken).toEqual([expect.objectContaining({ text: 'Hallo', rate: 0.8 })])
    click('Sekin tinglash')
    expect(spoken[1]).toMatchObject({ text: 'Hallo', rate: 0.45 })
    const group = screen.getByRole('group', { name: 'Qaysi soʻzni eshitdingiz?' })
    const btns = within(group).getAllByRole('button')
    expect(btns).toHaveLength(4)
    expect(screen.queryByText('Salom')).toBeNull()
    const right = btns.find((b) => b.textContent === 'Hallo')!
    fireEvent.click(right)
    expect(right.className).toContain('border-success')
    expect(within(right).getByText('Salom')).toBeTruthy()
  })

  it('ovoz yoʻq: sozlash oynasida kulrang izoh bilan; saqlangan Tinglash — Test bilan almashtiriladi', () => {
    seed({ profile: { vocabMode: 'listen' } }) // jsdom'da speechSynthesis yoʻq
    renderApp('/til/lugat/a1-m1-l1')
    expect(screen.getByText('Test · 1 / 4')).toBeTruthy()
    expect(screen.getByText('Bu soʻz nima degani?')).toBeTruthy()
    click('Mashq sozlamalari')
    const listen = screen.getByRole('radio', { name: /Tinglab topish/ })
    expect(listen.getAttribute('aria-disabled')).toBe('true')
    expect(within(listen).getByText('Telefoningizda nemischa ovoz yoʻq')).toBeTruthy()
    fireEvent.click(listen)
    expect(stored('profile').vocabMode).toBe('listen') // oʻzgarmadi
    expect(screen.getByRole('radio', { name: 'Test' }).getAttribute('aria-checked')).toBe('true')
  })
})

/* ---------- Yozish ---------- */

describe('Yozish', () => {
  const input = () => screen.getByRole('textbox', { name: 'Nemischa javob' }) as HTMLInputElement
  const type = (v: string) => fireEvent.change(input(), { target: { value: v } })
  beforeEach(() => {
    seed({ lessons: done('a1-m1-l2'), profile: { vocabMode: 'write' } })
    renderApp('/til/lugat/a1-m1-l2')
  })

  it('maydon: autocomplete/autocorrect/autocapitalize/spellcheck oʻchirilgan; boʻsh — "Avval javobni yozing"', () => {
    expect(input().getAttribute('autocomplete')).toBe('off')
    expect(input().getAttribute('autocorrect')).toBe('off')
    expect(input().getAttribute('autocapitalize')).toBe('off')
    expect(input().getAttribute('spellcheck')).toBe('false')
    expect(screen.getByText('Xayr')).toBeTruthy() // Tschüss
    click('Tekshirish')
    expect(screen.getByRole('alert').textContent).toBe('Avval javobni yozing')
    expect(screen.getByRole('button', { name: 'Tekshirish' })).toBeTruthy() // keyingisiga oʻtmadi
  })

  it('exact — "Toʻgʻri"', () => {
    type('Tschüss')
    click('Tekshirish')
    expect(screen.getByRole('status').textContent).toBe('Toʻgʻri')
  })

  it('correct (ue) — yashil "Asl yozilishi"; Enter ham tekshiradi', () => {
    type('tschuess')
    fireEvent.submit(input().closest('form')!)
    expect(screen.getByRole('status').textContent).toBe('Toʻgʻri. Asl yozilishi: Tschüss')
    expect(screen.getByRole('status').className).toContain('success')
  })

  it('almost — sariq xabar; toʻgʻri hisoblanadi', () => {
    type('Tschuss')
    click('Tekshirish')
    const s = screen.getByRole('status')
    expect(s.textContent).toBe('Deyarli toʻgʻri — bitta harf farq qiladi. Toʻgʻrisi: Tschüss')
    expect(s.className).toContain('warn')
    click('Davom etish')
    expect(screen.getByText('Yozish · 2 / 4')).toBeTruthy() // qayta soʻralmadi: toʻgʻri
  })

  it('wrong — qizil "Toʻgʻri javob"; soʻz oxirida yana', () => {
    type('Hallo')
    click('Tekshirish')
    expect(screen.getByRole('status').textContent).toBe('Xato. Toʻgʻri javob: Tschüss')
    click('Davom etish')
    expect(screen.getByText('Yozish · 2 / 5')).toBeTruthy()
  })

  it('faqat javobdagi harflar: Tschüss → ü ß (ä ö yoʻq); tugma kursor turgan joyga qoʻyadi', () => {
    expect(screen.getAllByRole('button', { name: /harfini qoʻyish/ }).map((b) => b.textContent)).toEqual(['ü', 'ß'])
    type('Tschss')
    input().setSelectionRange(4, 4)
    click('ü harfini qoʻyish')
    expect(input().value).toBe('Tschüss')
  })
})

/* ---------- Artikl ---------- */

describe('Artikl', () => {
  it('darsda ot boʻlmasa sozlash oynasida yoʻq', () => {
    seed()
    renderApp('/til/lugat/a1-m1-l1')
    click('Mashq sozlamalari')
    expect(screen.queryByRole('radio', { name: /Artikl/ })).toBeNull()
    expect(screen.getAllByRole('radio')).toHaveLength(7) // Artikl yoʻq, til boʻlimi yoʻq
  })

  it('"___ Elektriker", uch tugma; toʻgʻri — yashil ramka va "Toʻgʻri: der Elektriker"; faqat otlar soʻraladi', () => {
    seed({ lessons: done('a1-m1-l4'), profile: { vocabMode: 'article' } })
    renderApp('/til/lugat/a1-m1-l4')
    expect(screen.getByText('Artikl (der/die/das) · 1 / 5')).toBeTruthy()
    expect(screen.getByText(/Artiklni tanlang · /)).toBeTruthy()
    expect(screen.getByText('Elektriker')).toBeTruthy()
    const der = screen.getByRole('button', { name: 'der (erkak)' })
    expect(screen.getByRole('button', { name: 'die (ayol)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'das (oʻrta)' })).toBeTruthy()
    fireEvent.click(der)
    expect(der.className).toContain('ring-success')
    expect(screen.getByRole('status').textContent).toBe('Toʻgʻri: der Elektriker')
  })

  it('xato artikl — qizil ramka', () => {
    seed({ lessons: done('a1-m1-l4'), profile: { vocabMode: 'article' } })
    renderApp('/til/lugat/a1-m1-l4')
    const die = screen.getByRole('button', { name: 'die (ayol)' })
    fireEvent.click(die)
    expect(die.className).toContain('ring-danger')
    expect(screen.getByRole('status').textContent).toBe('Xato. Toʻgʻri javob: der Elektriker')
  })

  it('Roʻyxatda artikl soʻzi rangda', () => {
    seed({ lessons: done('a1-m1-l4') })
    renderApp('/til/lugat/a1-m1-l4')
    expect(screen.getAllByText('der')[0].className).toContain('text-der')
    expect(screen.getByText('die').className).toContain('text-die')
  })
})

/* ---------- Sozlash oynasi va Aralash ---------- */

describe('Sozlash oynasi va Aralash', () => {
  it('8 usul (ot bor darsda), yangi qiymat profilda saqlanadi', () => {
    withVoice()
    seed({ lessons: done('a1-m1-l4') })
    renderApp('/til/lugat/a1-m1-l4')
    click('Mashq sozlamalari')
    const names = ['Roʻyxat', 'Kartochka', 'Test', 'Harflardan yigʻish', 'Tinglab topish', 'Yozish', 'Artikl (der/die/das)', 'Aralash']
    for (const n of names) expect(screen.getByRole('radio', { name: n })).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: 'Aralash' }))
    expect(stored('profile').vocabMode).toBe('mixed')
    expect(screen.getByText(/^Aralash · 1 \/ \d+$/)).toBeTruthy()
  })
})

/* ---------- Takrorlash: usul soʻz holatiga qarab ---------- */

describe('Takrorlash sessiyasi', () => {
  const st = (interval: number) => ({ due: TODAY, interval, mistakes: 0, updatedAt: NOW })
  const input = () => screen.getByRole('textbox', { name: 'Nemischa javob' }) as HTMLInputElement

  it('14 kunlik soʻz — Yozish; "almost" SRS da toʻgʻri (keyingi oraliq)', () => {
    seed({ lessons: {}, words: { 'a1-m1-hallo': st(14) } })
    renderApp('/til/takrorlash')
    expect(screen.getByText('Nemischa yozing')).toBeTruthy()
    fireEvent.change(input(), { target: { value: 'Halo' } })
    click('Tekshirish')
    expect(screen.getByRole('status').textContent).toBe('Deyarli toʻgʻri — bitta harf farq qiladi. Toʻgʻrisi: Hallo')
    expect(stored('words')['a1-m1-hallo'].interval).toBe(30)
    click('Davom etish')
    expect(screen.getByRole('heading', { name: 'Takrorlash tugadi' })).toBeTruthy()
    expect(screen.getByText('1 ta soʻz takrorlandi, 1 tasi toʻgʻri')).toBeTruthy()
  })

  it('14 kunlik gap (3+ soʻz) — soʻz boʻlaklaridan yigʻish', () => {
    seed({ lessons: {}, words: { 'a1-m1-ich-komme-aus-usbekistan': st(14) } })
    renderApp('/til/takrorlash')
    expect(screen.getByRole('group', { name: 'Soʻzlardan gap tuzing' })).toBeTruthy()
  })

  it('7 kunlik soʻzlar: yigʻish va tinglash navbat bilan', () => {
    withVoice()
    seed({ lessons: {}, words: { 'a1-m1-hallo': st(7), 'a1-m1-tschuess': st(7) } })
    renderApp('/til/takrorlash')
    expect(screen.getByRole('group', { name: 'Nemischa yozing' })).toBeTruthy() // 1-soʻz: yigʻish
    for (const c of 'Hallo') fireEvent.click(within(screen.getByRole('group', { name: 'Nemischa yozing' })).getAllByRole('button').find((b) => b.textContent === c && !(b as HTMLButtonElement).disabled)!)
    expect(stored('words')['a1-m1-hallo'].interval).toBe(14)
    click('Davom etish')
    expect(screen.getByText('Qaysi soʻzni eshitdingiz?')).toBeTruthy() // 2-soʻz: tinglash
  })

  it('7 kunlik, ovoz yoʻq — tinglash oʻrniga yigʻish', () => {
    seed({ lessons: {}, words: { 'a1-m1-hallo': st(7), 'a1-m1-tschuess': st(7) } })
    renderApp('/til/takrorlash')
    for (const c of 'Hallo') fireEvent.click(within(screen.getByRole('group', { name: 'Nemischa yozing' })).getAllByRole('button').find((b) => b.textContent === c && !(b as HTMLButtonElement).disabled)!)
    click('Davom etish')
    expect(screen.getByRole('group', { name: 'Nemischa yozing' })).toBeTruthy()
    expect(screen.queryByText('Qaysi soʻzni eshitdingiz?')).toBeNull()
  })

  it('xato: 1-oraliqqa qaytadi; sessiya oxirida qayta soʻralganda — Test', () => {
    seed({ lessons: {}, words: { 'a1-m1-hallo': st(30) } })
    renderApp('/til/takrorlash')
    fireEvent.change(input(), { target: { value: 'Tschüss' } })
    click('Tekshirish')
    expect(stored('words')['a1-m1-hallo']).toMatchObject({ interval: 1, mistakes: 1 })
    click('Davom etish')
    expect(screen.getByText('2 / 2')).toBeTruthy()
    expect(screen.getByText('Bu soʻz nima degani?')).toBeTruthy()
  })
})

/* ---------- 0.6.4: usul oynasi, DE ⇄ UZ, Yozishda harflar ---------- */

describe('Mashq usuli oynasi (A2)', () => {
  const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('"Tayyor" tugmasi va "Old tomoni / savol tili" boʻlimi yoʻq; 2 ustunli plitkalar, joriy usul belgilangan', () => {
    seed()
    renderApp('/til/lugat/a1-m1-l1')
    click('Mashq sozlamalari')
    expect(screen.getByRole('heading', { name: 'Mashq usuli' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Tayyor' })).toBeNull()
    expect(screen.queryByText('Old tomoni / savol tili')).toBeNull()
    const group = screen.getByRole('radiogroup', { name: 'Mashq usuli' })
    expect(group.className).toContain('grid-cols-2')
    expect(screen.getByRole('radio', { name: 'Roʻyxat' }).className).toContain('bg-sel')
    expect(screen.getByRole('radio', { name: 'Test' }).className).toContain('bg-vf')
    expect(screen.getAllByRole('radio').every((r) => r.className.includes('min-h-[72px]'))).toBe(true)
  })

  it('usul bosilsa: darhol saqlanadi va ekran oʻtadi; ~180 ms dan keyin oyna pastga sirpanadi, 0,3 s dan keyin yopiladi', () => {
    seed()
    renderApp('/til/lugat/a1-m1-l1')
    click('Mashq sozlamalari')
    fireEvent.click(screen.getByRole('radio', { name: 'Yozish' }))
    expect(stored('profile').vocabMode).toBe('write')
    expect(screen.getByRole('textbox', { name: 'Nemischa javob' })).toBeTruthy()
    const dialog = screen.getByRole('dialog')
    advance(PICK_DELAY_MS - 20)
    expect(dialog.className).not.toContain('sheet-down')
    advance(40)
    expect(screen.getByRole('dialog').className).toContain('sheet-down')
    advance(CLOSE_MS)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('fon (dim) bosilsa — tanlovsiz yopiladi', () => {
    seed()
    renderApp('/til/lugat/a1-m1-l1')
    click('Mashq sozlamalari')
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    advance(CLOSE_MS + 20)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(stored('profile').vocabMode).toBeUndefined()
    expect(screen.getByText(`Roʻyxat · ${lessonWords('a1-m1-l1').length} ta soʻz`)).toBeTruthy()
  })

  it('prefers-reduced-motion: oyna darhol yopiladi', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    seed()
    renderApp('/til/lugat/a1-m1-l1')
    click('Mashq sozlamalari')
    fireEvent.click(screen.getByRole('radio', { name: 'Test' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(stored('profile').vocabMode).toBe('test')
  })
})

describe('Kartochka: DE ⇄ UZ chipi', () => {
  it('old tomon tili almashadi va saqlanadi; joriy kartochka old tomondan qayta ochiladi; mashq qayta boshlanmaydi', () => {
    seed({ profile: { vocabMode: 'cards' } })
    renderApp('/til/lugat/a1-m1-l1')
    const words = lessonWords('a1-m1-l1')
    click('Bildim') // 2-kartochka
    fireEvent.click(screen.getByTestId('vocab-card'))
    expect(screen.getByTestId('vocab-card').getAttribute('data-flipped')).toBe('true')
    const chip = screen.getByRole('button', { name: /Old tomoni tilini almashtirish/ })
    expect(chip.textContent).toBe('DE ⇄ UZ')
    fireEvent.click(chip)
    expect(stored('profile').vocabFront).toBe('tr')
    const card = screen.getByTestId('vocab-card')
    expect(card.getAttribute('data-flipped')).toBe('false')
    expect(within(card).getAllByText(words[1].tr.uz).length).toBeGreaterThan(0) // hali 2-soʻz (qayta boshlanmadi)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Old tomoni tilini almashtirish/ }))
    expect(stored('profile').vocabFront).toBe('de')
  })
})

describe('Yozish: harflar qatori', () => {
  it('soʻzda ä ö ü ß boʻlmasa qator umuman yoʻq (Hallo)', () => {
    seed({ profile: { vocabMode: 'write' } })
    renderApp('/til/lugat/a1-m1-l1')
    expect(screen.getByRole('textbox', { name: 'Nemischa javob' })).toBeTruthy()
    expect(screen.queryAllByRole('button', { name: /harfini qoʻyish/ })).toHaveLength(0)
  })
  it('takrorlashdagi Yozishda ham (Tschüss, 14 kun): ü ß, 52×48', () => {
    seed({ lessons: {}, words: { 'a1-m1-tschuess': { due: TODAY, interval: 14, mistakes: 0, updatedAt: NOW } } })
    renderApp('/til/takrorlash')
    const btns = screen.getAllByRole('button', { name: /harfini qoʻyish/ })
    expect(btns.map((b) => b.textContent)).toEqual(['ü', 'ß'])
    expect(btns.every((b) => b.className.includes('w-[52px]') && b.className.includes('h-12'))).toBe(true)
  })
})
