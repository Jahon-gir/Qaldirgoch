// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '../../App'
import { AuthProvider } from '../../auth/AuthProvider'
import { LessonsProvider } from '../../german/LessonsProvider'
import { WordsProvider } from '../../german/WordsProvider'
import { I18nProvider } from '../../i18n/I18nProvider'
import { cyrlOverrides } from '../../i18n/cyrl'
import { ru } from '../../i18n/ru'
import { uz } from '../../i18n/uz'
import { ProfileProvider } from '../../profile/ProfileProvider'
import { ProgressProvider } from '../../progress/ProgressProvider'
import { FIXTURE, mkAgency } from '../../safety/fixtures'

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'welder', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-11-01T00:00:00.000Z', schemaVersion: 1 }
const Where = () => <output data-testid="where">{useLocation().pathname}</output>

function renderAt(path: string, { lang, cache = FIXTURE }: { lang?: string; cache?: typeof FIXTURE | null } = {}) {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(PROFILE))
  if (lang) localStorage.setItem('qaldirgoch.lang', lang)
  // Supabase'siz: reestr kesh orqali (oflayn rejim bilan bir xil yo'l)
  if (cache) localStorage.setItem('qaldirgoch.agencies.v1', JSON.stringify({ savedAt: Date.now(), rows: cache }))
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

const search = (q: string) => fireEvent.change(screen.getByRole('textbox'), { target: { value: q } })
const pageText = () => document.body.textContent ?? ''

beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe('/xavfsizlik — markaz', () => {
  it('sarlavha, belgi, uch kartochka va ogohlantirish', () => {
    renderAt('/xavfsizlik')
    expect(screen.getByRole('heading', { level: 1, name: 'Xavfsizlik' })).toBeTruthy()
    expect(screen.getByText('Pul toʻlashdan oldin tekshiring')).toBeTruthy()
    expect(screen.getByTestId('safety-mark')).toBeTruthy()
    expect(screen.getByText('Bu rasmiy maslahat emas. Yakuniy qaror uchun Migratsiya agentligiga murojaat qiling.')).toBeTruthy()
    expect(document.documentElement.dataset.surface).toBe('bank')
  })
  it('"Agentlikni tekshiring" faol va /xavfsizlik/agentlik ga olib boradi', () => {
    renderAt('/xavfsizlik')
    const a = screen.getByRole('link', { name: /Agentlikni tekshiring/ })
    expect(a.getAttribute('href')).toBe('/xavfsizlik/agentlik')
    expect(a.textContent).toContain('Nomi, litsenziya raqami yoki telefon boʻyicha rasmiy reestrdan qidiring')
    fireEvent.click(a)
    expect(screen.getByTestId('where').textContent).toBe('/xavfsizlik/agentlik')
    expect(screen.getByRole('heading', { level: 1, name: 'Agentlikni tekshiring' })).toBeTruthy()
  })
  it('"Taklifni tekshiring" bosilmaydi: havola ham, tugma ham emas, "Tez orada" belgisi bor', () => {
    renderAt('/xavfsizlik')
    const card = screen.getByTestId('offer-card')
    expect(card.getAttribute('aria-disabled')).toBe('true')
    expect(within(card).getByText('Tez orada')).toBeTruthy()
    expect(within(card).queryByRole('link')).toBeNull()
    expect(within(card).queryByRole('button')).toBeNull()
    expect(card.closest('a,button')).toBeNull()
    fireEvent.click(card)
    expect(screen.getByTestId('where').textContent).toBe('/xavfsizlik')
  })
  it('Ishonch telefoni: tel:1282 havola, raqam matn sifatida ko‘rinadi, manba va sana bor', () => {
    renderAt('/xavfsizlik')
    const a = screen.getByRole('link', { name: /Ishonch telefoni 1282/ })
    expect(a.getAttribute('href')).toBe('tel:1282')
    expect(a.textContent).toContain('1282')
    expect(pageText()).toContain('Raqam manbasi: Migratsiya agentligi aloqa sahifasi · tekshirilgan 07.11.2026')
    expect(screen.getByRole('link', { name: 'gov.uz' }).getAttribute('href')).toBe('https://gov.uz/oz/migration/contacts')
  })
  it('pastki menyuda bo‘lim nomi "Xavfsiz" qoladi', () => {
    renderAt('/xavfsizlik')
    expect(screen.getByRole('link', { name: 'Xavfsiz' })).toBeTruthy()
  })
})

describe('/xavfsizlik/agentlik — natija holatlari', () => {
  it('bo‘sh va qisqa so‘rovda hech narsa chiqmaydi', () => {
    renderAt('/xavfsizlik/agentlik')
    expect(screen.getByText(/Kamida 3 ta belgi/)).toBeTruthy()
    for (const q of ['', 'al', '10']) {
      search(q)
      expect(screen.queryByTestId('agency-found')).toBeNull()
      expect(screen.queryByTestId('agency-notfound')).toBeNull()
    }
  })

  it('a) TOPILDI: nomi, qatorlar, sariq izoh, 1282 tugmasi, manba sanalari ma’lumotdan', () => {
    renderAt('/xavfsizlik/agentlik')
    search('0101')
    const f = screen.getByTestId('agency-found')
    expect(within(f).getByText('Reestrda topildi')).toBeTruthy()
    expect(within(f).getByRole('heading', { level: 2 }).textContent).toBe('“Alfa xususiy bandlik agentligi” MChJ')
    expect(f.textContent).toContain('№0101, 05.03.2024')
    expect(f.textContent).toContain('Test shahri, 1-uy')
    expect(f.textContent).toContain('+998(90) 111-22-33')
    expect(f.textContent).toContain('+998 91 222 33 44')
    expect(f.textContent).toContain('alfa@example.org')
    expect(f.textContent).toContain('litsenziya hozir amal qilishini kafolatlamaydi')
    expect(within(f).getByRole('link', { name: '1282 ga qoʻngʻiroq' }).getAttribute('href')).toBe('tel:1282')
    expect(f.textContent).toContain('reestr yangilangan 02.01.2026 · tekshirilgan 03.01.2026')
    const open = within(f).getByRole('link', { name: 'Rasmiy saytda ochish' })
    expect(open.getAttribute('href')).toBe('https://example.org/registry')
    expect(open.getAttribute('rel')).toContain('noopener')
    expect(pageText()).not.toMatch(/firibgar/i)
  })
  it('a) bo‘sh qiymatli qatorlar yashiriladi', () => {
    renderAt('/xavfsizlik/agentlik')
    search("o'zbek")
    const f = screen.getByTestId('agency-found')
    expect(f.textContent).toContain('№0303, 31.12.2025')
    for (const label of ['Manzil', 'Telefon', 'Elektron pochta']) expect(within(f).queryByText(label)).toBeNull()
  })
  it('telefon bo‘yicha qidiruv (+998, bo‘shliq, tire farqsiz)', () => {
    renderAt('/xavfsizlik/agentlik')
    search('+998 93 555-66-77')
    expect(screen.getByTestId('agency-found').textContent).toContain('Alfa Global')
  })

  it('b) bir nechta natija: ixcham ro‘yxat, bosilsa a) ochiladi, orqaga ro‘yxatga', () => {
    renderAt('/xavfsizlik/agentlik')
    search('alfa')
    expect(screen.queryByTestId('agency-found')).toBeNull()
    const items = screen.getAllByRole('button', { name: /litsenziya/ })
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toContain('№0101')
    fireEvent.click(items[1])
    expect(screen.getByTestId('agency-found').textContent).toContain('Alfa Global')
    fireEvent.click(screen.getByRole('button', { name: 'Mos kelganlar roʻyxatiga qaytish' }))
    expect(screen.getAllByRole('button', { name: /litsenziya/ })).toHaveLength(2)
  })

  it('c) TOPILMADI: sariq blok (qizil emas), 3 qadam, 1282 tugmasi, manba; "firibgar" faqat inkor gapida', () => {
    renderAt('/xavfsizlik/agentlik')
    search('zzzzzz')
    const n = screen.getByTestId('agency-notfound')
    expect(within(n).getByText('Reestrda topilmadi')).toBeTruthy()
    expect(n.innerHTML).toContain('bg-warn-soft')
    expect(n.innerHTML).not.toMatch(/danger|role="alert"/)
    expect(n.textContent).toContain('Bu avtomatik ravishda firibgarlik degani emas')
    expect(n.textContent?.match(/firibgar\w*/gi)).toEqual(['firibgarlik'])
    expect(within(n).getByText('Pul toʻlashdan va shartnoma imzolashdan oldin')).toBeTruthy()
    expect(within(n).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Agentlikdan toʻliq nomini va litsenziya raqamini soʻrang',
      'Litsenziya raqamini shu yerda qayta qidiring',
      'Shubha qolsa, Migratsiya agentligiga qoʻngʻiroq qiling'
    ])
    expect(within(n).getByRole('link', { name: '1282 ga qoʻngʻiroq' }).getAttribute('href')).toBe('tel:1282')
    expect(n.textContent).toContain('reestr yangilangan 02.01.2026 · tekshirilgan 03.01.2026')
  })

  it('× tugmasi so‘rovni tozalaydi', () => {
    renderAt('/xavfsizlik/agentlik')
    expect(screen.queryByRole('button', { name: 'Tozalash' })).toBeNull()
    search('alfa')
    fireEvent.click(screen.getByRole('button', { name: 'Tozalash' }))
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('')
    expect(screen.getByText(/Kamida 3 ta belgi/)).toBeTruthy()
  })

  it('"Orqaga" markazga qaytaradi', () => {
    renderAt('/xavfsizlik/agentlik')
    fireEvent.click(screen.getByRole('button', { name: 'Orqaga' }))
    expect(screen.getByTestId('where').textContent).toBe('/xavfsizlik')
  })

  it('reestr nomidagi HTML matn sifatida chiqadi (XSS)', () => {
    renderAt('/xavfsizlik/agentlik', { cache: [mkAgency({ nomi: '<img src=x onerror=alert(1)> Beta', litsenziya_raqami: '0404' })] })
    search('0404')
    expect(screen.getByTestId('agency-found').querySelector('img')).toBeNull()
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('<img src=x')
  })

  it('oflayn: kesh bor, Supabase yo‘q — qidiruv ishlaydi', () => {
    renderAt('/xavfsizlik/agentlik')
    search('0202')
    expect(screen.getByTestId('agency-found').textContent).toContain('Alfa Global')
  })

  it('kesh ham, tarmoq ham yo‘q: xabar va "Qayta urinish"', async () => {
    renderAt('/xavfsizlik/agentlik', { cache: null })
    expect(await screen.findByText(/Reestrni yuklab boʻlmadi/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Qayta urinish' })).toBeTruthy()
  })
})

describe('tillar', () => {
  it('rus tilida', () => {
    renderAt('/xavfsizlik/agentlik', { lang: 'ru' })
    expect(screen.getByRole('heading', { level: 1, name: 'Проверьте агентство' })).toBeTruthy()
    search('zzzzzz')
    expect(pageText()).toContain('В реестре не найдено')
    expect(pageText()).toContain('реестр обновлён 02.01.2026')
  })
  it('kirill tilida (qo‘lda yozilgan)', () => {
    renderAt('/xavfsizlik/agentlik', { lang: 'uz-Cyrl' })
    expect(screen.getByRole('heading', { level: 1, name: 'Агентликни текширинг' })).toBeTruthy()
    search('0101')
    expect(pageText()).toContain('Реестрда топилди')
    expect(pageText()).toContain('№0101, 05.03.2024')
  })
  it('har bir safety.* kalit uchun ru va qo‘lda yozilgan kirill matni bor', () => {
    const keys = Object.keys(uz).filter((k) => k.startsWith('safety.'))
    for (const k of keys) {
      expect(ru[k as keyof typeof ru], k).toBeTruthy()
      if (k !== 'safety.title') expect(cyrlOverrides[k as keyof typeof cyrlOverrides], k).toBeTruthy()
    }
  })
})
