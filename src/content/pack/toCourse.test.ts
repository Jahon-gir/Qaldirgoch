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
    expect(c.lessons.map((l) => [l.id, l.title.uz])).toEqual([['technical-asboblar-l1', '1-qism'], ['technical-asboblar-l2', '2-qism']])
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

describe('boʻshliqni toʻldiring (misol gapdan)', () => {
  const ex = (term: string) => ({ term, tr: L(`tarjima: ${term}`) })
  it('ot misolda boʻlsa — boʻshliq, tarjima va 3 variant (bittasi toʻgʻri); oʻzgargan shakl — mashq yoʻq', () => {
    const words = [
      w('hammer', { example: ex('Gib mir bitte den Hammer.') }),
      w('zange', { article: 'die', term: 'die Zange', example: ex('Die Zange liegt dort.') }),
      w('nagel', { example: ex('Ich brauche zehn Nägel.') }),
      w('saege', { article: 'die', term: 'die Säge' })
    ]
    const c = packsToCourse([pack(words)])
    const choices = c.exercises['technical-asboblar-l1'].filter((e) => e.type === 'choice')
    expect(choices).toHaveLength(2)
    const [a, b] = choices as Extract<(typeof choices)[number], { type: 'choice' }>[]
    expect(a.sentence).toBe('Gib mir bitte den ___.')
    expect(a.options.filter((o) => o.correct).map((o) => o.text)).toEqual(['Hammer'])
    expect(a.options).toHaveLength(3)
    expect(a.translation.uz).toBe('tarjima: Gib mir bitte den Hammer.')
    expect(b.sentence).toBe('Die ___ liegt dort.')
    expect(b.options.find((o) => o.correct)?.text).toBe('Zange')
    // toʻgʻri javob har doim birinchi emas
    expect(a.options.findIndex((o) => o.correct)).not.toBe(b.options.findIndex((o) => o.correct))
  })

  it('soʻz qismi (Hammer → Vorschlaghammer) boʻshliqqa aylanmaydi', () => {
    const words = [w('hammer', { example: ex('Das ist ein Vorschlaghammer.') }), w('zange'), w('saege')]
    expect(packsToCourse([pack(words)]).exercises['technical-asboblar-l1'].some((e) => e.type === 'choice')).toBe(false)
  })
})

describe('dialog (0.17.0)', () => {
  const line = (speaker: string, de: string) => ({ speaker: L(speaker), de, tr: L(`${de} (uz)`) })
  const dialog = (status: 'draft' | 'review' | 'approved' = 'review') => ({
    status,
    lines: [line('Usta', 'Guten Morgen!'), line('Ishchi', 'Morgen!'), line('Usta', 'Wo ist der Hammer?'), line('Ishchi', 'Im Wagen.'), line('Usta', 'Hol ihn, bitte.'), line('Ishchi', 'Mache ich.')]
  })
  const words = 'hammer zange saege bohrer schraube nagel meter leiter kelle'.split(' ').map((s) => w(s))

  it('vaziyatning oxirgi darsi oxirida; savol — usta gapi, javob — ishchi gapi (salomlashuvdan keyin), variantlar shu dialogdan', () => {
    const c = packsToCourse([pack(words, { situations: [{ id: 'asboblar', title: L('Asboblar'), order: 1, level: 'A1', dialog: dialog() }] })])
    expect(c.exercises['technical-asboblar-l1'].some((e) => e.type === 'dialog')).toBe(false)
    const l2 = c.exercises['technical-asboblar-l2']
    const last = l2[l2.length - 1]
    expect(last.type).toBe('dialog')
    if (last.type !== 'dialog') return
    expect(last.id).toBe(`technical-asboblar-l2-e${c.exercises['technical-asboblar-l2'].length}`)
    expect(last.check).toEqual({ ask: 2, answer: 3, options: [1, 5, 3] }) // 2 % 3 = 2 — javob oxirida
    expect(last.lines[3].text).toBe('Im Wagen.')
  })

  it('qoralama dialog chiqmaydi; tasdiqlanmagan dialog modulni "review" qiladi', () => {
    const sit = (d: ReturnType<typeof dialog>) => ({ situations: [{ id: 'asboblar', title: L('Asboblar'), order: 1, level: 'A1', dialog: d }] })
    const ws = [w('a', { status: 'approved' }), w('b', { status: 'approved' }), w('c', { status: 'approved' })]
    const draft = packsToCourse([pack(ws, sit(dialog('draft')))])
    expect(draft.exercises['technical-asboblar-l1'].some((e) => e.type === 'dialog')).toBe(false)
    expect(draft.modules[0].status).toBe('approved')
    expect(packsToCourse([pack(ws, sit(dialog('review')))]).modules[0].status).toBe('review')
  })

  it('dialog lugʻatga tushmaydi', () => {
    const c = packsToCourse([pack(words.slice(0, 3), { situations: [{ id: 'asboblar', title: L('Asboblar'), order: 1, level: 'A1', dialog: dialog() }] })])
    const src = { lessons: c.lessons, exercisesOf: (id: string) => c.exercises[id] ?? [] }
    expect(buildVocab(src)).toHaveLength(3)
  })
})
