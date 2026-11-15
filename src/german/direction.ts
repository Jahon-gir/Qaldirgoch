import { DIRECTIONS, type Direction } from '../content/german/types'
import type { Answers } from '../profile/questions'

/* ---------- Yoʻnalish ---------- */

/** Profildagi kasbdan yoʻnalish: elektrik/payvandchi/mexanik/quruvchi → technical; haydovchi → logistics; hamshira → care; oshpaz/mehmonxona → hospitality; qolgani → general. */
export function directionFromProfession(profession: Answers['profession'] | undefined): Direction {
  switch (profession) {
    case 'electrician':
    case 'welder':
    case 'mechanic':
    case 'construction':
      return 'technical'
    case 'nurse':
      return 'care'
    case 'cook':
      return 'hospitality'
    case 'driver':
      return 'logistics'
    default:
      return 'general'
  }
}

export const isDirection = (v: unknown): v is Direction => typeof v === 'string' && (DIRECTIONS as readonly string[]).includes(v)

/** Qoʻlda tanlangan yoʻnalish ustun; yoʻq boʻlsa kasbdan avtomatik. */
export function effectiveDirection(p: { profession: Answers['profession']; germanDirection?: Direction } | null): Direction {
  return p?.germanDirection ?? directionFromProfession(p?.profession)
}
