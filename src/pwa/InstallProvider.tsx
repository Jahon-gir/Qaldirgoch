import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { InstallContext, isStandalone, type BeforeInstallPromptEvent, type InstallState } from './useInstall'

/**
 * beforeinstallprompt ilova yuklanganda tezda kelishi mumkin — shuning uchun listener App darajasida, Sozlamalar ochilishidan oldin qoʻshiladi.
 */
export function InstallProvider({ children }: { children: ReactNode }) {
  const eventRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [canPrompt, setCanPrompt] = useState(false)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault() // brauzerning oʻz taklifi chiqmasin; oynani oʻzimiz ochamiz
      eventRef.current = e as BeforeInstallPromptEvent
      setCanPrompt(true)
    }
    const onInstalled = () => {
      eventRef.current = null
      setCanPrompt(false)
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    let mq: MediaQueryList | null = null
    const onMode = () => setInstalled(isStandalone())
    try {
      mq = window.matchMedia('(display-mode: standalone)')
      mq.addEventListener('change', onMode)
    } catch {
      /* eski brauzer */
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      mq?.removeEventListener('change', onMode)
    }
  }, [])

  const install = useCallback(async () => {
    const ev = eventRef.current
    if (!ev) return
    eventRef.current = null // hodisadan faqat bir marta foydalanish mumkin
    setCanPrompt(false)
    try {
      await ev.prompt()
      await ev.userChoice
    } catch {
      /* oyna ochilmasa ham ilova buzilmasin */
    }
  }, [])

  const value = useMemo<InstallState>(() => ({ installed, canPrompt, install }), [installed, canPrompt, install])
  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>
}
