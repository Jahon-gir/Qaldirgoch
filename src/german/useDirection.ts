import type { Direction } from '../content/german'
import { useProfile } from '../profile/ProfileProvider'
import { effectiveDirection } from './direction'

/** Joriy yoʻnalish: qoʻlda tanlangan yoki kasbdan avtomatik; oʻzgartirish profilga yoziladi. */
export function useDirection(): { direction: Direction; setDirection: (d: Direction) => void } {
  const { profile, setGermanDirection } = useProfile()
  return { direction: effectiveDirection(profile), setDirection: setGermanDirection }
}
