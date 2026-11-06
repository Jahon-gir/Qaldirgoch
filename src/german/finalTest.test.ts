import { describe, expect, it } from 'vitest'
import { LESSONS, RESULT_IDS, TEST_IDS } from '../content/german'
import { GAPS } from '../content/german/gaps'
import { VOCAB } from '../content/german/words'
import { isNoun } from './exercises'
import { arrange, buildTest, isPassed, isScopeUnlocked, methodCounts, passMark, scopeInfo, testId, testSize } from './finalTest'
import { levelProgress, moduleProgress, recordResult, sanitizeResults, type Results } from './logic'

const mod = scopeInfo('a1-m1', 'general')!
const allDone = (): Results => Object.fromEntries(LESSONS.filter((l) => l.moduleId === 'a1-m1').map((l) => [l.id, { lessonId: l.id, score: 1, total: 1, completedAt: '2026-11-01T00:00:00.000Z' }]))
const words = (qs: ReturnType<typeof buildTest>) => qs.filter((q) => q.kind === 'word')
const noRepeat = (qs: ReturnType<typeof buildTest>) => {
  const m = words(qs).map((q) => (q.kind === 'word' ? q.method : ''))
  for (let i = 1; i < m.length; i++) if (m[i] === m[i - 1]) return false
  return true
}

describe('modul testi tuzilishi', () => {
  it('12 savol: 8 soʻz (takrorlanmaydi) + 3 gap-tanlash + oxirida gap-yozish', () => {
    const qs = buildTest(mod, { canListen: true, seed: 1 })
    expect(qs).toHaveLength(12)
    expect(qs.slice(0, 8).every((q) => q.kind === 'word')).toBe(true)
    expect(qs.slice(8).map((q) => (q.kind === 'gap' ? q.mode : '-'))).toEqual(['choice', 'choice', 'choice', 'write'])
    const ids = words(qs).map((q) => (q.kind === 'word' ? q.wordId : ''))
    expect(new Set(ids).size).toBe(8)
    expect(ids.every((id) => VOCAB.find((w) => w.id === id)?.moduleId === 'a1-m1')).toBe(true)
    expect(new Set(qs.slice(8).map((q) => (q.kind === 'gap' ? q.gapId : ''))).size).toBe(4)
  })

  it('usullar: test 2, tinglash 2, yigʻish 1, yozish 2, artikl 1 (ot soʻzga)', () => {
    for (const seed of [1, 2, 3, 'x', 'y']) {
      const qs = words(buildTest(mod, { canListen: true, seed }))
      const c = (k: string) => qs.filter((q) => q.kind === 'word' && q.method === k).length
      expect([c('test'), c('listen'), c('build'), c('write'), c('article')]).toEqual([2, 2, 1, 2, 1])
      const art = qs.find((q) => q.kind === 'word' && q.method === 'article')!
      expect(isNoun(VOCAB.find((w) => art.kind === 'word' && w.id === art.wordId)!)).toBe(true)
    }
  })

  it('ketma-ket bir xil usul yoʻq (koʻp urugʻ bilan; ovoz yoʻq boʻlsa ham)', () => {
    for (let s = 0; s < 200; s++) {
      expect(noRepeat(buildTest(mod, { canListen: true, seed: s }))).toBe(true)
      expect(noRepeat(buildTest(mod, { canListen: false, seed: s }))).toBe(true)
    }
  })

  it('ovoz yoʻq: tinglash yoʻq, Test bilan almashadi', () => {
    const qs = words(buildTest(mod, { canListen: false, seed: 5 }))
    expect(qs.some((q) => q.kind === 'word' && q.method === 'listen')).toBe(false)
    expect(qs.filter((q) => q.kind === 'word' && q.method === 'test')).toHaveLength(4)
  })

  it('otsiz modul: artikl Test bilan almashadi va baribir ketma-ket takror yoʻq', () => {
    const vocab = VOCAB.filter((w) => !isNoun(w))
    for (let s = 0; s < 50; s++) {
      const qs = buildTest(mod, { canListen: false, seed: s, vocab })
      expect(qs.some((q) => q.kind === 'word' && q.method === 'article')).toBe(false)
      expect(noRepeat(qs)).toBe(true)
    }
    expect(Math.max(...methodCounts(8, false, 0).values())).toBeLessThanOrEqual(4)
  })

  it('bir xil urugʻ — bir xil test; boshqa urugʻ — odatda boshqacha', () => {
    expect(buildTest(mod, { canListen: true, seed: 'a' })).toEqual(buildTest(mod, { canListen: true, seed: 'a' }))
    const variants = new Set(Array.from({ length: 10 }, (_, s) => JSON.stringify(buildTest(mod, { canListen: true, seed: s }))))
    expect(variants.size).toBeGreaterThan(1)
  })

  it('soʻz va gap yetmasa — qisqaroq test; oxirgi gap yozish', () => {
    const vocab = VOCAB.slice(0, 5)
    const gaps = GAPS.slice(0, 2)
    const qs = buildTest(mod, { canListen: true, seed: 1, vocab, gaps })
    expect(qs).toHaveLength(7)
    expect(qs.slice(5).map((q) => (q.kind === 'gap' ? q.mode : '-'))).toEqual(['choice', 'write'])
    expect(testSize(mod, vocab, gaps)).toBe(7)
    expect(buildTest(mod, { canListen: true, seed: 1, vocab, gaps: GAPS.slice(0, 1) }).slice(-1)[0]).toMatchObject({ kind: 'gap', mode: 'write' })
  })

  it('arrange: imkon boʻlsa qoʻshni usullar har xil', () => {
    const seq = arrange(new Map([['test', 3], ['write', 2], ['build', 1]] as const), () => 0.3)
    expect(seq).toHaveLength(6)
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1])
  })
})

describe('daraja testi', () => {
  it('daraja ichidagi modullar kontentdan; 20 savol (16 soʻz + 4 gap)', () => {
    const lv = scopeInfo('level-A1', 'general')!
    expect(lv.moduleIds).toEqual(['a1-m1', 'a1-m2'])
    expect(scopeInfo('level-A1', 'technical')!.moduleIds).toEqual(['a1-m1', 'a1-m2', 'a1-m3'])
    const qs = buildTest(lv, { canListen: true, seed: 7 })
    expect(qs).toHaveLength(20)
    expect(words(qs)).toHaveLength(16)
    expect(qs.slice(-1)[0]).toMatchObject({ kind: 'gap', mode: 'write' })
    expect(noRepeat(qs)).toBe(true)
  })
  it('notanish doira — null', () => {
    expect(scopeInfo('yoq', 'general')).toBeNull()
    expect(scopeInfo('level-C2', 'general')).toBeNull()
  })
})

describe('oʻtish chegarasi', () => {
  it('11/12; qisqa testda ceil(total × 11/12)', () => {
    expect(passMark(12)).toBe(11)
    expect(passMark(20)).toBe(19)
    expect(passMark(7)).toBe(7)
    expect(passMark(6)).toBe(6)
    expect(passMark(24)).toBe(22)
    expect(isPassed(11, 12)).toBe(true)
    expect(isPassed(10, 12)).toBe(false)
    expect(isPassed(19, 20)).toBe(true)
    expect(isPassed(18, 20)).toBe(false)
  })
})

describe('ochilish', () => {
  it('modul testi: barcha darslar tugagach ochiladi', () => {
    expect(isScopeUnlocked(mod, {})).toBe(false)
    const r = allDone()
    delete r['a1-m1-l6']
    expect(isScopeUnlocked(mod, r)).toBe(false)
    expect(isScopeUnlocked(mod, allDone())).toBe(true)
  })
  it('daraja testi: draft (darsi yoʻq) modul bor — qulf', () => {
    expect(isScopeUnlocked(scopeInfo('level-A1', 'general')!, allDone())).toBe(false)
  })
})

describe('saqlash: user_lessons da "test:<scope>"', () => {
  it('test id lari qabul qilinadi, notanish — yoʻq', () => {
    expect(TEST_IDS.has('test:a1-m1')).toBe(true)
    expect(TEST_IDS.has('test:level-A1')).toBe(true)
    expect(RESULT_IDS.has('a1-m1-l1')).toBe(true)
    const r = sanitizeResults({ 'test:a1-m1': { score: 11, total: 12, completedAt: '2026-11-01T00:00:00.000Z' }, 'test:yoq': { score: 1, total: 1, completedAt: '2026-11-01T00:00:00.000Z' } })
    expect(Object.keys(r)).toEqual(['test:a1-m1'])
  })
  it('eng yuqori natija qoladi; moduleProgress va levelProgress ga taʼsir qilmaydi', () => {
    const at = '2026-11-01T00:00:00.000Z'
    let r: Results = {}
    r = recordResult(r, { lessonId: testId('a1-m1'), score: 8, total: 12, completedAt: at })
    r = recordResult(r, { lessonId: testId('a1-m1'), score: 11, total: 12, completedAt: at })
    r = recordResult(r, { lessonId: testId('a1-m1'), score: 9, total: 12, completedAt: at })
    expect(r['test:a1-m1'].score).toBe(11)
    expect(moduleProgress('a1-m1', r)).toEqual({ done: 0, total: 6, percent: 0 })
    expect(levelProgress('A1', 'general', r).done).toBe(0)
  })
})
