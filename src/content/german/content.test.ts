import { describe, expect, it } from 'vitest'
import { LESSON_ICONS } from '../../components/german/icons'
import { slugErrors } from '../../lang/words'
import { LESSONS, MODULES, exercisesOf, type Exercise, type L3 } from '.'

const LANGS = ['uz', 'uz-Cyrl', 'ru'] as const
const allExercises = LESSONS.flatMap((l) => exercisesOf(l.id))

/** Ekranga chiqadigan barcha L3 matnlar. */
function l3Texts(e: Exercise): L3[] {
  if (e.type === 'word') return [e.tr, e.pron, e.example.tr]
  if (e.type === 'choice') return [e.prompt, e.translation, e.explain]
  return [e.prompt, ...e.pairs.map((p) => p.tr)]
}
const allL3: L3[] = [...MODULES.map((m) => m.title), ...LESSONS.map((l) => l.title), ...allExercises.flatMap(l3Texts)]

describe('nemis kontenti: tuzilma', () => {
  it('A1: 3 modul; faqat 1-modulda 6 dars, qolganlari boʻsh', () => {
    expect(MODULES.map((m) => [m.id, m.level, m.direction, m.order])).toEqual([
      ['a1-m1', 'A1', 'general', 1],
      ['a1-m2', 'A1', 'general', 2],
      ['a1-m3', 'A1', 'technical', 3]
    ])
    expect(LESSONS.every((l) => l.moduleId === 'a1-m1')).toBe(true)
    expect(LESSONS.map((l) => l.order)).toEqual([1, 2, 3, 4, 5, 6])
    expect(LESSONS[5].kind).toBe('test')
  })
  it('darslar tekshiruvda: dars bor modul review, boʻsh modullar draft', () => {
    expect(MODULES.map((m) => m.status)).toEqual(['review', 'draft', 'draft'])
  })
  it('har dars 6–10 qadam; id lar takrorlanmaydi', () => {
    for (const l of LESSONS) {
      const n = exercisesOf(l.id).length
      expect(n, l.id).toBeGreaterThanOrEqual(6)
      expect(n, l.id).toBeLessThanOrEqual(10)
    }
    const ids = [...LESSONS.map((l) => l.id), ...allExercises.map((e) => e.id), ...allExercises.flatMap((e) => (e.type === 'match' ? e.pairs.map((p) => p.id) : e.type === 'choice' ? e.options.map((o) => o.id) : []))]
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('modul testi: 10 ta variant tanlash savoli', () => {
    const t = exercisesOf('a1-m1-l6')
    expect(t).toHaveLength(10)
    expect(t.every((e) => e.type === 'choice')).toBe(true)
  })
  it("har soʻzning slug'i boʻsh emas (id barqaror; lotin boʻlmagan yozuvda slug majburiy)", () => {
    expect(slugErrors({ lessons: LESSONS, exercisesOf })).toEqual([])
  })
  it('soʻz ikonkalari mavjud', () => {
    for (const e of allExercises) if (e.type === 'word') expect(LESSON_ICONS[e.icon], e.id).toBeTruthy()
  })
})

describe('nemis kontenti: matn', () => {
  it('har matn uch tilda toʻliq (boʻsh emas)', () => {
    for (const t of allL3) for (const lang of LANGS) expect(t[lang]?.trim().length, JSON.stringify(t)).toBeGreaterThan(0)
  })
  it('lotin matnda oddiy apostrof (\') va boshqa xato belgilar yoʻq; faqat ʻ va ʼ', () => {
    for (const t of allL3) expect(t.uz, t.uz).not.toMatch(/['‘’`´]/)
  })
  it('kirill matnda lotincha apostrof/tutuq belgisi qolmagan va kirill harflari bor', () => {
    for (const t of allL3) {
      expect(t['uz-Cyrl'], t['uz-Cyrl']).not.toMatch(/['‘’`´ʻʼ]/)
      expect(t['uz-Cyrl'], t['uz-Cyrl']).toMatch(/[Ѐ-ӿ]/)
    }
  })
  it('ru matnda oʻzbek lotin tutuq belgisi yoʻq', () => {
    for (const t of allL3) expect(t.ru).not.toMatch(/[ʻʼ]/)
  })
  it('nemis matnda ß va umlaut toʻgʻri; oddiy apostrof yoʻq', () => {
    const de = allExercises.flatMap((e) => (e.type === 'word' ? [e.term, e.example.de] : e.type === 'choice' ? [e.sentence, e.full, ...e.options.map((o) => o.text)] : e.pairs.map((p) => p.term)))
    for (const s of de) expect(s).not.toMatch(/['‘’`]/)
    const joined = de.join(' ')
    expect(joined).toContain('Schweißer')
    expect(joined).toContain('heiße')
    expect(joined).toContain('Tschüss')
    expect(joined).toContain('Müller')
    expect(joined).not.toMatch(/heisse|Schweisser|Tschuess|Mueller/)
  })
  it('kirill matn translit emas: "ц" va "тс" xatolari yoʻq', () => {
    for (const t of allL3) expect(t['uz-Cyrl']).not.toMatch(/тс(?![а-я])|ц/i)
  })
})

describe('nemis kontenti: mashqlar', () => {
  it('har choice da aynan bitta toʻgʻri javob; variantlar 3–4 ta va takrorlanmaydi', () => {
    for (const e of allExercises) {
      if (e.type !== 'choice') continue
      expect(e.options.filter((o) => o.correct), e.id).toHaveLength(1)
      expect(e.options.length).toBeGreaterThanOrEqual(3)
      expect(e.options.length).toBeLessThanOrEqual(4)
      expect(new Set(e.options.map((o) => o.text)).size).toBe(e.options.length)
      expect(e.sentence.split('___')).toHaveLength(2) // bitta boʻshliq
      expect(e.full).toBe(e.sentence.replace('___', e.options.find((o) => o.correct)!.text))
    }
  })
  it('har match da 4 ta noyob juft (nemischa ham, tarjima ham)', () => {
    for (const e of allExercises) {
      if (e.type !== 'match') continue
      expect(e.pairs, e.id).toHaveLength(4)
      expect(new Set(e.pairs.map((p) => p.term)).size).toBe(4)
      for (const lang of LANGS) expect(new Set(e.pairs.map((p) => p.tr[lang])).size, `${e.id} ${lang}`).toBe(4)
    }
  })
  it('talaffuz yozuvi har soʻzda bor; kirill talaffuzda lotin harfi yoʻq', () => {
    for (const e of allExercises) if (e.type === 'word') expect(e.pron['uz-Cyrl'], e.id).not.toMatch(/[A-Za-z]/)
  })
})
