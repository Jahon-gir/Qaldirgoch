import { describe, expect, it } from 'vitest'
import { buildTest, isScopeUnlocked, levelScope, scopeInfo, testSize } from '../german/finalTest'
import { KO_LESSONS } from '../content/korean'
import { courseIdOfWord } from './registry'
import { KO_COURSE } from './ko'

const NOW = '2026-11-01T00:00:00.000Z'
const results = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, { lessonId: id, score: 1, total: 1, completedAt: NOW }]))
const ids = (m: string) => KO_LESSONS.filter((l) => l.moduleId === m).map((l) => l.id)

describe('yakuniy test: koreys kursi (Hangul 2-modul)', () => {
  it('scope: modul va daraja; daraja ikkala Hangul modulini oʻz ichiga oladi', () => {
    const m2 = scopeInfo('ko-h-m2', 'general', KO_COURSE)!
    expect(m2).toMatchObject({ type: 'module', level: 'ko-H', moduleIds: ['ko-h-m2'], course: 'ko' })
    const lv = scopeInfo(levelScope('ko-H'), 'general', KO_COURSE)!
    expect(lv).toMatchObject({ type: 'level', level: 'ko-H', moduleIds: ['ko-h-m1', 'ko-h-m2'], wordCount: 16 })
    expect(scopeInfo('level-ko-T1', 'general', KO_COURSE)).not.toBeNull() // darajada modullar bor, lekin darslar yoʻq
    expect(scopeInfo('ko-t1-m1', 'general', KO_COURSE)!.moduleIds).toEqual(['ko-t1-m1'])
  })
  it('ochilish: modul — oʻz darslari tugagach; daraja — ikkala modul; TOPIK 1 — darssiz, hech qachon', () => {
    const m1 = scopeInfo('ko-h-m1', 'general', KO_COURSE)!
    const m2 = scopeInfo('ko-h-m2', 'general', KO_COURSE)!
    const lv = scopeInfo('level-ko-H', 'general', KO_COURSE)!
    expect(isScopeUnlocked(m2, {})).toBe(false)
    expect(isScopeUnlocked(m2, results(...ids('ko-h-m1')))).toBe(false)
    expect(isScopeUnlocked(m2, results(...ids('ko-h-m2')))).toBe(true)
    expect(isScopeUnlocked(m1, results(...ids('ko-h-m2')))).toBe(false)
    expect(isScopeUnlocked(lv, results(...ids('ko-h-m1')))).toBe(false)
    expect(isScopeUnlocked(lv, results(...ids('ko-h-m1'), ...ids('ko-h-m2')))).toBe(true)
    expect(isScopeUnlocked(scopeInfo('level-ko-T1', 'general', KO_COURSE)!, results(...ids('ko-h-m1'), ...ids('ko-h-m2')))).toBe(false)
  })
  it('savollar: modul — 8, daraja — 16; faqat koreys soʻzlari; yozish va artikl yoʻq; soʻzlar takrorlanmaydi', () => {
    for (const [scope, n, mods] of [['ko-h-m2', 8, ['ko-h-m2']], ['level-ko-H', 16, ['ko-h-m1', 'ko-h-m2']]] as const) {
      const info = scopeInfo(scope, 'general', KO_COURSE)!
      expect(testSize(info)).toBe(n)
      for (let seed = 1; seed <= 20; seed++) {
        const qs = buildTest(info, { canListen: seed % 2 === 0, seed })
        expect(qs).toHaveLength(n)
        const wordIds = qs.flatMap((q) => (q.kind === 'word' ? [q.wordId] : []))
        expect(new Set(wordIds).size).toBe(n)
        for (const id of wordIds) {
          expect(courseIdOfWord(id)).toBe('ko')
          expect(mods.includes(KO_COURSE.wordById(id)!.moduleId as never)).toBe(true)
        }
        for (const q of qs) if (q.kind === 'word') expect(['write', 'article']).not.toContain(q.method)
        expect(qs.some((q) => q.kind === 'gap')).toBe(false) // koreys kursida gap yoʻq
      }
    }
  })
  it('2-modul testida 2-modul soʻzlari, daraja testida ikkala moduldan', () => {
    const lv = scopeInfo('level-ko-H', 'general', KO_COURSE)!
    const seen = new Set<string>()
    for (let seed = 1; seed <= 30; seed++) for (const q of buildTest(lv, { canListen: true, seed })) if (q.kind === 'word') seen.add(KO_COURSE.wordById(q.wordId)!.moduleId)
    expect([...seen].sort()).toEqual(['ko-h-m1', 'ko-h-m2'])
  })
})
