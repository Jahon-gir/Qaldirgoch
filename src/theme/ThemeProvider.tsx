import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AccentId, Mode, Size } from './presets'

type Theme = { mode: Mode; accent: AccentId; size: Size }
type Ctx = Theme & { isDark: boolean; set: (patch: Partial<Theme>) => void }

const KEY = 'qaldirgoch.theme'
const DEFAULT: Theme = { mode: 'auto', accent: 'marjon', size: 'm' }

function load(): Theme {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return DEFAULT
  }
}

const ThemeContext = createContext<Ctx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(load)
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const isDark = theme.mode === 'dark' || (theme.mode === 'auto' && systemDark)

  useEffect(() => {
    const r = document.documentElement
    r.dataset.mode = isDark ? 'dark' : 'light'
    r.dataset.accent = theme.accent
    r.dataset.size = theme.size
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#1E1E1C' : '#F1EFE8')
    try {
      localStorage.setItem(KEY, JSON.stringify(theme))
    } catch {
      /* xususiy rejimda saqlanmasa ham ilova ishlayveradi */
    }
  }, [theme, isDark])

  const set = (patch: Partial<Theme>) => setTheme((t) => ({ ...t, ...patch }))
  return <ThemeContext.Provider value={{ ...theme, isDark, set }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const c = useContext(ThemeContext)
  if (!c) throw new Error('useTheme ThemeProvider ichida ishlatilishi kerak')
  return c
}
