import { countryById, programById, type Country, type Program } from '../content/countries'

/** Oxirgi ochilgan yoʻl (bosh ekrandagi "Davom etish" uchun). Faqat davlat va yoʻl id, shaxsiy maʼlumot yoʻq. */
export const LAST_PATH_KEY = 'qaldirgoch.lastPath'

export type LastPath = { country: Country; program: Program }

export function readLastPath(): LastPath | null {
  try {
    const raw = localStorage.getItem(LAST_PATH_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as { country?: unknown; program?: unknown }
    const c = typeof v?.country === 'string' ? countryById(v.country) : undefined
    const p = c && typeof v.program === 'string' ? programById(c, v.program) : undefined
    return c && p ? { country: c, program: p } : null
  } catch {
    return null
  }
}

export function writeLastPath(country: string, program: string) {
  try {
    localStorage.setItem(LAST_PATH_KEY, JSON.stringify({ country, program }))
  } catch {
    /* xususiy rejimda saqlanmasa ham ilova ishlayveradi */
  }
}
