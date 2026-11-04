import { createContext, useContext } from 'react'

/** Chrome/Android "ilovani oʻrnatish" hodisasi (standartlashmagan, shuning uchun oʻz turi). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>
}

/** Ilova bosh ekrandan ochilganmi: standalone (Android/kompyuter) yoki navigator.standalone (iOS). */
export function isStandalone(): boolean {
  try {
    if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true
    return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches
  } catch {
    return false
  }
}

export type InstallState = {
  /** Allaqachon oʻrnatilgan (yoki oʻrnatilgan ilovadan ochilgan). */
  installed: boolean
  /** Brauzer oʻrnatish oynasini ochishga tayyor (beforeinstallprompt ushlangan). */
  canPrompt: boolean
  /** Oʻrnatish oynasini ochadi, natijani kutadi; hodisa bir martalik — keyin tozalanadi. */
  install: () => Promise<void>
}

export const InstallContext = createContext<InstallState | null>(null)

export function useInstall(): InstallState {
  const c = useContext(InstallContext)
  if (!c) throw new Error('useInstall InstallProvider ichida ishlatilishi kerak')
  return c
}
