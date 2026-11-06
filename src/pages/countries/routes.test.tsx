// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../../App'
import { AuthProvider } from '../../auth/AuthProvider'
import { AUSBILDUNG_STEPS, BIBB, MIG } from '../../content/ausbildung'
import { I18nProvider } from '../../i18n/I18nProvider'
import { LessonsProvider } from '../../german/LessonsProvider'
import { WordsProvider } from '../../german/WordsProvider'
import { ProfileProvider } from '../../profile/ProfileProvider'
import { ProgressProvider } from '../../progress/ProgressProvider'

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1 }

function Where() {
  return <output data-testid="where">{useLocation().pathname}</output>
}

function renderApp(path: string, { lang, profile = PROFILE }: { lang?: string; profile?: Record<string, unknown> } = {}) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(profile))
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
                <Where />
              </MemoryRouter>
              </WordsProvider>
            </LessonsProvider>
          </ProgressProvider>
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
const where = () => screen.getByTestId('where').textContent
const h1 = (name: string) => expect(screen.getByRole('heading', { level: 1, name })).toBeTruthy()
const link = (name: string | RegExp) => fireEvent.click(screen.getByRole('link', { name }))
const savedProfile = () => JSON.parse(localStorage.getItem('qaldirgoch.profile')!)

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('marshrut: davlatlar → yoʻllar', () => {
  it('Bosh → Yoʻl menyusi → Davlatlar → Germaniya → Ausbildung → bosqich → orqaga', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderApp('/')
    link('Yoʻl') // pastki menyu — doim davlatlar roʻyxatiga
    expect(where()).toBe('/yol')
    h1('Qaysi davlatni tanlaysiz?')
    expect(screen.getByText('Faqat qonuniy, tekshirilgan yoʻllar')).toBeTruthy()
    link(/^Germaniya/)
    expect(where()).toBe('/yol/de')
    h1('Germaniya')
    expect(screen.getByText('Qaysi yoʻl bilan borasiz?')).toBeTruthy()
    link(/^Ausbildung/)
    expect(where()).toBe('/yol/de/ausbildung/kirish') // kartochka endi kirish ekraniga olib boradi
    h1('Ausbildung')
    link('Batafsil oʻqish')
    expect(where()).toBe('/yol/de/ausbildung/batafsil')
    h1('Ausbildung haqida toʻliq')
    link('Ausbildung') // orqaga → kirish ekrani
    expect(where()).toBe('/yol/de/ausbildung/kirish')
    link('Yoʻl xaritasini ochish')
    expect(where()).toBe('/yol/de/ausbildung')
    h1('Sizning yoʻlingiz')
    link(/^8Viza/)
    expect(where()).toBe('/yol/de/ausbildung/viza')
    h1('Viza')
    link('Orqaga')
    expect(where()).toBe('/yol/de/ausbildung')
    h1('Sizning yoʻlingiz')
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('Davlatlar → Koreya → orqaga; "oʻtish" tugmasi yoʻq; yopiq davlat tanlovni oʻzgartirmaydi', () => {
    renderApp('/yol')
    expect(savedProfile().selectedCountry).toBeUndefined()
    link(/^Janubiy Koreya/)
    expect(where()).toBe('/yol/kr')
    h1('Janubiy Koreya')
    expect(screen.getByText('Keyingi versiyada ochiladi')).toBeTruthy()
    expect(screen.getByText('EPS davlatlararo dastur. «Tez joylashtiramiz» degan xususiy vositachilarga ishonmang.')).toBeTruthy()
    expect(screen.getByText('Yoʻl xaritasi, til kursi va talablar hali tekshirilmoqda')).toBeTruthy()
    expect(savedProfile().selectedCountry).toBeUndefined()
    expect(screen.queryByRole('link', { name: 'Germaniyaga oʻtish' })).toBeNull()
    link('Davlatlar') // orqaga strelka
    expect(where()).toBe('/yol')
    h1('Qaysi davlatni tanlaysiz?')
  })

  it('yopiq davlat bosilganda profildagi tanlov oʻzgarmaydi (oldindan Germaniya)', () => {
    renderApp('/yol', { profile: { ...PROFILE, selectedCountry: 'de' } })
    for (const name of [/^Yaponiya/, /^Buyuk Britaniya/]) {
      link(name)
      expect(screen.getByText('Keyingi versiyada ochiladi')).toBeTruthy()
      link(/Davlatlar/)
      expect(savedProfile().selectedCountry).toBe('de')
    }
    link(/^Yaponiya/)
    expect(screen.queryByText('Yoʻl xaritasi, til kursi va talablar hali tekshirilmoqda')).toBeNull()
  })

  it('Chancenkarte manzili toʻgʻridan-toʻgʻri ochilsa → orqaga; "oʻtish" tugmasi yoʻq; rasmiy havola xavfsiz', () => {
    renderApp('/yol/de/chancenkarte')
    h1('Chancenkarte')
    expect(screen.getByTestId('source').textContent).toBe('Manba: make-it-in-germany.com · tekshirilgan: 2026-11-04')
    const a = screen.getByRole('link', { name: /Rasmiy sahifani ochish/ }) as HTMLAnchorElement
    expect(a.href).toBe('https://www.make-it-in-germany.com/en/for-qualified-professionals/visa/kinds-of-visa')
    expect(a.target).toBe('_blank')
    expect(a.rel).toContain('noopener')
    expect(screen.queryByRole('link', { name: 'Ausbildung yoʻliga oʻtish' })).toBeNull()
    link('Orqaga')
    expect(where()).toBe('/yol/de')
    h1('Germaniya')
  })

  it('Koreya yoʻli tafsiloti: gov.uz manbasi va tekshiruvda belgisi', () => {
    renderApp('/yol/kr/eps')
    h1('EPS (E-9 viza)')
    expect(screen.getByTestId('source').textContent).toBe('Manba: gov.uz · tekshirilgan: 2026-11-04')
    expect(screen.getByText('Tekshiruvda')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Germaniyaga oʻtish' })).toBeNull()
    link('Orqaga')
    expect(where()).toBe('/yol/kr')
    h1('Janubiy Koreya')
  })

  it('eski havolalar yangi manzilga oʻtadi; notanish manzil boʻsh ekran bermaydi', () => {
    renderApp('/yol/viza')
    expect(where()).toBe('/yol/de/ausbildung/viza')
    h1('Viza')
    cleanup()
    for (const [from, to, title] of [
      ['/yol/yoq', '/yol', 'Qaysi davlatni tanlaysiz?'],
      ['/yol/de/yoq', '/yol/de', 'Germaniya'],
      ['/yol/yoq/yoq', '/yol', 'Qaysi davlatni tanlaysiz?'],
      ['/yol/de/chancenkarte/viza', '/yol', 'Qaysi davlatni tanlaysiz?'],
      ['/yol/a/b/c/d', '/yol', 'Qaysi davlatni tanlaysiz?']
    ] as const) {
      renderApp(from)
      expect(where(), from).toBe(to)
      h1(title)
      cleanup()
    }
  })

  it('kirill interfeysda davlatlar roʻyxati', () => {
    renderApp('/yol', { lang: 'uz-Cyrl' })
    expect(screen.getByRole('link', { name: /^Германия/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /^Жанубий Корея/ })).toBeTruthy()
  })

  it('ochiq davlatni bosish tanlovni saqlaydi', () => {
    renderApp('/yol')
    link(/^Germaniya/)
    expect(where()).toBe('/yol/de')
  })
})

describe('Germaniya sahifasi: yopiq yoʻllar bosilmaydi', () => {
  it('Ausbildung — havola (kirishga), qolgan 5 yoʻl — havola emas, "Tez orada" belgisi bor', () => {
    renderApp('/yol/de')
    const list = screen.getByRole('list', { name: 'Yoʻllar' })
    const open = within(list).getByRole('link', { name: /^Ausbildung/ })
    expect(open.getAttribute('href')).toBe('/yol/de/ausbildung/kirish')
    expect(within(list).getAllByRole('link')).toHaveLength(1)
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(6)
    for (const li of items.slice(1)) {
      expect(within(li).queryByRole('link')).toBeNull()
      expect(within(li).getByText('Tez orada')).toBeTruthy()
      expect(li.querySelector('.border-dashed')).not.toBeNull()
    }
    expect(within(list).queryByRole('link', { name: /Chancenkarte/ })).toBeNull()
  })

  it('yopiq davlat (Koreya) ichidagi yoʻl ham bosilmaydi', () => {
    renderApp('/yol/kr')
    expect(screen.queryByRole('link', { name: /EPS/ })).toBeNull()
    expect(screen.getByText('Tez orada')).toBeTruthy()
  })

  it('yopiq yoʻl manzili toʻgʻridan-toʻgʻri ochilsa ProgramPage oʻzgarmagan', () => {
    renderApp('/yol/de/oqish')
    h1('Oʻqish')
    expect(screen.getByText('Keyingi versiyada')).toBeTruthy()
  })
})

describe('Ausbildung kirish ekrani', () => {
  const need = (items: Record<string, string>) => localStorage.setItem('qaldirgoch.progress', JSON.stringify(items))

  it('sarlavha, "Bu nima" (raqamlar step.yol.f3 dan), 3 ta talab, diqqat va xavf bloklari', () => {
    renderApp('/yol/de/ausbildung/kirish')
    h1('Ausbildung')
    expect(screen.getByText('Korxonada ishlab, kasb oʻrganish')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Germaniya' }).getAttribute('href')).toBe('/yol/de')
    expect(screen.getByText('Siz Germaniyada korxonada ishlab kasbni oʻrganasiz. Oʻqish davomida haq olasiz: eng kam haq 2026 yilda, oyiga, yalpi: 1-yil 724 EUR, 3-yil 977 EUR.')).toBeTruthy()
    expect(screen.getByText('Odatda B1 darajasi')).toBeTruthy()
    expect(screen.getByText('Oyiga kamida 822 EUR sof')).toBeTruthy()
    expect(screen.getByText('Ish beruvchi bilan Ausbildung shartnomasi tuziladi')).toBeTruthy()
    expect(screen.getByText(/^Muhim: birinchi yil haqi \(724 EUR\)/)).toBeTruthy()
    expect(screen.getByText(/Kafolatlangan viza/)).toBeTruthy()
  })

  it('bosqichlar soni AUSBILDUNG_STEPS dan; manba va sana ausbildung.ts dagi MIG/BIBB dan', () => {
    renderApp('/yol/de/ausbildung/kirish')
    const how = `${AUSBILDUNG_STEPS.length} bosqich. Har birida vazifalar, hujjatlar va rasmiy manba bor. Bajarganingizni belgilab borasiz.`
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === how)).toBeTruthy()
    expect(screen.getAllByText(String(AUSBILDUNG_STEPS.length)).length).toBeGreaterThan(0) // yumaloq nishon
    expect(screen.getByTestId('source').textContent).toBe(`Manba: ${MIG.title}, ${BIBB.title} · tekshirilgan: ${MIG.checkedAt}`)
  })

  it('"Batafsil oʻqish" havolasi batafsil sahifaga', () => {
    renderApp('/yol/de/ausbildung/kirish')
    expect(screen.getByRole('link', { name: 'Batafsil oʻqish' }).getAttribute('href')).toBe('/yol/de/ausbildung/batafsil')
  })

  it('boshlamagan → "Yoʻl xaritasini ochish"; faqat 1-2-bosqich elementlari boʻlsa ham boshlamagan', () => {
    need({ 'yol.t1': '2026-11-01T00:00:00.000Z' })
    renderApp('/yol/de/ausbildung/kirish')
    expect(screen.getByRole('link', { name: 'Yoʻl xaritasini ochish' }).getAttribute('href')).toBe('/yol/de/ausbildung')
    expect(screen.queryByRole('link', { name: 'Davom etish' })).toBeNull()
  })

  it('boshlagan (3-bosqichdan boshqa vazifa belgilangan) → "Davom etish"', () => {
    need({ 'nemis.t1': '2026-11-01T00:00:00.000Z' })
    renderApp('/yol/de/ausbildung/kirish')
    const a = screen.getByRole('link', { name: 'Davom etish' })
    expect(a.getAttribute('href')).toBe('/yol/de/ausbildung')
    expect(screen.queryByRole('link', { name: 'Yoʻl xaritasini ochish' })).toBeNull()
  })

  it('tugma sticky emas, balandligi 52 px', () => {
    renderApp('/yol/de/ausbildung/kirish')
    const b = screen.getByRole('link', { name: 'Yoʻl xaritasini ochish' })
    expect(b.className).toContain('min-h-[52px]')
    expect(b.className).not.toMatch(/sticky|fixed/)
  })

  it('ruscha va kirillcha interfeys', () => {
    renderApp('/yol/de/ausbildung/kirish', { lang: 'ru' })
    expect(screen.getByText(/1-й год — 724 EUR, 3-й год — 977 EUR/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Открыть карту пути' })).toBeTruthy()
    cleanup()
    renderApp('/yol/de/ausbildung/kirish', { lang: 'uz-Cyrl' })
    expect(screen.getByText(/1-йил 724 EUR, 3-йил 977 EUR/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Йўл харитасини очиш' })).toBeTruthy()
  })
})

describe('Ausbildung batafsil sahifasi', () => {
  const SECTIONS = ['Bu nima', 'Pul', 'Til', 'Hujjat', 'Ish joyi', 'Shartnoma va viza', 'Germaniyada']

  it('7 ta bolim va 7 ta chip; bolimlar ketma-ket ochiq', () => {
    renderApp('/yol/de/ausbildung/batafsil')
    h1('Ausbildung haqida toʻliq')
    const nav = screen.getByRole('navigation', { name: 'Tez oʻtish' })
    expect(within(nav).getAllByRole('button').map((b) => b.textContent)).toEqual(SECTIONS)
    expect(within(nav).getAllByRole('button').every((b) => b.className.includes('min-h-[44px]'))).toBe(true)
    expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-labelledby'))).toHaveLength(7)
    for (const name of SECTIONS) expect(screen.getByRole('region', { name })).toBeTruthy()
    expect(screen.getByText('Eng kam Ausbildung haqi, 2026: 1-yil — 724 EUR, 2-yil — 854 EUR, 3-yil — 977 EUR, 4-yil — 1 014 EUR.')).toBeTruthy()
    expect(screen.getByText('oyiga, yalpi')).toBeTruthy()
    expect(screen.getByText('Diplom va attestat')).toBeTruthy()
    expect(screen.getByText('Goethe, telc yoki ÖSD imtihoniga tayyorlanish')).toBeTruthy()
  })

  it('xavf bloklari (ish joyi va viza) va sariq blok koʻrinadi', () => {
    renderApp('/yol/de/ausbildung/batafsil')
    expect(screen.getAllByText('Firibgarlik xavfi')).toHaveLength(2)
    expect(screen.getByText(/^Ausbildung joyini rasmiy portallar/)).toBeTruthy()
    expect(screen.getByText(/Kafolatlangan viza/)).toBeTruthy()
    expect(screen.getByText(/^Muhim: birinchi yil haqi/)).toBeTruthy()
    // tasdiqlanmagan narsa (viza yigʻimi, muddat) koʻrsatilmaydi
    expect(screen.queryByText(/75 EUR|Viza yigʻimi/)).toBeNull()
  })

  it('chip bosilsa tegishli bolimga aylanadi (reduced-motion: sakramasdan)', () => {
    const calls: { id: string; arg: ScrollIntoViewOptions }[] = []
    Element.prototype.scrollIntoView = function (this: Element, arg?: boolean | ScrollIntoViewOptions) {
      calls.push({ id: this.id, arg: arg as ScrollIntoViewOptions })
    }
    renderApp('/yol/de/ausbildung/batafsil')
    fireEvent.click(screen.getByRole('button', { name: 'Shartnoma va viza' }))
    expect(calls[0]).toEqual({ id: 'd-contract', arg: { behavior: 'smooth', block: 'start' } })
    cleanup()
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    renderApp('/yol/de/ausbildung/batafsil')
    fireEvent.click(screen.getByRole('button', { name: 'Pul' }))
    expect(calls[1]).toEqual({ id: 'd-money', arg: { behavior: 'auto', block: 'start' } })
    // @ts-expect-error test tozalash
    delete Element.prototype.scrollIntoView
  })

  it('orqaga → kirish ekrani; pastda manba qatori va "Yoʻl xaritasini ochish"', () => {
    renderApp('/yol/de/ausbildung/batafsil')
    expect(screen.getByRole('link', { name: 'Ausbildung' }).getAttribute('href')).toBe('/yol/de/ausbildung/kirish')
    expect(screen.getByTestId('source').textContent).toBe(`Manba: ${MIG.title}, ${BIBB.title} · tekshirilgan: ${MIG.checkedAt}`)
    link('Yoʻl xaritasini ochish')
    expect(where()).toBe('/yol/de/ausbildung')
  })
})

describe('marshrutlar: eski havolalar buzilmaydi', () => {
  it('/yol/de/ausbildung — yoʻl xaritasi; bosqich havolalari ishlaydi; kirish/batafsil bosqich deb oʻqilmaydi', () => {
    renderApp('/yol/de/ausbildung')
    h1('Sizning yoʻlingiz')
    cleanup()
    renderApp('/yol/de/ausbildung/viza')
    h1('Viza')
    cleanup()
    renderApp('/yol/de/ausbildung/yoq')
    expect(screen.getByText('Bunday bosqich topilmadi.')).toBeTruthy()
    cleanup()
    for (const from of ['/yol/kr/eps/kirish', '/yol/de/chancenkarte/batafsil', '/yol/a/ausbildung/kirish']) {
      renderApp(from)
      expect(where(), from).toBe('/yol')
      cleanup()
    }
  })
})
