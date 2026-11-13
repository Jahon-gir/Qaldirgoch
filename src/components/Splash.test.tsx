// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Splash } from './Splash'

describe('Splash', () => {
  it('logo va shiorni koʻrsatadi (tarjimasiz)', () => {
    render(<Splash />)
    expect(screen.getByText('Your Work. Your World.')).toBeTruthy()
    expect(screen.getByTestId('migra-logo').getAttribute('src')).toBe('./logo.webp')
    expect(screen.queryByText(/Ishingiz/)).toBeNull()
  })
})
