import { describe, expect, it } from 'vitest'
import { COUNTRIES, COUNTRY_IDS, effectiveCountry, type Country, type Program } from './countries'
import type { L3 } from './german/types'
import de from '../assets/flags/de.svg'
import gb from '../assets/flags/gb.svg'
import jp from '../assets/flags/jp.svg'
import kr from '../assets/flags/kr.svg'
import license from '../assets/flags/LICENSE-flag-icons.txt?raw'
import { PROGRAM_ICONS } from '../components/countries/icons'

const LANGS = ['uz', 'uz-Cyrl', 'ru'] as const
const programs = COUNTRIES.flatMap((c) => c.programs.map((p) => ({ c, p })))
const texts = (c: Country): L3[] => [c.name, ...c.programs.flatMap((p) => [p.name, p.short]), ...(c.safety ? [c.safety.text] : [])]
const allL3 = COUNTRIES.flatMap(texts)
const isoDate = /^\d{4}-\d{2}-\d{2}$/

describe('davlatlar katalogi: tuzilma', () => {
  it('4 davlat; faqat Germaniya ochiq', () => {
    expect(COUNTRIES.map((c) => [c.id, c.status])).toEqual([['de', 'open'], ['kr', 'locked'], ['jp', 'locked'], ['gb', 'locked']])
    expect(COUNTRY_IDS).toEqual(COUNTRIES.map((c) => c.id))
  })
  it('Germaniya: 6 yoʻl, faqat Ausbildung ochiq', () => {
    const de = COUNTRIES[0]
    expect(de.programs.map((p) => [p.id, p.status])).toEqual([['ausbildung', 'open'], ['chancenkarte', 'locked'], ['tan-oldirish', 'locked'], ['mutaxassis', 'locked'], ['oqish', 'locked'], ['til-kursi', 'locked']])
  })
  it('Koreya: bitta yoʻl (eps) va xavfsizlik eslatmasi tekshiruvda; Yaponiya va Britaniyada yoʻl yoʻq', () => {
    const [, kr, jp, gb] = COUNTRIES
    expect(kr.programs.map((p) => p.id)).toEqual(['eps'])
    expect(kr.safety?.contentStatus).toBe('review')
    expect(kr.safety?.source.url).toBe('https://gov.uz/oz/migration')
    expect(jp.programs).toEqual([])
    expect(gb.programs).toEqual([])
  })
  it('ikonkalar mavjud; bayroq fayllari va litsenziya bor', () => {
    for (const { p } of programs) expect(PROGRAM_ICONS[p.icon], p.id).toBeTruthy()
    for (const f of [de, kr, jp, gb]) expect(f).toBeTruthy()
    expect(license).toContain('MIT')
  })
  it('tanlov: faqat ochiq davlat, notoʻgʻri qiymat — Germaniya', () => {
    expect(effectiveCountry('de')).toBe('de')
    expect(effectiveCountry('kr')).toBe('de')
    expect(effectiveCountry('xx')).toBe('de')
    expect(effectiveCountry(undefined)).toBe('de')
  })
})

describe('davlatlar katalogi: matn', () => {
  it('har davlat va dastur uch tilda toʻliq', () => {
    for (const t of allL3) for (const lang of LANGS) expect(t[lang]?.trim().length, JSON.stringify(t)).toBeGreaterThan(0)
  })
  it('lotinda faqat ʻ va ʼ; kirillda tutuq belgisi yoʻq va kirill harflari bor; ruscha lotin tutuqsiz', () => {
    for (const t of allL3) {
      expect(t.uz).not.toMatch(/['‘’`´]/)
      expect(t['uz-Cyrl']).not.toMatch(/['‘’`´ʻʼ]/)
      expect(t['uz-Cyrl']).toMatch(/[Ѐ-ӿ]|Ausbildung|Chancenkarte|EPS/)
      expect(t.ru).not.toMatch(/[ʻʼ]/)
    }
  })
  it('yopiq yoʻllarda raqam, muddat yoki narx yoʻq (viza turi E-9 dan tashqari)', () => {
    const locked = programs.filter(({ p }) => p.status === 'locked').flatMap(({ p }) => [p.name, p.short])
    for (const t of [...locked, ...COUNTRIES.filter((c) => c.status === 'locked').flatMap((c) => [c.name, ...(c.safety ? [c.safety.text] : [])])]) {
      for (const lang of LANGS) {
        const s = t[lang].replace(/E-\d+/g, '')
        expect(s, s).not.toMatch(/\d/)
        expect(s, s).not.toMatch(/[€$£₩]|EUR|USD|евро|доллар|so[ʻ']?m\b|сўм|руб/i)
      }
    }
  })
})

describe('davlatlar katalogi: manba', () => {
  it('har yoʻlda https rasmiy manba va tekshirilgan sana bor', () => {
    for (const { p } of programs as { p: Program }[]) {
      expect(p.officialUrl.startsWith('https://'), p.id).toBe(true)
      expect(p.checkedAt, p.id).toMatch(isoDate)
      expect(['review', 'approved']).toContain(p.contentStatus)
    }
    expect(programs.filter(({ c }) => c.id === 'de').every(({ p }) => p.officialUrl === 'https://www.make-it-in-germany.com/en/for-qualified-professionals/visa/kinds-of-visa' && p.checkedAt === '2026-11-04')).toBe(true)
  })
})
