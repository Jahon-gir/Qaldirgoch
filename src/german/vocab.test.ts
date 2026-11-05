import { describe, expect, it } from 'vitest'
import { VOCAB, wordIdsOfLesson, type VocabWord } from '../content/german/words'
import { l3 } from '../content/german/helpers'
import type { Results } from './logic'
import { sessionDone } from './srs'
import { MIXED, pickVocabOptions, startVocabSession, unlockedWords, vocabAnswer, vocabGroups, vocabSummary } from './vocab'

const R = (...ids: string[]): Results => Object.fromEntries(ids.map((id) => [id, { lessonId: id, score: 1, total: 1, completedAt: '2026-11-01T00:00:00.000Z' }]))
const w = (id: string, lessonId: string, moduleId: string, de: string, uz: string): VocabWord => ({ id, lessonId, moduleId, exerciseId: id, de, tr: l3(uz, uz, uz) })

describe('lugʻat ekrani: guruhlar va qulf', () => {
  it('faqat word mashqi bor darslar; modul testi chiqmaydi', () => {
    const lessons = vocabGroups('general', {}).flatMap((g) => g.lessons.map((l) => l.lesson.id))
    expect(lessons).toEqual(['a1-m1-l1', 'a1-m1-l2', 'a1-m1-l3', 'a1-m1-l4', 'a1-m1-l5'])
    expect(lessons).not.toContain('a1-m1-l6')
  })

  it('dars faqat user_lessons da boʻlsa ochiq; hech biri tugamagan boʻlsa ochiq soʻz yoʻq', () => {
    expect(vocabGroups('general', {}).every((g) => g.lessons.every((l) => !l.unlocked))).toBe(true)
    expect(unlockedWords(vocabGroups('general', {}))).toEqual([])
    const g = vocabGroups('general', R('a1-m1-l2'))[0]
    expect(g.lessons.map((l) => l.unlocked)).toEqual([false, true, false, false, false])
    expect(unlockedWords([g]).map((x) => x.id)).toEqual(wordIdsOfLesson('a1-m1-l2'))
  })

  it('darsning BARCHA soʻzlari (holatidan qatʼi nazar) va ochilganlar yigʻindisi', () => {
    const groups = vocabGroups('general', R('a1-m1-l1', 'a1-m1-l2'))
    expect(groups[0].lessons[0].words.map((x) => x.id)).toEqual(wordIdsOfLesson('a1-m1-l1'))
    expect(unlockedWords(groups)).toHaveLength(wordIdsOfLesson('a1-m1-l1').length + wordIdsOfLesson('a1-m1-l2').length)
  })

  it('aralash mashq identifikatori darslar bilan toʻqnashmaydi', () => {
    expect(vocabGroups('general', {}).some((g) => g.lessons.some((l) => l.lesson.id === MIXED))).toBe(false)
  })
})

describe('test variantlari', () => {
  const word = w('a', 'l1', 'm1', 'Hallo', 'Salom')
  const vocab = [
    word,
    w('b', 'l1', 'm1', 'Tag', 'Kun'),
    w('c', 'l1', 'm1', 'Abend', 'Kech'),
    w('d', 'l2', 'm1', 'Nacht', 'Tun'),
    w('e', 'l2', 'm1', 'Morgen', 'Tong'),
    w('f', 'l3', 'm2', 'Koch', 'Oshpaz')
  ]
  const ids = (o: ReturnType<typeof pickVocabOptions>) => o.filter((x) => !x.correct).map((x) => x.id).sort()

  it('4 variant: 1 toʻgʻri + 3 notoʻgʻri; avval shu darsdan', () => {
    const o = pickVocabOptions(word, 'de', 'uz', Math.random, vocab)
    expect(o).toHaveLength(4)
    expect(o.filter((x) => x.correct)).toHaveLength(1)
    expect(o.find((x) => x.correct)).toMatchObject({ id: 'a', text: 'Salom' })
    // darsda 2 ta boshqa soʻz bor (b, c) — ikkalasi albatta chiqadi, 3-si shu moduldan (d yoki e), boshqa moduldan emas
    expect(ids(o).filter((x) => x === 'b' || x === 'c')).toEqual(['b', 'c'])
    expect(ids(o)).not.toContain('f')
  })

  it('shu darsdan yetsa — faqat shu darsdan', () => {
    const big = [...vocab, w('g', 'l1', 'm1', 'Nachmittag', 'Tushdan keyin')]
    for (let i = 0; i < 20; i++) expect(ids(pickVocabOptions(word, 'de', 'uz', Math.random, big)).every((x) => ['b', 'c', 'g'].includes(x))).toBe(true)
  })

  it('moduldan ham yetmasa — boshqa modullardan; matni bir xil variantlar olinmaydi', () => {
    const few = [word, w('b', 'l1', 'm1', 'Tag', 'Kun'), w('f', 'l3', 'm2', 'Koch', 'Oshpaz'), w('g', 'l3', 'm2', 'Arzt', 'Oshpaz'), w('h', 'l3', 'm2', 'Arzt2', 'Shifokor')]
    const o = pickVocabOptions(word, 'de', 'uz', Math.random, few)
    expect(o).toHaveLength(4)
    expect(new Set(o.map((x) => x.text)).size).toBe(4)
  })

  it('old tomoni oʻzbekcha boʻlsa variantlar nemischa', () => {
    const o = pickVocabOptions(word, 'tr', 'uz', Math.random, vocab)
    expect(o.find((x) => x.correct)!.text).toBe('Hallo')
    expect(o.every((x) => /^[A-Z]/.test(x.text))).toBe(true)
  })

  it('tartib aralash (rand bilan boshqarilsa oʻzgaradi), haqiqiy lugʻatda ham 4 ta', () => {
    const first = VOCAB[0]
    expect(pickVocabOptions(first, 'de', 'ru')).toHaveLength(4)
    const pos = new Set<number>()
    for (let i = 0; i < 60; i++) pos.add(pickVocabOptions(first, 'de', 'uz').findIndex((x) => x.correct))
    expect(pos.size).toBeGreaterThan(1)
  })
})

describe('lugʻat sessiyasi', () => {
  it('"Bilmadim" soʻzi oxirida FAQAT BIR MARTA qaytadi', () => {
    let s = startVocabSession(['a', 'b'])
    s = vocabAnswer(s, false) // a xato → oxiriga
    expect(s.queue).toEqual(['a', 'b', 'a'])
    s = vocabAnswer(s, true) // b
    s = vocabAnswer(s, false) // a yana xato — endi qaytmaydi
    expect(s.queue).toEqual(['a', 'b', 'a'])
    expect(sessionDone(s)).toBe(true)
  })

  it('natija birinchi urinish boʻyicha; qayta toʻgʻri javob bilmaganlardan chiqarmaydi', () => {
    let s = startVocabSession(['a', 'b', 'c'])
    s = vocabAnswer(s, false)
    s = vocabAnswer(s, true)
    s = vocabAnswer(s, true)
    s = vocabAnswer(s, true) // a ikkinchi urinishda toʻgʻri
    expect(vocabSummary(s)).toEqual({ total: 3, known: 2, wrongIds: ['a'] })
  })

  it('hammasi toʻgʻri: qayta soʻralmaydi', () => {
    let s = startVocabSession(['a', 'b'])
    s = vocabAnswer(s, true)
    s = vocabAnswer(s, true)
    expect(sessionDone(s)).toBe(true)
    expect(vocabSummary(s).wrongIds).toEqual([])
  })
})
