// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { getDict, loadDict } from './dicts'
import { ru } from './ru'
import { uz } from './uz'
import { cyrlOverrides } from './cyrl'
import { I18nProvider, useI18n } from './I18nProvider'
import providerSrc from './I18nProvider.tsx?raw'
import dictsSrc from './dicts.ts?raw'
import mainSrc from '../main.tsx?raw'

describe('interfeys lugʻatlari (alohida boʻlak, 0.29.0)', () => {
  it('oʻzbek lotin darhol bor, ru va kirill yuklanadi va keshlanadi', async () => {
    expect(getDict('uz')).toBe(uz)
    expect(await loadDict('ru')).toBe(ru)
    const c = await loadDict('uz-Cyrl')
    expect(await loadDict('uz-Cyrl')).toBe(c)
    expect(c['kasb.title']).toBe(cyrlOverrides['kasb.title'])
    expect(c['app.name']).toBeTruthy()
    expect(Object.keys(c).sort()).toEqual(Object.keys(uz).sort())
  })

  it('asosiy zanjir ru, cyrl va translit fayllarini statik import qilmaydi', () => {
    for (const s of [providerSrc, dictsSrc, mainSrc]) {
      expect(s).not.toMatch(/^import [^\n]*from '\.\/(ru|cyrl|translit|cyrlDict)'/m)
    }
  })

  it('til almashtirilganda matn va <html lang> oʻzgaradi, tanlov saqlanadi', () => {
    localStorage.removeItem('qaldirgoch.lang')
    function Probe() {
      const { t, setLang } = useI18n()
      return (
        <>
          <p>{t('nav.home')}</p>
          <button onClick={() => setLang('ru')}>ru</button>
          <button onClick={() => setLang('uz-Cyrl')}>cyrl</button>
        </>
      )
    }
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    )
    expect(screen.getByText(uz['nav.home'])).toBeTruthy()
    act(() => screen.getByText('ru').click())
    expect(screen.getByText(ru['nav.home'])).toBeTruthy()
    expect(document.documentElement.lang).toBe('ru')
    expect(localStorage.getItem('qaldirgoch.lang')).toBe('ru')
    act(() => screen.getByText('cyrl').click())
    expect(screen.getByText(getDict('uz-Cyrl')!['nav.home'])).toBeTruthy()
    localStorage.removeItem('qaldirgoch.lang')
  })
})
