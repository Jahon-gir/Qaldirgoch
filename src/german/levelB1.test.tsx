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
import { DE_COURSE } from '../lang/de'
import { ALL_RESULT_IDS } from '../lang/registry'
import { buildTest, levelScope, scopeInfo, testId, testParts } from './finalTest'
import { visibleModules } from './logic'
import { LessonsProvider } from './LessonsProvider'
import { WordsProvider } from './WordsProvider'

// Haqiqiy paketlar bilan
vi.unmock('../content/german/packs')

const NOW = '2026-11-01T00:00:00.000Z'
const B1_TITLES = ['Jamoa yigʻilishi va fikr bildirish', 'Ish boʻyicha qisqa xat va xabar', 'Hamkasb bilan kelishmovchilikni hal qilish', 'Ish suhbati: oʻzingizni tanishtirish', 'Ish joyidagi qoidalar va ichki tartib', 'Malaka oshirish va kurslar', 'Ishchi huquqlari va yordam olish', 'Turar joy topish va ijara', 'Bank hisobi va toʻlovlar', 'Shifokor qabulida', 'Bolalar bogʻchasi va maktab', 'Jamoat transporti: kechikish va chipta', 'Pochta, posilka va onlayn xarid', 'Telefon va internet shartnomasi', 'Boʻsh vaqt: sport, klub va tadbirlar', 'Qoʻshnilar va uydagi tartib', 'Bayramlar, tabriklar va ish joyidagi anʼanalar', 'Ob-havo, fasllar va mavsumga mos kiyinish', 'Mehmonga borish va mehmon kutish', 'Maishiy xizmatlar: sartarosh, taʼmir va kimyoviy tozalash', 'Oylik xarajatlar va pulni tejash', 'Doʻkon va bozorda xarid: yorliq, muddat va tarkib', 'Internet va telefon xavfsizligi: parol, soxta xabar va shaxsiy maʼlumot', 'Shaxsiy avtomobil: yoqilgʻi, parkovka, servis va yoʻl hodisasi', 'Sogʻlom turmush: sport, uyqu va ish joyida dam olish', 'Dorixonada: retseptsiz dori, maslahat va navbatchi dorixona', 'Sayohat: aeroport, bagaj va reys', 'Uy jihozlari: mebel, maishiy texnika va yigʻish', 'Til kursi: dars, uy vazifasi va imtihon']

describe('B1 darajasi (umumiy kurs)', () => {
  it('B1 ochiq; umumiy B1 modullari va daraja testi id si bor', () => {
    expect(DE_COURSE.levels.find((l) => l.id === 'B1')).toEqual({ id: 'B1', locked: false })
    const gen = visibleModules('general', DE_COURSE.modules).filter((m) => m.level === 'B1')
    expect(gen.map((m) => m.id)).toEqual(['general-majlis', 'general-yozma-xabar', 'general-kelishmovchilik', 'general-ish-suhbati', 'general-ish-joyi-qoidalari', 'general-malaka-oshirish', 'general-ish-huquqlari', 'general-uy-ijara', 'general-bank-hujjat', 'general-shifokor', 'general-oila-maktab', 'general-jamoat-transporti', 'general-pochta-xarid', 'general-aloqa-shartnoma', 'general-bosh-vaqt', 'general-qoshnilar', 'general-bayramlar', 'general-ob-havo', 'general-mehmondorchilik', 'general-xizmatlar', 'general-byudjet', 'general-supermarket', 'general-internet-xavfsizlik', 'general-avtomobil', 'general-sport-salomatlik', 'general-dorixona', 'general-aeroport', 'general-uy-jihozlash', 'general-til-kursi'])
    expect(ALL_RESULT_IDS.has(testId(levelScope('B1')))).toBe(true)
  })

  it('B1 daraja testi: 16 soʻz + 4 gap, faqat B1 modullaridan', () => {
    const info = scopeInfo(levelScope('B1'), 'general', DE_COURSE)!
    expect(info.type).toBe('level')
    expect(info.moduleIds).toEqual(['general-majlis', 'general-yozma-xabar', 'general-kelishmovchilik', 'general-ish-suhbati', 'general-ish-joyi-qoidalari', 'general-malaka-oshirish', 'general-ish-huquqlari', 'general-uy-ijara', 'general-bank-hujjat', 'general-shifokor', 'general-oila-maktab', 'general-jamoat-transporti', 'general-pochta-xarid', 'general-aloqa-shartnoma', 'general-bosh-vaqt', 'general-qoshnilar', 'general-bayramlar', 'general-ob-havo', 'general-mehmondorchilik', 'general-xizmatlar', 'general-byudjet', 'general-supermarket', 'general-internet-xavfsizlik', 'general-avtomobil', 'general-sport-salomatlik', 'general-dorixona', 'general-aeroport', 'general-uy-jihozlash', 'general-til-kursi'])
    expect(testParts(info)).toEqual({ words: 16, gaps: 4 })
    const qs = buildTest(info, { canListen: true, seed: 3, course: DE_COURSE })
    expect(qs).toHaveLength(20)
    const b1 = new Set(info.moduleIds)
    for (const q of qs) {
      if (q.kind === 'gap') expect(b1.has(DE_COURSE.gapById(q.gapId)!.moduleId)).toBe(true)
      else expect(b1.has(DE_COURSE.wordById(q.wordId)!.moduleId)).toBe(true)
    }
  })
})

const PROFILE = { ageRange: '25-30', education: 'college', profession: 'other', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: NOW, schemaVersion: 1, dailyGoal: 2 }

function renderLanguage() {
  localStorage.setItem('qaldirgoch.onboarded', '1')
  localStorage.setItem('qaldirgoch.profile', JSON.stringify(PROFILE))
  return render(
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <ProgressProvider>
            <LessonsProvider>
              <WordsProvider>
                <InstallProvider>
                  <MemoryRouter initialEntries={['/til/de']}>
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

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('B1 darajasi (ekran)', () => {
  it('B1 tugmasi bosiladi → B1 modullari va qulfli daraja testi chiqadi', () => {
    renderLanguage()
    const group = screen.getByRole('group', { name: 'Darajalar' })
    const b1 = within(group).getByRole('button', { name: /B1/ })
    expect((b1 as HTMLButtonElement).disabled).toBe(false)
    expect(b1.textContent).toMatch(/0\/\d+/)
    expect(screen.queryByText(B1_TITLES[0])).toBeNull()
    fireEvent.click(b1)
    expect(b1.getAttribute('aria-pressed')).toBe('true')
    for (const title of B1_TITLES) expect(screen.getByText(title)).toBeTruthy()
    expect(screen.getByText('B1 daraja testi')).toBeTruthy()
    expect(screen.getByText('Barcha B1 modullari tugagach ochiladi')).toBeTruthy()
  })
})
