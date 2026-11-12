import { describe, expect, it, vi } from 'vitest'
import { DE_COURSE } from '../../lang/de'
import { visibleModules, lessonsOf } from '../../german/logic'
import { buildTest, scopeInfo } from '../../german/finalTest'
import { DE_PACKS } from '../german/packs'

// Haqiqiy paketlar bilan (setup'dagi oʻchirishni bekor qilamiz)
vi.unmock('../german/packs')

describe('nemis kursi kasbiy paketlar bilan', () => {
  const packModules = DE_COURSE.modules.filter((m) => !m.id.startsWith('a1-'))

  it('paketlar yuklangan va har bir vaziyat modulga aylangan', () => {
    expect(DE_PACKS.length).toBeGreaterThan(0)
    const situations = DE_PACKS.flatMap((p) => p.situations.map((s) => `${p.field}-${s.id}`))
    expect(packModules.map((m) => m.id).sort()).toEqual(situations.sort())
  })

  it('asosiy modullar avvalgidek birinchi; umumiy (Ish kundaligi) hammaga, kasbiy — oʻz yoʻnalishiga', () => {
    const care = visibleModules('care', DE_COURSE.modules).filter((m) => m.level === 'A1').map((m) => m.id)
    const base = care.filter((id) => id.startsWith('a1-'))
    expect(care.slice(0, base.length)).toEqual(base)
    expect(care).toContain('general-xavfsizlik')
    expect(care).toContain('care-parvarish')
    expect(care).not.toContain('technical-asboblar')
    expect(visibleModules('general', DE_COURSE.modules).map((m) => m.direction)).not.toContain('care')
  })

  it('har bir dars: soʻz kartalari (oʻqilishi bilan) va lugʻatga tushadigan id = paket id', () => {
    for (const m of packModules) {
      const lessons = lessonsOf(m.id, DE_COURSE.lessons)
      expect(lessons.length, m.id).toBeGreaterThan(0)
      for (const l of lessons) {
        const words = DE_COURSE.exercisesOf(l.id).filter((e) => e.type === 'word')
        expect(words.length, l.id).toBeGreaterThanOrEqual(3)
        for (const w of words) expect(w.type === 'word' && w.pron.uz !== '' && w.pron['uz-Cyrl'] !== '' && w.pron.ru !== '', w.id).toBe(true)
        const ids = DE_COURSE.wordIdsOfLesson(l.id)
        for (const id of ids) expect(DE_COURSE.wordById(id)?.moduleId).toBe(m.id)
      }
    }
    const packIds = DE_PACKS.flatMap((p) => p.words.filter((w) => w.status !== 'draft').map((w) => w.id)).sort()
    expect(DE_COURSE.vocab.filter((v) => !v.id.startsWith('a1-')).map((v) => v.id).sort()).toEqual(packIds)
  })

  it('22 ta asosiy soʻz va id lar oʻzgarmagan', () => {
    expect(DE_COURSE.vocab.filter((v) => v.id.startsWith('a1-'))).toHaveLength(22)
  })

  it('modul yakuniy testi paket modulida ham quriladi (gap savolsiz)', () => {
    const info = scopeInfo(packModules[0].id, 'general', DE_COURSE)
    expect(info).toBeTruthy()
    const qs = buildTest(info!, { canListen: false, seed: 1, course: DE_COURSE })
    expect(qs.length).toBeGreaterThan(0)
    expect(qs.every((q) => q.kind === 'word')).toBe(true)
  })
})
