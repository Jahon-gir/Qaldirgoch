import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { uz, type Dict, type Key } from './uz'
import { ru } from './ru'
import { toCyrillic } from './translit'

export type Lang = 'uz' | 'uz-Cyrl' | 'ru'
export const LANGS: { id: Lang; name: string }[] = [
  { id: 'uz', name: 'Oʻzbekcha' },
  { id: 'uz-Cyrl', name: 'Ўзбекча' },
  { id: 'ru', name: 'Русский' }
]

const KEY = 'qaldirgoch.lang'

function load(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'uz' || v === 'uz-Cyrl' || v === 'ru') return v
  } catch {
    /* saqlab boʻlmasa — standart til */
  }
  return 'uz'
}

let cyrl: Dict | null = null
function dict(lang: Lang): Dict {
  if (lang === 'ru') return ru
  if (lang === 'uz') return uz
  if (!cyrl) cyrl = Object.fromEntries(Object.entries(uz).map(([k, v]) => [k, toCyrillic(v)])) as Dict
  return cyrl
}

export type TFn = (key: Key, vars?: Record<string, string | number>) => string
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: TFn }

const I18nContext = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(load)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* xususiy rejim */
    }
  }, [lang])

  const t = useCallback<TFn>(
    (key, vars) => {
      const s = dict(lang)[key] ?? key
      // Oʻrinbosarlar translitdan keyin qoʻyiladi: foydalanuvchi matni oʻzgarmaydi
      return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s
    },
    [lang]
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const c = useContext(I18nContext)
  if (!c) throw new Error('useI18n I18nProvider ichida ishlatilishi kerak')
  return c
}

export const useT = () => useI18n().t
