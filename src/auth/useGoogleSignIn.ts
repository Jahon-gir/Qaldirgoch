import { useState } from 'react'
import { useAuth } from './AuthProvider'

/** Google tugmasi uchun: bosilganda yoʻnaltiradi, boshlab boʻlmasa `failed` true. */
export function useGoogleSignIn() {
  const { signInWithGoogle, configured } = useAuth()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const start = async () => {
    setBusy(true)
    setFailed(false)
    const ok = await signInWithGoogle()
    // Muvaffaqiyatda sahifa Google'ga ketadi; bu yerga faqat xatoda qaytiladi
    if (!ok) {
      setFailed(true)
      setBusy(false)
    }
  }
  return { configured, busy, failed, start }
}
