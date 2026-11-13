// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import Assistant from './Assistant'

const askAi = vi.fn()
vi.mock('../ai/ask', async (orig) => ({ ...(await orig<typeof import('../ai/ask')>()), askAi: (...a: unknown[]) => askAi(...a) }))

const renderPage = () =>
  render(
    <I18nProvider>
      <MemoryRouter>
        <Assistant />
      </MemoryRouter>
    </I18nProvider>
  )

afterEach(() => {
  cleanup()
  askAi.mockReset()
})

describe('AI chat', () => {
  it('boʻsh holat: sarlavha va 4 ta tayyor savol', () => {
    renderPage()
    expect(screen.getByText('Nima haqida bilmoqchisiz?')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /\?$/ })).toHaveLength(4)
  })

  it('tayyor savol: foydalanuvchi pufagi, javob va manba chipi', async () => {
    askAi.mockResolvedValue({ ok: true, data: { answer: '<b>822 EUR</b> sof', found: true, sources: [{ title: 'BIBB', url: 'https://bibb.de', checkedAt: '2026-11-04' }] } })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Ausbildung uchun qancha pul kerak?' }))
    expect(screen.getByText('Ausbildung uchun qancha pul kerak?')).toBeTruthy()
    await waitFor(() => expect(screen.getByRole('link', { name: /BIBB · 04\.11\.2026/ })).toBeTruthy())
    // HTML matn sifatida chiqadi, teg sifatida emas
    expect(screen.getByText('<b>822 EUR</b> sof')).toBeTruthy()
    expect(document.querySelector('b')).toBeNull()
  })

  it('xato: ogohlantirish va qayta soʻrash; yangi suhbat tozalaydi', async () => {
    askAi.mockResolvedValueOnce({ ok: false, error: 'ai' }).mockResolvedValueOnce({ ok: true, data: { answer: 'Javob', found: false, sources: [] } })
    renderPage()
    fireEvent.change(screen.getByLabelText('Savol yozing…'), { target: { value: 'Chancenkarte nima?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Soʻrash' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Qayta soʻrash' }))
    await waitFor(() => expect(screen.getByText('Javob')).toBeTruthy())
    expect(screen.getByText('Tasdiqlangan maʼlumot yoʻq')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Yangi suhbat' }))
    expect(screen.getByText('Nima haqida bilmoqchisiz?')).toBeTruthy()
  })
})
