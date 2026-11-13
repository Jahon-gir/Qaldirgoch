// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AuthProvider } from '../../auth/AuthProvider'
import { I18nProvider } from '../../i18n/I18nProvider'
import { ProfileProvider } from '../../profile/ProfileProvider'
import type { DialogExercise } from '../../content/german'
import { DialogStep } from './DialogStep'

const L = (uz: string, ru = uz) => ({ uz, 'uz-Cyrl': uz, ru })
const ex: DialogExercise = {
  type: 'dialog',
  id: 'technical-asboblar-l1-e9',
  lines: [
    { speaker: L('Usta'), text: 'Guten Morgen!', tr: L('Xayrli tong!') },
    { speaker: L('Ishchi'), text: 'Morgen!', tr: L('Tong!') },
    { speaker: L('Usta'), text: 'Wo ist der Hammer?', tr: L('Bolgʻa qayerda?') },
    { speaker: L('Ishchi'), text: 'Im Wagen.', tr: L('Mashinada.') }
  ],
  check: { ask: 1, answer: 2, options: [0, 2, 3] }
}
const speech = { canSpeak: () => false, speak: vi.fn(), speaking: false }

function wrap(node: ReactNode) {
  return render(
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>{node}</ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

afterEach(() => cleanup())

describe('DialogStep', () => {
  it('replikalar va tarjima; tarjimani yashirish', () => {
    wrap(<DialogStep ex={ex} speech={speech} onDone={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Ishdagi suhbat' })).toBeTruthy()
    expect(screen.getByText('Wo ist der Hammer?')).toBeTruthy()
    expect(screen.getByText('Bolgʻa qayerda?')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tarjimani yashirish' }))
    expect(screen.queryByText('Bolgʻa qayerda?')).toBeNull()
  })

  it('savol: xato javob — 0/1, xatolar roʻyxatiga savol + toʻgʻri javob', () => {
    const done = vi.fn()
    wrap(<DialogStep ex={ex} speech={speech} onDone={done} />)
    fireEvent.click(screen.getByRole('button', { name: 'Davom etish' }))
    expect(screen.getByText('Suhbatdagi mos javobni tanlang')).toBeTruthy()
    expect(screen.getByText('Morgen!')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Im Wagen.' }))
    expect(screen.getByText('Xato')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Davom etish' }))
    expect(done).toHaveBeenCalledWith({ total: 1, correct: 0, mistakes: [{ key: ex.id, de: 'Morgen! — Wo ist der Hammer?', tr: L('Tong! — Bolgʻa qayerda?') }] })
  })

  it('savol: toʻgʻri javob — 1/1', () => {
    const done = vi.fn()
    wrap(<DialogStep ex={ex} speech={speech} onDone={done} />)
    fireEvent.click(screen.getByRole('button', { name: 'Davom etish' }))
    fireEvent.click(screen.getByRole('button', { name: 'Wo ist der Hammer?' }))
    expect(screen.getByText('Toʻgʻri')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Davom etish' }))
    expect(done).toHaveBeenCalledWith({ total: 1, correct: 1, mistakes: [] })
  })

  it('savolsiz dialog — ballsiz tugaydi', () => {
    const done = vi.fn()
    wrap(<DialogStep ex={{ ...ex, check: undefined }} speech={speech} onDone={done} />)
    fireEvent.click(screen.getByRole('button', { name: 'Davom etish' }))
    expect(done).toHaveBeenCalledWith({ total: 0, correct: 0, mistakes: [] })
  })
})
