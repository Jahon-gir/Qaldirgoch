import { describe, expect, it } from 'vitest'
import { buildVocab, lessonWordIds } from '../../lang/words'
import { visibleModules } from '../../german/logic'
import { FALLBACK_ICON, packsToCourse, WORDS_PER_LESSON } from './toCourse'
import type { ContentPack, PackWord } from './types'

const L = (s: string) => ({ uz: s, 'uz-Cyrl': s, ru: s })
const w = (slug: string, o: Partial<PackWord> = {}): PackWord => ({
  id: `technical-asboblar-${slug}`, slug, term: `der ${slug[0].toUpperCase()}${slug.slice(1)}`, article: 'der', tr: L(slug), pron: L(slug),
  level: 'A1', field: 'technical', jobs: [], situation: 'asboblar', safety: false, status: 'review', icon: 'tools', ...o
})
const pack = (words: PackWord[], o: Partial<ContentPack> = {}): ContentPack => ({
  schema: 1, course: 'de', field: 'technical', title: L('Texnik'), order: 3,
  situations: [{ id: 'asboblar', title: L('Asboblar'), order: 1, level: 'A1' }], words, ...o
})

describe('packsToCourse', () => {
  it('vaziyat → modul; soʻzlar 6 tadan darsga; juftlash mashqi; lugʻat id = paket id', () => {
    const words = 'hammer zange saege bohrer schraube nagel meter leiter kelle'.split(' ').map((s) => w(s))
    const c = packsToCourse([pack(words)])
    expect(c.modules).toEqual([{ id: 'technical-asboblar', level: 'A1', direction: 'technical', order: 301, status: 'review', title: L('Asboblar') }])
    expect(c.lessons.map((l) => [l.id, l.title.uz])).toEqual([['technical-asboblar-l1', 'Asboblar · 1-qism'], ['technical-asboblar-l2', 'Asboblar · 2-qism']])
    expect(c.exercises['technical-asboblar-l1'].map((e) => e.type)).toEqual([...Array(WORDS_PER_LESSON).fill('word'), 'match'])
    const src = { lessons: c.lessons, exercisesOf: (id: string) => c.exercises[id] ?? [] }
    expect(buildVocab(src).map((v) => v.id)).toEqual(words.map((x) => x.id))
    expect(lessonWordIds(src, 'technical-asboblar-l2')).toEqual(words.slice(6).map((x) => x.id))
  })

  it('oxirgi darsda 1–2 soʻz qolsa oldingisiga qoʻshiladi', () => {
    const c = packsToCourse([pack('a b c d e f g'.split(' ').map((s) => w(s)))])
    expect(c.lessons).toHaveLength(1)
    expect(c.lessons[0].title.uz).toBe('Asboblar')
  })

  it('qoralama soʻz chiqmaydi; faqat qoralamali vaziyat — modul yoʻq; hammasi tasdiqlangan — approved', () => {
    expect(packsToCourse([pack([w('a', { status: 'draft' })])]).modules).toEqual([])
    const c = packsToCourse([pack([w('a', { status: 'approved' }), w('b', { status: 'draft' })])])
    expect(c.modules[0].status).toBe('approved')
    expect(c.exercises['technical-asboblar-l1']).toHaveLength(1)
  })

  it('nomaʼlum ikonka — umumiy belgi; rasm, koʻplik, xavfsizlik, audio karta mashqiga oʻtadi', () => {
    const c = packsToCourse([pack([w('a', { icon: 'yoq', plural: 'die As', safety: true, audio: 'content/de/audio/a.mp3', image: { src: 'content/de/img/a.webp', source: 'ai', checked: true } })])], { icons: new Set(['tools']) })
    expect(c.exercises['technical-asboblar-l1'][0]).toMatchObject({ icon: FALLBACK_ICON, plural: 'die As', safety: true, audioUrl: 'content/de/audio/a.mp3', image: { src: 'content/de/img/a.webp' } })
  })

  it('umumiy (general) modul hammaga, kasbiy modul faqat oʻz yoʻnalishiga koʻrinadi', () => {
    const c = packsToCourse([
      pack([w('a')]),
      pack([w('b', { field: 'general', id: 'general-asboblar-b' })], { field: 'general', order: 1 })
    ])
    expect(visibleModules('care', c.modules).map((m) => m.id)).toEqual(['general-asboblar'])
    expect(visibleModules('technical', c.modules).map((m) => m.id)).toEqual(['general-asboblar', 'technical-asboblar'])
  })
})
