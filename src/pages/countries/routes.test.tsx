// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../../App'
import { AuthProvider } from '../../auth/AuthProvider'
import { AUSBILDUNG_STEPS, BIBB, MIG } from '../../content/ausbildung'
import { PROGRAM_CONTENT } from '../../content/programs'
import { ru } from '../../i18n/ru'
import { uz } from '../../i18n/uz'
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
    expect(screen.getByText(/Bu davlat yoʻllari hozir rasmiy manbalardan tayyorlanmoqda/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Agentlikni tekshirish' }).getAttribute('href')).toBe('/xavfsizlik/agentlik')
    expect(screen.getByTestId('flag-band')).toBeTruthy()
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
    expect(screen.getByText(/Bu davlat yoʻllari hozir rasmiy manbalardan tayyorlanmoqda/)).toBeTruthy() // yoʻl yoʻq boʻlsa ham ogohlantirish
  })

  it('Chancenkarte manzili toʻgʻridan-toʻgʻri ochilsa → kirish ekraniga; rasmiy havola xavfsiz; orqaga → Germaniya', () => {
    renderApp('/yol/de/chancenkarte')
    expect(where()).toBe('/yol/de/chancenkarte/kirish')
    h1('Chancenkarte')
    const a = screen.getByRole('link', { name: /Rasmiy manbada ochish/ }) as HTMLAnchorElement
    expect(a.href).toContain('Chancenkarte_zur_Jobsuche_EN.pdf')
    expect(a.target).toBe('_blank')
    expect(a.rel).toContain('noopener')
    link('Germaniya')
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

describe('Germaniya sahifasi: yoʻllar va yopiq yoʻllar', () => {
  it('6 yoʻl ham ochiq: "Ochiq" belgisi va /kirish ga havola', () => {
    renderApp('/yol/de')
    const list = screen.getByRole('list', { name: 'Yoʻllar' })
    const links = within(list).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['ausbildung', 'chancenkarte', 'tan-oldirish', 'mutaxassis', 'oqish', 'til-kursi'].map((id) => `/yol/de/${id}/kirish`))
    expect(within(list).getAllByText('Ochiq')).toHaveLength(6)
    expect(within(list).queryByText('Tez orada')).toBeNull()
  })

  it('yopiq davlat (Koreya) ichidagi yoʻl bosilmaydi: havola emas, "Tez orada" belgisi, punktir chegara', () => {
    renderApp('/yol/kr')
    expect(screen.queryByRole('link', { name: /EPS/ })).toBeNull()
    expect(screen.getByText('Tez orada')).toBeTruthy()
    expect(document.querySelector('.border-dashed')).not.toBeNull()
  })

  it('kontenti yoʻq yopiq yoʻl manzili toʻgʻridan-toʻgʻri ochilsa ProgramPage oʻzgarmagan', () => {
    renderApp('/yol/kr/eps')
    h1('EPS (E-9 viza)')
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
    const how = `${AUSBILDUNG_STEPS.length} bosqich. Har birida vazifalar va hujjatlar bor. Manbasi tasdiqlanmaganlari “Tekshiruvda” deb belgilanadi. Bajarganingizni belgilab borasiz.`
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
    for (const from of ['/yol/kr/eps/kirish', '/yol/kr/eps/batafsil', '/yol/a/ausbildung/kirish', '/yol/de/yoq/kirish']) {
      renderApp(from)
      expect(where(), from).toBe('/yol')
      cleanup()
    }
  })
})

const NEW = [
  ['chancenkarte', 'Chancenkarte', 'Chancenkarte_zur_Jobsuche_EN.pdf', 7],
  ['tan-oldirish', 'Malakani tan oldirish', 'what-is-recognition.php', 8],
  ['mutaxassis', 'Malakali mutaxassis', 'work-qualified-professionals', 6],
  ['oqish', 'Oʻqish', 'Visum_Studieren_EN.pdf', 6],
  ['til-kursi', 'Til kursi', '2445792-2445792', 5]
] as const

describe.each(NEW)('Germaniyaning yangi yoʻli: %s', (id, name, firstSource, sections) => {
  it('/kirish ochiladi: sarlavha, "Bu nima", 3 talab, sariq va qizil blok, manba qatori; "Qanday ishlaydi" yoʻq', () => {
    renderApp(`/yol/de/${id}/kirish`)
    h1(name)
    const c = PROGRAM_CONTENT[`de/${id}`]
    expect(screen.getByText(uz[c.what as keyof typeof uz])).toBeTruthy()
    for (const n of c.needs) {
      expect(screen.getByText(uz[n.title])).toBeTruthy()
      expect(screen.getByText(uz[n.text])).toBeTruthy()
    }
    expect(screen.getByText(uz[c.notice!])).toBeTruthy()
    expect(screen.getByText(uz[c.warning])).toBeTruthy()
    expect(screen.queryByText('Qanday ishlaydi')).toBeNull()
    expect(screen.getByRole('link', { name: 'Germaniya' }).getAttribute('href')).toBe('/yol/de')
    expect(screen.getByTestId('source').textContent).toBe(`Manba: ${c.sources.map((s) => s.title).join(', ')} · tekshirilgan: 2026-11-06`)
    expect(c.sources.every((s) => s.checkedAt === '2026-11-06' && s.url.startsWith('https://'))).toBe(true)
  })

  it('pastki tugma: yoʻl xaritasi YOʻQ; "Rasmiy manbada ochish" birinchi manbaga (noopener) va "xarita keyingi versiyada"', () => {
    renderApp(`/yol/de/${id}/kirish`)
    expect(screen.queryByRole('link', { name: /Yoʻl xaritasini ochish|Davom etish/ })).toBeNull()
    const a = screen.getByRole('link', { name: /Rasmiy manbada ochish/ }) as HTMLAnchorElement
    expect(a.href).toContain(firstSource)
    expect(a.href).toBe(PROGRAM_CONTENT[`de/${id}`].sources[0].url)
    expect(a.target).toBe('_blank')
    expect(a.rel).toBe('noopener noreferrer')
    expect(screen.getByText('Bosqichma-bosqich xarita keyingi versiyada')).toBeTruthy()
  })

  it('/batafsil ochiladi: chiplar va boʻlimlar detail massividan; chip ≥ 44 px; orqaga → kirish', () => {
    renderApp(`/yol/de/${id}/batafsil`)
    const nav = screen.getByRole('navigation', { name: 'Tez oʻtish' })
    const chips = within(nav).getAllByRole('button')
    expect(chips).toHaveLength(sections)
    expect(screen.getAllByRole('region')).toHaveLength(sections)
    expect(chips.every((b) => b.className.includes('min-h-[44px]'))).toBe(true)
    const c = PROGRAM_CONTENT[`de/${id}`]
    c.detail.forEach((s, i) => {
      expect(chips[i].textContent).toBe(uz[s.title as keyof typeof uz])
      // matndagi raqamlar (1 091) bo'linmas bo'sh joy bilan: getByText bo'sh joylarni siqadi
      for (const k of s.items) expect(screen.getByText(uz[k as keyof typeof uz].replace(/\s+/g, ' '))).toBeTruthy()
    })
    expect(screen.getByRole('link', { name: name }).getAttribute('href')).toBe(`/yol/de/${id}/kirish`)
    expect(screen.getByRole('link', { name: /Rasmiy manbada ochish/ })).toBeTruthy()
  })

  it('Germaniya kartochkasi "Ochiq" va /kirish ga boradi; "Batafsil oʻqish" → /batafsil → orqaga → kirish', () => {
    renderApp('/yol/de')
    link(new RegExp(`^${name}`))
    expect(where()).toBe(`/yol/de/${id}/kirish`)
    link('Batafsil oʻqish')
    expect(where()).toBe(`/yol/de/${id}/batafsil`)
    link(name)
    expect(where()).toBe(`/yol/de/${id}/kirish`)
  })

  it('ruscha va kirillcha: matn bor, kalitlar toʻliq', () => {
    const c = PROGRAM_CONTENT[`de/${id}`]
    const keys = [c.what, c.notice!, c.warning, ...c.needs.flatMap((n) => [n.title, n.text]), ...c.detail.flatMap((s) => [s.title, ...s.items])]
    for (const k of keys) {
      expect(ru[k as keyof typeof ru]?.trim().length, k).toBeGreaterThan(0)
      expect(ru[k as keyof typeof ru], k).toMatch(/[Ѐ-ӿ]/)
    }
    renderApp(`/yol/de/${id}/kirish`, { lang: 'uz-Cyrl' })
    expect(screen.getByText(/Расмий манбада очиш/)).toBeTruthy()
  })
})

describe('Til kursi: oylik mablagʻ raqami yoʻq (manbalarda har xil)', () => {
  it('"1 027" va "1 091" kirish va batafsil sahifada, uz/ru/kirill matnlarda ham yoʻq', () => {
    for (const path of ['/yol/de/til-kursi/kirish', '/yol/de/til-kursi/batafsil']) {
      renderApp(path)
      expect(document.body.textContent).not.toMatch(/1[\s\u00a0]?027|1[\s\u00a0]?091/)
      cleanup()
    }
    for (const dict of [uz, ru] as Record<string, string>[]) for (const [k, v] of Object.entries(dict)) if (k.startsWith('tk.')) expect(v, k).not.toMatch(/1[\s\u00a0]?027|1[\s\u00a0]?091/)
    renderApp('/yol/de/til-kursi/batafsil', { lang: 'uz-Cyrl' })
    expect(document.body.textContent).not.toMatch(/1[\s\u00a0]?027|1[\s\u00a0]?091/)
  })
  it('Chancenkarte va tan olishda 1 091 EUR bor (boshqa manba) — Til kursiga aralashmaydi', () => {
    renderApp('/yol/de/chancenkarte/batafsil')
    expect(document.body.textContent).toMatch(/1\s091 EUR/)
  })
})

describe('Ausbildung ekrani oldingidek (shablon)', () => {
  it('kirish: "Qanday ishlaydi" bor, roadmap tugmasi, Rasmiy manbada ochish YOʻQ; batafsil 7 boʻlim', () => {
    renderApp('/yol/de/ausbildung/kirish')
    expect(screen.getByText('Qanday ishlaydi')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Yoʻl xaritasini ochish' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Rasmiy manbada ochish/ })).toBeNull()
    expect(screen.queryByText('Bosqichma-bosqich xarita keyingi versiyada')).toBeNull()
    cleanup()
    renderApp('/yol/de/ausbildung/batafsil')
    expect(screen.getAllByRole('region')).toHaveLength(7)
    expect(screen.getByRole('link', { name: 'Yoʻl xaritasini ochish' })).toBeTruthy()
  })
})
