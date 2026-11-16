import { afterEach, describe, expect, it, vi } from 'vitest'
import { appBaseUrl, createSupabase } from './supabase'

describe('env yoʻq holati', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })
  it('kalitlar boʻlmasa klient null (ilova mehmon rejimida ishlaydi)', async () => {
    expect(await createSupabase(undefined, undefined)).toBeNull()
    expect(await createSupabase('https://x.supabase.co', '')).toBeNull()
    expect(await createSupabase('', 'anon')).toBeNull()
  })
  it('modul env boʻlmaganda sozlanmagan, klient null', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    const m = await import('./supabase')
    expect(m.isSupabaseConfigured).toBe(false)
    expect(m.getSupabase()).toBeNull()
    expect(await m.loadSupabase()).toBeNull()
  })
  it('env bor boʻlsa klient yaratiladi', async () => {
    expect(await createSupabase('https://x.supabase.co', 'anon-key')).not.toBeNull()
  })
  it('env bor boʻlsa klient bir marta yuklanadi va keyin sinxron olinadi', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    const m = await import('./supabase')
    expect(m.isSupabaseConfigured).toBe(true)
    expect(m.getSupabase()).toBeNull() // hali yuklanmagan
    const [a, b] = await Promise.all([m.loadSupabase(), m.loadSupabase()])
    expect(a).not.toBeNull()
    expect(a).toBe(b)
    expect(m.getSupabase()).toBe(a)
  })
})

describe('supabase-js asosiy JS\'da emas', () => {
  it('ilova kodida supabase-js faqat dinamik (yoki faqat tur) import qilinadi', () => {
    const files = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
    expect(Object.keys(files).length).toBeGreaterThan(50)
    const bad = Object.entries(files)
      .filter(([, src]) => /^import\s+(?!type\b)[^\n]*from\s+'@supabase\//m.test(src))
      .map(([p]) => p)
    expect(bad).toEqual([])
  })
})

describe('appBaseUrl', () => {
  it('GitHub Pages va lokal manzillar', () => {
    expect(appBaseUrl({ origin: 'https://jahon-gir.github.io', pathname: '/Qaldirgoch/' })).toBe('https://jahon-gir.github.io/Qaldirgoch/')
    expect(appBaseUrl({ origin: 'https://jahon-gir.github.io', pathname: '/Qaldirgoch/index.html' })).toBe('https://jahon-gir.github.io/Qaldirgoch/')
    expect(appBaseUrl({ origin: 'http://localhost:5173', pathname: '/' })).toBe('http://localhost:5173/')
  })
})
