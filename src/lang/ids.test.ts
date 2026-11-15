import { describe, expect, it, vi } from 'vitest'
import { lessonWordIds } from './words'

vi.unmock('../content/german/packs')
const { ALL_RESULT_IDS, ALL_WORD_IDS, COURSES } = await import('./registry')
const ids = await import('./ids')

describe('ids.gen.json (ishga tushishdagi id nusxasi)', () => {
  it('natija id\'lari registry bilan aynan teng (eskirgan boʻlsa: npm run content:ids)', () => {
    expect([...ids.ALL_RESULT_IDS].sort()).toEqual([...ALL_RESULT_IDS].sort())
  })

  it('soʻz id\'lari registry bilan aynan teng', () => {
    expect([...ids.ALL_WORD_IDS].sort()).toEqual([...ALL_WORD_IDS].sort())
  })

  it('har darsning soʻzlari kurs bilan bir xil (tartibi ham)', () => {
    for (const c of COURSES) for (const l of c.lessons) expect(ids.wordIdsOfAnyLesson(l.id), l.id).toEqual(lessonWordIds(c, l.id))
  })

  it('notanish dars — boʻsh roʻyxat; natija nusxa (asl roʻyxat buzilmaydi)', () => {
    expect(ids.wordIdsOfAnyLesson('yoq-dars')).toEqual([])
    expect(ids.wordIdsOfAnyLesson('__proto__')).toEqual([])
    const a = ids.wordIdsOfAnyLesson('a1-m1-l1')
    a.push('x')
    expect(ids.wordIdsOfAnyLesson('a1-m1-l1')).not.toContain('x')
  })

  it('paketli kurs ham ichida (2400+ soʻz)', () => {
    expect(ids.ALL_WORD_IDS.size).toBeGreaterThan(2400)
    expect(ids.ALL_RESULT_IDS.has('test:field-care')).toBe(true)
    expect(ids.ALL_RESULT_IDS.has('care-parvarish-l1')).toBe(true)
  })
})
