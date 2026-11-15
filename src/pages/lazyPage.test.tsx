// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { Suspense, useState } from 'react'
import { I18nProvider } from '../i18n/I18nProvider'
import { lazyPage, PageFallback } from './lazyPage'

afterEach(cleanup)

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

function Counter({ label }: { label: string }) {
  const [n, setN] = useState(0)
  return <button onClick={() => setN(n + 1)}>{label} {n}</button>
}

describe('lazyPage (0.25.0)', () => {
  it('yuklanmagan boʻlak: avval fallback, keyin sahifa', async () => {
    const d = deferred<{ default: typeof Counter }>()
    const Page = lazyPage(() => d.promise)
    render(<I18nProvider><Suspense fallback={<PageFallback />}><Page label="Sahifa" /></Suspense></I18nProvider>)
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
    await act(async () => { d.resolve({ default: Counter }) })
    expect(await screen.findByRole('button', { name: 'Sahifa 0' })).toBeTruthy()
  })

  it('oldindan yuklangan boʻlak Suspense\'siz darhol chiqadi', async () => {
    const Page = lazyPage(() => Promise.resolve({ default: Counter }))
    await Page.preload()
    render(<Page label="Tayyor" />)
    expect(screen.getByRole('button', { name: 'Tayyor 0' })).toBeTruthy()
  })

  it('yuklangach qayta render sahifa holatini yoʻqotmaydi', async () => {
    const Page = lazyPage(() => Promise.resolve({ default: Counter }))
    function Host() {
      const [tick, setTick] = useState(0)
      return <><button onClick={() => setTick(tick + 1)}>host {tick}</button><Suspense fallback={null}><Page label="P" /></Suspense></>
    }
    render(<Host />)
    const btn = await screen.findByRole('button', { name: 'P 0' })
    act(() => btn.click())
    expect(screen.getByRole('button', { name: 'P 1' })).toBeTruthy()
    act(() => screen.getByRole('button', { name: 'host 0' }).click())
    expect(screen.getByRole('button', { name: 'P 1' })).toBeTruthy()
  })
})
