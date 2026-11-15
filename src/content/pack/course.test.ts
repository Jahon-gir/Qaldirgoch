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

  it('modul yakuniy testi paket modulida: 8 soʻz + 4 gap (darsdagi boʻshliq mashqlaridan), oxirgisi yozish', () => {
    const info = scopeInfo(packModules[0].id, 'general', DE_COURSE)
    expect(info).toBeTruthy()
    const qs = buildTest(info!, { canListen: false, seed: 1, course: DE_COURSE })
    expect(qs.filter((q) => q.kind === 'word')).toHaveLength(8)
    const gaps = qs.filter((q) => q.kind === 'gap')
    expect(gaps).toHaveLength(4)
    expect(qs[qs.length - 1]).toMatchObject({ kind: 'gap', mode: 'write' })
    for (const q of gaps) expect(q.kind === 'gap' && DE_COURSE.gapById(q.gapId)?.moduleId).toBe(packModules[0].id)
  })

  it('paket gaplari: darsdagi mashq bilan aynan bir xil, javob soʻzi lugʻatda, id lar takrorlanmaydi', () => {
    const packGaps = DE_COURSE.gaps.filter((g) => g.id.startsWith('p:'))
    expect(packGaps.length).toBeGreaterThan(packModules.length * 4)
    expect(new Set(DE_COURSE.gaps.map((g) => g.id)).size).toBe(DE_COURSE.gaps.length)
    for (const g of packGaps) {
      const ex = DE_COURSE.exercisesOf(g.lessonId).find((e) => e.id === g.id.slice(2))
      expect(ex?.type, g.id).toBe('choice')
      if (ex?.type !== 'choice') continue
      expect(g.sentence).toBe(ex.sentence)
      expect(g.sentence.replace('___', g.answer)).toBe(ex.full)
      expect(new Set([g.answer, ...g.distractors]).size).toBe(3)
      const w = DE_COURSE.wordById(g.wordId!)
      expect(w?.term.endsWith(` ${g.answer}`), g.id).toBe(true)
      expect(w?.moduleId).toBe(g.moduleId)
    }
    // deyarli har vaziyatda kamida 4 gap — modul testi 12 savol (misolda ot shakli oʻzgargan vaziyatlarda kamroq)
    const full = packModules.filter((m) => packGaps.filter((g) => g.moduleId === m.id).length >= 4)
    expect(full.length).toBeGreaterThan(packModules.length * 0.9)
  })
})

describe('paket darslaridagi boʻshliq mashqlari', () => {
  it('har birida bitta toʻgʻri javob, ___ bor va toʻliq gap = toʻgʻri javob qoʻyilgan gap', () => {
    let n = 0
    for (const l of DE_COURSE.lessons.filter((x) => !x.id.startsWith('a1-'))) {
      for (const e of DE_COURSE.exercisesOf(l.id)) {
        if (e.type !== 'choice') continue
        n++
        const right = e.options.filter((o) => o.correct)
        expect(right, e.id).toHaveLength(1)
        expect(e.sentence.split('___')).toHaveLength(2)
        expect(e.sentence.replace('___', right[0].text)).toBe(e.full)
        expect(new Set(e.options.map((o) => o.text)).size).toBe(3)
      }
    }
    expect(n).toBeGreaterThan(20)
  })
})
