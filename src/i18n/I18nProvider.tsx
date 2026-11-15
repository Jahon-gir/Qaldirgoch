import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { uz, type Key } from './uz'
import { getDict, loadDict, type Lang } from './dicts'

export type { Lang }
export const LANGS: { id: Lang; name: string }[] = [
  { id: 'uz', name: 'Oʻzbekcha' },
  { id: 'uz-Cyrl', name: 'Ўзбекча' },
  { id: 'ru', name: 'Русский' }
]

const KEY = 'qaldirgoch.lang'

export function savedLang(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'uz' || v === 'uz-Cyrl' || v === 'ru') return v
  } catch {
    /* saqlab boʻlmasa — standart til */
  }
  return 'uz'
}

function save(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    /* xususiy rejim */
  }
}

/** main.tsx chizishdan oldin chaqiradi: saqlangan til lugʻati tayyor boʻlsin (oʻzbekcha "miltillash" boʻlmasin). */
export const preloadSavedLang = () => loadDict(savedLang()).catch(() => undefined)

export type TFn = (key: Key, vars?: Record<string, string | number>) => string
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: TFn }

const I18nContext = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  // Lugʻat hali yuklanmagan boʻlsa (tarmoq xatosi) — vaqtincha oʻzbekcha, yuklangach almashadi
  const [lang, setLangState] = useState<Lang>(() => {
    const l = savedLang()
    return getDict(l) ? l : 'uz'
  })
  const wanted = useRef<Lang>(savedLang())

  const setLang = useCallback((l: Lang) => {
    wanted.current = l
    save(l)
    if (getDict(l)) setLangState(l)
    else
      loadDict(l)
        .then(() => {
          if (wanted.current === l) setLangState(l)
        })
        .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (wanted.current !== lang) setLang(wanted.current)
  }, [lang, setLang])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback<TFn>(
    (key, vars) => {
      const s = (getDict(lang) ?? uz)[key] ?? key
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
