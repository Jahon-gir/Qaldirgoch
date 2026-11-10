import { afterEach, describe, expect, it, vi } from 'vitest'
import { VOCAB, type VocabWord } from '../content/german/words'
import { l3 } from '../content/german/helpers'
import {
  addDays,
  addNewWords,
  answerWord,
  daysBetween,
  dueWordIds,
  isFirstAttempt,
  localDay,
  newWordState,
  nextDueDay,
  nextInterval,
  pickOptions,
  sessionAnswer,
  sessionCurrent,
  sessionDone,
  sessionSummary,
  startSession,
  statusCounts,
  wordStatus,
  type WordState
} from './srs'

const NOW = '2026-11-05T10:00:00.000Z'
const TODAY = '2026-11-05'

/** Takroriy natija uchun oddiy psevdo-tasodif. */
function seq(seed = 1) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

describe('mahalliy kun va vaqt zonasi', () => {
  // vi.stubEnv process.env.TZ ni oʻzgartiradi — Node vaqt zonasini darhol qayta oʻqiydi
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('Toshkentda tun yarmidan keyin — yangi kun (UTC hali kecha)', () => {
    vi.stubEnv('TZ', 'Asia/Tashkent')
    const d = new Date('2026-11-05T19:30:00.000Z') // Toshkent: 6-noyabr 00:30
    expect(d.toISOString().slice(0, 10)).toBe('2026-11-05') // UTC boʻyicha hisoblash xato boʻlardi
    expect(localDay(d)).toBe('2026-11-06')
  })

  it('UTC dan orqadagi zonada kechqurun — hali shu kun (UTC ertangi kunga oʻtgan)', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles')
    expect(localDay(new Date('2026-11-06T05:00:00.000Z'))).toBe('2026-11-05')
  })

  it('yozgi vaqtga oʻtish kuni addDays kunni surib yubormaydi', () => {
    vi.stubEnv('TZ', 'Europe/Berlin')
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30')
    expect(addDays('2026-10-24', 7)).toBe('2026-10-31')
  })

  it('oy va yil chegarasi, manfiy qadam, kunlar farqi', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(daysBetween('2026-11-05', '2026-12-05')).toBe(30)
  })
})

describe('oraliqlar: 1, 3, 7, 14, 30', () => {
  it('yangi soʻz ertasiga keladi', () => {
    expect(newWordState(TODAY, NOW)).toEqual({ due: '2026-11-06', interval: 1, mistakes: 0, updatedAt: NOW })
  })

  it('toʻgʻri javob — keyingi oraliq; 30 dan keyin ham 30', () => {
    expect([1, 3, 7, 14, 30].map(nextInterval)).toEqual([3, 7, 14, 30, 30])
    let s: WordState = newWordState(TODAY, NOW)
    const seen: number[] = []
    for (let i = 0; i < 6; i++) {
      s = answerWord(s, true, TODAY, NOW)
      seen.push(s.interval)
      expect(s.due).toBe(addDays(TODAY, s.interval))
    }
    expect(seen).toEqual([3, 7, 14, 30, 30, 30])
    expect(s.mistakes).toBe(0)
  })

  it('xato javob — 1-oraliqqa qaytadi, xatolar +1, ertaga keladi', () => {
    const s: WordState = { due: TODAY, interval: 14, mistakes: 2, updatedAt: NOW }
    expect(answerWord(s, false, TODAY, NOW)).toEqual({ due: '2026-11-06', interval: 1, mistakes: 3, updatedAt: NOW })
  })
})

describe('holatlar', () => {
  it('Yangi / Oʻrganilmoqda / Mustahkam', () => {
    const fresh = newWordState(TODAY, NOW)
    expect(wordStatus(fresh)).toBe('new')
    expect(wordStatus(answerWord(fresh, true, TODAY, NOW))).toBe('learning') // 3 kun
    expect(wordStatus(answerWord(fresh, false, TODAY, NOW))).toBe('learning') // xatodan keyin — yangi emas
    expect(wordStatus({ ...fresh, interval: 7 })).toBe('learning')
    expect(wordStatus({ ...fresh, interval: 14 })).toBe('strong')
    expect(wordStatus({ ...fresh, interval: 30 })).toBe('strong')
  })

  it('statusCounts', () => {
    const w = { a: newWordState(TODAY, NOW), b: { ...newWordState(TODAY, NOW), interval: 3 }, c: { ...newWordState(TODAY, NOW), interval: 30 } }
    expect(statusCounts(w)).toEqual({ new: 1, learning: 1, strong: 1, total: 3 })
  })
})

describe('qutiga qoʻshish va bugungi soʻzlar', () => {
  it('bor soʻzga tegilmaydi, nomaʼlumi olinmaydi', () => {
    const old: WordState = { due: '2026-12-01', interval: 30, mistakes: 1, updatedAt: NOW }
    const next = addNewWords({ x: old }, ['x', 'y', 'zzz'], TODAY, NOW, new Set(['x', 'y']))
    expect(next.x).toBe(old)
    expect(next.y.due).toBe('2026-11-06')
    expect(next.zzz).toBeUndefined()
    const same = { x: old }
    expect(addNewWords(same, ['x'], TODAY, NOW)).toBe(same) // oʻzgarmasa — oʻsha obyekt
  })

  it('bugun va oʻtib ketganlar keladi (eski avval), ertangisi kelmaydi', () => {
    const w = {
      b: { due: '2026-11-05', interval: 1, mistakes: 0, updatedAt: NOW },
      a: { due: '2026-11-01', interval: 3, mistakes: 0, updatedAt: NOW },
      c: { due: '2026-11-06', interval: 1, mistakes: 0, updatedAt: NOW },
      d: { due: '2026-11-09', interval: 7, mistakes: 0, updatedAt: NOW }
    }
    expect(dueWordIds(w, TODAY)).toEqual(['a', 'b'])
    expect(nextDueDay(w, TODAY)).toBe('2026-11-06')
    expect(nextDueDay({}, TODAY)).toBeNull()
  })
})

describe('variant tanlash', () => {
  const w = (id: string, moduleId: string, uz: string): VocabWord => ({ id, moduleId, lessonId: `${moduleId}-l1`, exerciseId: id, term: id, tr: l3(uz, uz, uz) })

  it('4 ta: 1 toʻgʻri + 3 notoʻgʻri, takror yoʻq, toʻgʻrisi bitta', () => {
    for (let seed = 1; seed < 30; seed++) {
      const word = VOCAB[seed % VOCAB.length]
      const opts = pickOptions(word, VOCAB, 'uz', seq(seed))
      expect(opts).toHaveLength(4)
      expect(opts.filter((o) => o.correct)).toEqual([{ id: word.id, text: word.tr.uz, correct: true }])
      expect(new Set(opts.map((o) => o.text)).size).toBe(4)
    }
  })

  it('imkon boʻlsa shu moduldan, yetmasa boshqa moduldan', () => {
    const pool = [w('a', 'm1', 'A'), w('b', 'm1', 'B'), w('c', 'm2', 'C'), w('d', 'm2', 'D'), w('e', 'm2', 'E'), w('f', 'm1', 'F'), w('g', 'm1', 'G')]
    const opts = pickOptions(pool[0], pool, 'uz', seq(3))
    expect(opts.filter((o) => !o.correct).every((o) => ['b', 'f', 'g'].includes(o.id))).toBe(true)
    const small = [w('a', 'm1', 'A'), w('b', 'm1', 'B'), w('c', 'm2', 'C'), w('d', 'm2', 'D')]
    expect(pickOptions(small[0], small, 'uz', seq(3)).map((o) => o.id).sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('tarjimasi bir xil soʻz notoʻgʻri variant boʻlmaydi', () => {
    const pool = [w('a', 'm1', 'Salom'), w('b', 'm1', 'Salom'), w('c', 'm1', 'C'), w('d', 'm1', 'D'), w('e', 'm1', 'E')]
    const opts = pickOptions(pool[0], pool, 'uz', seq(7))
    expect(opts.map((o) => o.id)).not.toContain('b')
    expect(opts).toHaveLength(4)
  })

  it('tartib aralash (toʻgʻrisi doim birinchi emas)', () => {
    const places = new Set<number>()
    for (let seed = 1; seed < 40; seed++) places.add(pickOptions(VOCAB[0], VOCAB, 'ru', seq(seed)).findIndex((o) => o.correct))
    expect(places.size).toBeGreaterThan(2)
  })
})

describe('sessiya', () => {
  it('xato soʻz sessiya oxirida yana soʻraladi; jadval faqat birinchi javobda', () => {
    let s = startSession(['a', 'b', 'c'])
    expect(sessionCurrent(s)).toBe('a')
    s = sessionAnswer(s, true) // a ✓
    expect(isFirstAttempt(s, 'b')).toBe(true)
    s = sessionAnswer(s, false) // b ✗ → oxiriga
    expect(s.queue).toEqual(['a', 'b', 'c', 'b'])
    s = sessionAnswer(s, true) // c ✓
    expect(sessionCurrent(s)).toBe('b')
    expect(isFirstAttempt(s, 'b')).toBe(false)
    s = sessionAnswer(s, false) // b yana ✗ → yana oxiriga
    s = sessionAnswer(s, true) // b ✓
    expect(sessionDone(s)).toBe(true)
    expect(sessionSummary(s)).toEqual({ reviewed: 3, correct: 2, wrongIds: ['b'] })
  })
})
