// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
import { AppShell } from './AppShell'

afterEach(cleanup)

function Page({ name }: { name: string }) {
  return (
    <div>
      <h1>{name}</h1>
      <Link to="/">go-home</Link>
      <Link to="/yol">go-yol</Link>
      <Link to="/yol/viza">go-viza</Link>
    </div>
  )
}

describe('AppShell — ekranlar orasida oʻtish', () => {
  it('window.scrollTo Promise qaytarsa ham (yangi Chrome/Edge) ilova qulamaydi', () => {
    // Yangi brauzerlar scrollTo dan Promise qaytaradi; effekt uni qaytarsa React uni tozalash funksiyasi deb chaqiradi
    const scrollTo = vi.fn(() => Promise.resolve())
    vi.stubGlobal('scrollTo', scrollTo)
    const errors: unknown[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => void errors.push(a))

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Page name="Bosh" />} />
              <Route path="yol" element={<Page name="Yol" />} />
              <Route path="yol/:id" element={<Page name="Bosqich" />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </I18nProvider>
    )

    for (const [link, title] of [['go-yol', 'Yol'], ['go-viza', 'Bosqich'], ['go-home', 'Bosh'], ['go-yol', 'Yol'], ['go-home', 'Bosh']] as const) {
      fireEvent.click(screen.getByText(link))
      expect(screen.getByRole('heading', { name: title })).toBeTruthy()
      expect(screen.getByRole('navigation')).toBeTruthy() // pastki menyu yoʻqolmaydi
    }

    expect(scrollTo).toHaveBeenCalledTimes(6) // boshlangʻich + 5 ta oʻtish
    expect(errors).toEqual([])
    spy.mockRestore()
    vi.unstubAllGlobals()
  })
})
