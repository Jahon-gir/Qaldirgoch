import { useMemo } from 'react'
import { useProfile } from '../profile/ProfileProvider'
import { rightFeedback, wrongFeedback } from './feedback'

/** Toʻgʻri / xato javob effekti; "Ovoz effektlari" sozlamasini profildan oladi. */
export function useFeedback() {
  const { soundEffects } = useProfile()
  return useMemo(
    () => ({
      right: (el?: Element | null) => rightFeedback(el, soundEffects),
      wrong: () => wrongFeedback(soundEffects)
    }),
    [soundEffects]
  )
}
