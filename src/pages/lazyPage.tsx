import { lazy, useEffect, useState, type ComponentType } from 'react'
import { useT } from '../i18n/I18nProvider'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>
export type LazyPage<C extends AnyComponent> = C & { preload: () => Promise<void> }

const preloaders: Array<() => Promise<void>> = []

/**
 * Sahifani alohida JS boʻlagiga ajratadi (React.lazy). Boʻlak oldin yuklangan boʻlsa, sahifa darhol
 * (Suspense'siz) chiqadi. Tanlov mount paytida bir marta qilinadi — yuklangach sahifa qayta mount boʻlmaydi.
 */
export function lazyPage<C extends AnyComponent>(load: () => Promise<{ default: C }>): LazyPage<C> {
  let loaded: AnyComponent | null = null
  const remember = (m: { default: C }) => { loaded = m.default; return m }
  const Lazy = lazy(() => load().then(remember))
  const Page = ((props: object) => {
    const [Comp] = useState<AnyComponent>(() => loaded ?? Lazy)
    return <Comp {...props} />
  }) as unknown as LazyPage<C>
  Page.preload = () => load().then(remember).then(() => undefined)
  preloaders.push(Page.preload)
  return Page
}

/** Hamma lazy sahifani oldindan yuklash (testlarda — ekranlar sinxron chiqishi uchun). */
export const preloadAllPages = () => Promise.all(preloaders.map((p) => p())).then(() => undefined)

/** Boʻlak yuklanayotganda: 300 ms gacha boʻsh (tez tarmoqda miltillamasin), keyin "Yuklanmoqda…". */
export function PageFallback() {
  const t = useT()
  const [show, setShow] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setShow(true), 300)
    return () => window.clearTimeout(id)
  }, [])
  return (
    <div role="status" aria-busy="true" className="flex min-h-[50vh] items-center justify-center">
      {show && <p className="text-ink-2">{t('sync.loading')}</p>}
    </div>
  )
}
