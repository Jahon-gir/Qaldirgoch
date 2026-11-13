// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PhoneRoot } from './PhoneRoot'

describe('PhoneRoot', () => {
  it('testda (ramkasiz) ilovani toʻgʻridan-toʻgʻri chiqaradi', () => {
    render(<PhoneRoot><p>ilova</p></PhoneRoot>)
    expect(screen.getByText('ilova')).toBeTruthy()
    expect(screen.queryByLabelText('Bosh ekranga qaytish')).toBeNull()
  })
})
