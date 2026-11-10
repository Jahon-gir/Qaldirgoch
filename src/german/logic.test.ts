import { describe, expect, it, vi } from 'vitest'
import { LESSONS, MODULES, exercisesOf, type ChoiceExercise, type MatchExercise } from '../content/german'
import { fetchRemoteResults, pushRemoteResults } from './remote'
import {
  choiceOutcome, currentInModule, directionFromProfession, effectiveDirection, isCorrectOption, isMatchingPair, levelProgress, matchColumns, matchOutcome, mergeResults, moduleProgress,
  nextLessonAfter, nextUnfinished, pickBetter, recordResult, resultsToPush, sanitizeResults, seededShuffle, summarize, visibleModules, wordOutcome, type Result, type Results
} from './logic'

const T1 = '2026-11-01T10:00:00.000Z'
const T2 = '2026-11-02T10:00:00.000Z'
const res = (lessonId: string, score: number, total: number, completedAt = T1): Result => ({ lessonId, score, total, completedAt })
const choiceEx = exercisesOf('a1-m1-l1').find((e): e is ChoiceExercise => e.type === 'choice')!
const matchEx = exercisesOf('a1-m1-l1').find((e): e is MatchExercise => e.type === 'match')!

describe('yoʻnalishni aniqlash', () => {
  it('kasbdan avtomatik', () => {
    expect(directionFromProfession('electrician')).toBe('technical')
    expect(directionFromProfession('welder')).toBe('technical')
    expect(directionFromProfession('mechanic')).toBe('technical')
    expect(directionFromProfession('nurse')).toBe('care')
    expect(directionFromProfession('cook')).toBe('hospitality')
    expect(directionFromProfession('construction')).toBe('general')
    expect(directionFromProfession('other')).toBe('general')
    expect(directionFromProfession(undefined)).toBe('general')
  })
  it('qoʻlda tanlangani ustun', () => {
    expect(effectiveDirection({ profession: 'electrician' })).toBe('technical')
    expect(effectiveDirection({ profession: 'electrician', germanDirection: 'care' })).toBe('care')
    expect(effectiveDirection(null)).toBe('general')
  })
  it('umumiy modullar hammaga, kasbiy faqat oʻz yoʻnalishiga', () => {
    expect(visibleModules('general').map((m) => m.id)).toEqual(['a1-m1', 'a1-m2'])
    expect(visibleModules('care').map((m) => m.id)).toEqual(['a1-m1', 'a1-m2'])
    expect(visibleModules('technical').map((m) => m.id)).toEqual(['a1-m1', 'a1-m2', 'a1-m3'])
  })
})

describe('mashq tekshiruvi', () => {
  it('choice: faqat toʻgʻri variant toʻgʻri', () => {
    const right = choiceEx.options.find((o) => o.correct)!
    const bad = choiceEx.options.find((o) => !o.correct)!
    expect(isCorrectOption(choiceEx, right.id)).toBe(true)
    expect(isCorrectOption(choiceEx, bad.id)).toBe(false)
    expect(isCorrectOption(choiceEx, 'yoq')).toBe(false)
  })
  it('match: faqat bir xil juft mos', () => {
    const [a, b] = matchEx.pairs
    expect(isMatchingPair(matchEx, a.id, a.id)).toBe(true)
    expect(isMatchingPair(matchEx, a.id, b.id)).toBe(false)
    expect(isMatchingPair(matchEx, 'x', 'x')).toBe(false)
  })
  it('aralashtirish barqaror, hamma elementni saqlaydi, oʻng ustun chap bilan bir xil emas', () => {
    const { left, right } = matchColumns(matchEx)
    expect(matchColumns(matchEx).left.map((p) => p.id)).toEqual(left.map((p) => p.id))
    expect(left.map((p) => p.id).sort()).toEqual(matchEx.pairs.map((p) => p.id).sort())
    expect(right.map((p) => p.id)).not.toEqual(left.map((p) => p.id))
    expect(seededShuffle([1, 2, 3, 4], 'a')).toHaveLength(4)
  })
})

describe('ball hisoblash', () => {
  it('soʻz ball bermaydi; choice 1 ball; match har juft uchun', () => {
    expect(wordOutcome()).toEqual({ total: 0, correct: 0, mistakes: [] })
    const right = choiceEx.options.find((o) => o.correct)!.id
    expect(choiceOutcome(choiceEx, right)).toMatchObject({ total: 1, correct: 1, mistakes: [] })
    const wrong = choiceOutcome(choiceEx, choiceEx.options.find((o) => !o.correct)!.id)
    expect(wrong).toMatchObject({ total: 1, correct: 0 })
    expect(wrong.mistakes).toEqual([{ key: choiceEx.id, de: choiceEx.full, tr: choiceEx.translation }])
    const m = matchOutcome(matchEx, [matchEx.pairs[0].id, matchEx.pairs[0].id]) // bir juftda ikki xato — bitta xato juft
    expect(m).toMatchObject({ total: 4, correct: 3 })
    expect(m.mistakes.map((x) => x.de)).toEqual([matchEx.pairs[0].term])
    expect(matchOutcome(matchEx, [])).toMatchObject({ total: 4, correct: 4, mistakes: [] })
  })
  it('summarize: ball, yangi soʻzlar, takrorlanmaydigan xatolar', () => {
    const ex = exercisesOf('a1-m1-l1')
    const wrong = choiceOutcome(choiceEx, choiceEx.options.find((o) => !o.correct)!.id)
    const s = summarize(ex, [wordOutcome(), wrong, wrong, matchOutcome(matchEx, [])])
    expect(s).toMatchObject({ score: 4, total: 6, newWords: 4 })
    expect(s.mistakes).toHaveLength(1)
  })
  it('toʻliq toʻgʻri dars: ball = jami', () => {
    const ex = exercisesOf('a1-m1-l1')
    const outs = ex.map((e) => (e.type === 'word' ? wordOutcome() : e.type === 'choice' ? choiceOutcome(e, e.options.find((o) => o.correct)!.id) : matchOutcome(e, [])))
    const s = summarize(ex, outs)
    expect(s.score).toBe(s.total)
    expect(s.total).toBe(7)
  })
})

describe('eng yuqori ball', () => {
  it('yuqorisi saqlanadi, pastrogʻi oʻzgartirmaydi', () => {
    let r: Results = recordResult({}, res('a1-m1-l1', 5, 7, T1))
    const better = recordResult(r, res('a1-m1-l1', 7, 7, T2))
    expect(better['a1-m1-l1']).toMatchObject({ score: 7, completedAt: T2 })
    const worse = recordResult(better, res('a1-m1-l1', 3, 7, '2026-11-03T00:00:00.000Z'))
    expect(worse).toBe(better) // oʻzgarmadi
    r = recordResult(r, res('a1-m1-l1', 5, 7, T2))
    expect(r['a1-m1-l1'].completedAt).toBe(T1) // teng: avvalgisi qoladi
  })
  it('jami boshqacha boʻlsa ulush boʻyicha solishtiriladi', () => {
    expect(pickBetter(res('x', 6, 8), res('x', 5, 6))).toMatchObject({ score: 5, total: 6 })
  })
})

describe('mehmon → akkaunt birlashtirish', () => {
  it('har dars boʻyicha yuqori ball, ikkala tomondagi darslar qoladi', () => {
    const local: Results = { 'a1-m1-l1': res('a1-m1-l1', 5, 7), 'a1-m1-l2': res('a1-m1-l2', 7, 7) }
    const server: Results = { 'a1-m1-l1': res('a1-m1-l1', 7, 7, T2), 'a1-m1-l3': res('a1-m1-l3', 4, 7) }
    const m = mergeResults(local, server)
    expect(Object.keys(m).sort()).toEqual(['a1-m1-l1', 'a1-m1-l2', 'a1-m1-l3'])
    expect(m['a1-m1-l1'].score).toBe(7)
    expect(mergeResults(server, local)).toEqual(m) // tartibga bogʻliq emas
  })
  it('serverga faqat yetmaganlari yuboriladi (oflayn navbat)', () => {
    const local: Results = { 'a1-m1-l1': res('a1-m1-l1', 5, 7), 'a1-m1-l2': res('a1-m1-l2', 7, 7) }
    const server: Results = { 'a1-m1-l1': res('a1-m1-l1', 7, 7, T2) }
    const merged = mergeResults(local, server)
    expect(resultsToPush(merged, server).map((r) => r.lessonId)).toEqual(['a1-m1-l2'])
    expect(resultsToPush(merged, merged)).toEqual([])
  })
})

describe('sanitizeResults', () => {
  it('nomaʼlum dars, notoʻgʻri ball va sanani tashlaydi', () => {
    const raw = {
      'a1-m1-l1': { score: 5, total: 7, completedAt: T1 },
      yoq: { score: 1, total: 1, completedAt: T1 },
      'a1-m1-l2': { score: 9, total: 7, completedAt: T1 },
      'a1-m1-l3': { score: 1.5, total: 7, completedAt: T1 },
      'a1-m1-l4': { score: 1, total: 7, completedAt: 'bad' },
      'a1-m1-l5': 5
    }
    expect(sanitizeResults(raw)).toEqual({ 'a1-m1-l1': res('a1-m1-l1', 5, 7) })
    expect(sanitizeResults(null)).toEqual({})
    expect(sanitizeResults([1])).toEqual({})
  })
})

describe('progress va keyingi dars', () => {
  it('modul/daraja progressi va "Davom eting"', () => {
    const r: Results = { 'a1-m1-l1': res('a1-m1-l1', 7, 7), 'a1-m1-l2': res('a1-m1-l2', 7, 7) }
    expect(moduleProgress('a1-m1', r)).toEqual({ done: 2, total: 6, percent: 33 })
    expect(levelProgress('A1', 'general', r)).toMatchObject({ done: 2, total: 6 })
    expect(levelProgress('A2', 'general', r)).toEqual({ done: 0, total: 0, percent: 0 })
    expect(nextUnfinished('general', {})?.id).toBe('a1-m1-l1')
    expect(nextUnfinished('general', r)?.id).toBe('a1-m1-l3')
    expect(currentInModule('a1-m1', r)?.id).toBe('a1-m1-l3')
  })
  it('hammasi tugasa — null; keyingi dars oxirgisida yoʻq', () => {
    const all = Object.fromEntries(LESSONS.map((l) => [l.id, res(l.id, 1, 1)]))
    expect(nextUnfinished('general', all)).toBeNull()
    expect(nextLessonAfter('a1-m1-l1', 'general')?.id).toBe('a1-m1-l2')
    expect(nextLessonAfter('a1-m1-l6', 'general')).toBeNull()
    expect(MODULES.length).toBe(3)
  })
})

describe('server bilan ishlash (mock)', () => {
  const fake = (result: { data?: unknown; error?: unknown }) => {
    const upsert = vi.fn().mockResolvedValue(result)
    const eq = vi.fn().mockResolvedValue(result)
    const from = vi.fn(() => ({ select: () => ({ eq }), upsert }))
    return { client: { from } as never, upsert, eq, from }
  }
  it('serverdagi qatorlar Results ga aylanadi', async () => {
    const { client, eq, from } = fake({ data: [{ lesson_id: 'a1-m1-l1', score: 5, total: 7, completed_at: T1 }, { lesson_id: 'junk', score: 1, total: 1, completed_at: T1 }] })
    expect(await fetchRemoteResults(client, 'u1')).toEqual({ 'a1-m1-l1': res('a1-m1-l1', 5, 7) })
    expect(from).toHaveBeenCalledWith('user_lessons')
    expect(eq).toHaveBeenCalledWith('user_id', 'u1')
  })
  it('tarmoq xatosi tashlanadi', async () => {
    await expect(fetchRemoteResults(fake({ error: new Error('offline') }).client, 'u1')).rejects.toThrow()
  })
  it('yozishda user_id yuboriladi; boʻsh roʻyxatda murojaat yoʻq', async () => {
    const { client, upsert } = fake({})
    await pushRemoteResults(client, 'u1', [res('a1-m1-l1', 5, 7)])
    expect(upsert).toHaveBeenCalledWith([{ user_id: 'u1', lesson_id: 'a1-m1-l1', score: 5, total: 7, completed_at: T1 }], { onConflict: 'user_id,lesson_id' })
    upsert.mockClear()
    await pushRemoteResults(client, 'u1', [])
    expect(upsert).not.toHaveBeenCalled()
  })
})
