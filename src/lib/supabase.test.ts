import { afterEach, describe, expect, it, vi } from 'vitest'
import { appBaseUrl, createSupabase } from './supabase'

describe('env yoʻq holati', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })
  it('kalitlar boʻlmasa klient null (ilova mehmon rejimida ishlaydi)', () => {
    expect(createSupabase(undefined, undefined)).toBeNull()
    expect(createSupabase('https://x.supabase.co', '')).toBeNull()
    expect(createSupabase('', 'anon')).toBeNull()
  })
  it('modul env boʻlmaganda null eksport qiladi', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    const m = await import('./supabase')
    expect(m.supabase).toBeNull()
    expect(m.isSupabaseConfigured).toBe(false)
  })
  it('env bor boʻlsa klient yaratiladi', () => {
    expect(createSupabase('https://x.supabase.co', 'anon-key')).not.toBeNull()
  })
})

describe('appBaseUrl', () => {
  it('GitHub Pages va lokal manzillar', () => {
    expect(appBaseUrl({ origin: 'https://jahon-gir.github.io', pathname: '/Qaldirgoch/' })).toBe('https://jahon-gir.github.io/Qaldirgoch/')
    expect(appBaseUrl({ origin: 'https://jahon-gir.github.io', pathname: '/Qaldirgoch/index.html' })).toBe('https://jahon-gir.github.io/Qaldirgoch/')
    expect(appBaseUrl({ origin: 'http://localhost:5173', pathname: '/' })).toBe('http://localhost:5173/')
  })
})
