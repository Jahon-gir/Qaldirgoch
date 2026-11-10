import { describe, expect, it } from 'vitest'
import { l3 } from '../content/german/helpers'
import type { Exercise, Lesson, Module, WordExercise } from '../content/german/types'
import { check, normalizeKo } from '../german/answer'
import { kindsFor, reviewKind, reviewKinds } from '../german/exercises'
import { buildTest, methodCounts, scopeInfo } from '../german/finalTest'
import { sanitizeResults } from '../german/logic'
import { sanitizeWords } from '../german/srs'
import { normalizeVocabFront, PROFILE_SCHEMA_VERSION, type Profile } from '../profile/questions'
import { normalizeProfile } from '../profile/sync'
import { DE_COURSE } from './de'
import { ALL_RESULT_IDS, ALL_WORD_IDS, COURSES, courseIdOfLesson, courseIdOfWord, courseOf, resultIdsOf, unionResultIds, unionWordIds, wordIdsOf } from './registry'
import type { Course } from './types'
import { buildVocab, slugErrors, wordId } from './words'
import { makeCourse } from './course'

const DE_WORD_IDS = [
  'a1-m1-hallo',
  'a1-m1-guten-morgen',
  'a1-m1-guten-tag',
  'a1-m1-guten-abend',
  'a1-m1-tschuess',
  'a1-m1-auf-wiedersehen',
  'a1-m1-bis-morgen',
  'a1-m1-gute-nacht',
  'a1-m1-ich-heisse',
  'a1-m1-ich-bin',
  'a1-m1-du-heisst',
  'a1-m1-sie-heissen',
  'a1-m1-der-elektriker',
  'a1-m1-der-mechaniker',
  'a1-m1-der-schweisser',
  'a1-m1-die-pflegekraft',
  'a1-m1-der-koch',
  'a1-m1-wie-heissen-sie',
  'a1-m1-woher-kommen-sie',
  'a1-m1-ich-komme-aus-usbekistan',
  'a1-m1-wie-geht-es-ihnen',
  'a1-m1-mir-geht-es-gut-danke'
]

/* ---------- Soxta koreys kursi: FAQAT testda (reyestrga qoʻshilmaydi) ---------- */

const koWord = (id: string, term: string, slug?: string): WordExercise => ({ type: 'word', id, term, slug, tr: l3('Salom', 'Салом', 'Привет'), pron: l3('an-nyon', 'ан-нён', 'ан-нён'), icon: 'hand-stop', example: { term, tr: l3('Salom', 'Салом', 'Привет') } })
const KO_MODULES: Module[] = [{ id: 'ko-t1-m1', level: 'ko-T1', direction: 'general', order: 1, status: 'draft', title: l3('Salom', 'Салом', 'Привет') }]
const KO_LESSONS: Lesson[] = [{ id: 'ko-t1-m1-l1', moduleId: 'ko-t1-m1', title: l3('Salom', 'Салом', 'Привет'), kind: 'words', minutes: 5, order: 1 }]
const KO_EX: Record<string, Exercise[]> = { 'ko-t1-m1-l1': [koWord('ko-t1-m1-l1-e1', '안녕하세요', 'annyeonghaseyo'), koWord('ko-t1-m1-l1-e2', '감사합니다', 'gamsahamnida')] }
const koSource = { lessons: KO_LESSONS, exercisesOf: (id: string) => KO_EX[id] ?? [] }
const KO_FAKE: Course = makeCourse({
  id: 'ko',
  flag: 'kr',
  speechLang: 'ko-KR',
  levels: [{ id: 'ko-T1', locked: false }],
  modules: KO_MODULES,
  lessons: KO_LESSONS,
  exercisesOf: koSource.exercisesOf,
  vocab: buildVocab(koSource),
  gaps: [],
  features: { article: false, write: false, build: 'syllables', pron: true },
  normalize: normalizeKo,
  letterLocale: 'ko'
})

describe("nemis kursi: id'lar oʻzgarmagan", () => {
  it("22 ta soʻz id'si aynan avvalgidek (bittasi oʻzgarsa progress yoʻqoladi)", () => {
    expect(courseOf('de').vocab.map((w) => w.id)).toEqual(DE_WORD_IDS)
    expect([...ALL_WORD_IDS].filter((id) => courseIdOfWord(id) === 'de')).toEqual(DE_WORD_IDS)
  })
  it("dars va test id'lari prefikssiz", () => {
    expect(resultIdsOf(DE_COURSE)).toEqual([
      'a1-m1-l1', 'a1-m1-l2', 'a1-m1-l3', 'a1-m1-l4', 'a1-m1-l5', 'a1-m1-l6',
      'test:a1-m1', 'test:a1-m2', 'test:a1-m3',
      'test:level-A1', 'test:level-A2', 'test:level-B1'
    ])
    expect([...ALL_RESULT_IDS].filter((id) => courseIdOfLesson(id) === 'de').sort()).toEqual(resultIdsOf(DE_COURSE).sort())
  })
  it('nemis kontentida slug xatosi yoʻq', () => {
    expect(slugErrors(DE_COURSE)).toEqual([])
  })
  it('kurs xususiyatlari va ovoz tili', () => {
    expect(DE_COURSE.features).toEqual({ article: true, write: true, build: 'letters', pron: false })
    expect(DE_COURSE.speechLang).toBe('de-DE')
    expect(DE_COURSE.levels).toEqual([{ id: 'A1', locked: false }, { id: 'A2', locked: false }, { id: 'B1', locked: true }])
  })
})

describe('reyestr', () => {
  it('reyestrda de va ko', () => {
    expect(COURSES.map((c) => c.id)).toEqual(['de', 'ko'])
    expect(courseOf('de')).toBe(DE_COURSE)
    expect(courseOf('ko').id).toBe('ko')
  })
  it('kurs prefiksi boʻyicha aniqlanadi', () => {
    expect(courseIdOfLesson('a1-m1-l1')).toBe('de')
    expect(courseIdOfLesson('test:level-A1')).toBe('de')
    expect(courseIdOfLesson('ko-h-m1-l1')).toBe('ko')
    expect(courseIdOfLesson('test:ko-t1-m1')).toBe('ko')
    expect(courseIdOfLesson('test:level-ko-T1')).toBe('ko')
    expect(courseIdOfWord('a1-m1-hallo')).toBe('de')
    expect(courseIdOfWord('ko-t1-m1-annyeonghaseyo')).toBe('ko')
  })
  it("id'lar kurslar orasida takrorlanmaydi; prefikssiz id faqat de da", () => {
    for (const set of [[...COURSES], [DE_COURSE, KO_FAKE]]) {
      const results = set.flatMap(resultIdsOf)
      const words = set.flatMap(wordIdsOf)
      expect(new Set(results).size).toBe(results.length)
      expect(new Set(words).size).toBe(words.length)
      for (const c of set) {
        for (const id of resultIdsOf(c)) expect(courseIdOfLesson(id), id).toBe(c.id)
        for (const id of wordIdsOf(c)) expect(courseIdOfWord(id), id).toBe(c.id)
        if (c.id !== 'de') {
          for (const id of resultIdsOf(c)) expect(id.replace(/^test:(level-)?/, ''), id).toMatch(new RegExp(`^${c.id}-`))
          for (const id of wordIdsOf(c)) expect(id).toMatch(new RegExp(`^${c.id}-`))
        }
      }
    }
  })
})

describe('wordId va slug', () => {
  it('Hangul slugsiz — boʻsh slug, kontent tekshiruvi xato beradi', () => {
    const bad = { lessons: KO_LESSONS, exercisesOf: () => [koWord('ko-t1-m1-l1-e1', '안녕하세요')] }
    expect(wordId('ko-t1-m1', '안녕하세요')).toBe('ko-t1-m1-')
    expect(slugErrors(bad)).toHaveLength(1)
    expect(slugErrors(bad)[0]).toContain('ko-t1-m1-l1-e1')
  })
  it('slug bilan — barqaror id', () => {
    expect(wordId('ko-t1-m1', '안녕하세요', 'annyeonghaseyo')).toBe('ko-t1-m1-annyeonghaseyo')
    expect(slugErrors(koSource)).toEqual([])
    expect(KO_FAKE.vocab.map((w) => w.id)).toEqual(['ko-t1-m1-annyeonghaseyo', 'ko-t1-m1-gamsahamnida'])
    expect(KO_FAKE.vocab[0].term).toBe('안녕하세요')
  })
  it('nemischa: slug berilmasa — term dan (avvalgidek)', () => {
    expect(wordId('a1-m1', 'Tschüss')).toBe('a1-m1-tschuess')
  })
})

describe('sanitize: kurslar birlashmasi', () => {
  const r = (lessonId: string) => ({ lessonId, score: 1, total: 1, completedAt: '2026-11-01T00:00:00.000Z' })
  const w = { due: '2026-11-02', interval: 1, mistakes: 0, updatedAt: '2026-11-01T00:00:00.000Z' }
  it('natijalar: nemis ham, koreys ham saqlanadi; notanish id tashlanadi', () => {
    const known = unionResultIds([DE_COURSE, KO_FAKE])
    const raw = { 'a1-m1-l1': r('a1-m1-l1'), 'test:level-A1': r('test:level-A1'), 'ko-t1-m1-l1': r('ko-t1-m1-l1'), 'test:level-ko-T1': r('test:level-ko-T1'), 'ko-x-l9': r('ko-x-l9'), 'b2-m1-l1': r('b2-m1-l1') }
    expect(Object.keys(sanitizeResults(raw, known)).sort()).toEqual(['a1-m1-l1', 'ko-t1-m1-l1', 'test:level-A1', 'test:level-ko-T1'])
    // Standart (reyestr): haqiqiy koreys kursida ko-t1-m1-l1 darsi hali yoʻq, daraja testi id'si bor
    expect(Object.keys(sanitizeResults(raw)).sort()).toEqual(['a1-m1-l1', 'test:level-A1', 'test:level-ko-T1'])
  })
  it('soʻzlar: nemis ham, koreys ham saqlanadi; notanish id tashlanadi', () => {
    const known = unionWordIds([DE_COURSE, KO_FAKE])
    const raw = { 'a1-m1-hallo': w, 'ko-t1-m1-annyeonghaseyo': w, 'ko-t1-m1-yoq': w, 'a1-m9-x': w }
    expect(Object.keys(sanitizeWords(raw, known)).sort()).toEqual(['a1-m1-hallo', 'ko-t1-m1-annyeonghaseyo'])
  })
})

describe('koreyscha javob tekshiruvi', () => {
  it('normalizeKo: umumiy qism, Hangul NFC', () => {
    expect(normalizeKo('  안녕하세요!  ')).toBe('안녕하세요')
    expect(normalizeKo('안녕하세요'.normalize('NFD'))).toBe('안녕하세요')
  })
  it('exact, almost (jamo boʻyicha 1 harf), qisqa soʻzda wrong', () => {
    expect(check('안녕하세요', '안녕하세요', 'ko')).toBe('exact')
    expect(check('안녕하세요.', '안녕하세요', 'ko')).toBe('correct')
    expect(check('안녕하세오', '안녕하세요', 'ko')).toBe('almost') // 요 → 오: bitta unli (ᅭ → ᅩ)
    expect(check('안넝', '안녕', 'ko')).toBe('wrong') // qisqa (5 harfdan kam)
    expect(check('감사합니다', '안녕하세요', 'ko')).toBe('wrong')
  })
  it('nemischa natijalar oʻzgarmagan', () => {
    expect(check('Tschuess', 'Tschüss')).toBe('correct')
    expect(check('Tschuess', 'Tschüss', 'de')).toBe('correct')
    expect(check('Elektrikar', 'Elektriker')).toBe('almost')
  })
})

describe('features.write = false', () => {
  const words = KO_FAKE.vocab
  it('kindsFor (Aralash) va reviewKind (takrorlash) yozish bermaydi', () => {
    for (const word of words) {
      expect(kindsFor(word, true, KO_FAKE)).not.toContain('write')
      expect(kindsFor(word, true, KO_FAKE)).not.toContain('article')
      for (const iv of [1, 3, 7, 14, 30]) for (const n of [0, 1]) expect(reviewKind(iv, word, true, n, KO_FAKE)).not.toBe('write')
    }
    expect(reviewKind(14, words[0], true, 0, KO_FAKE)).toBe('build')
    expect(reviewKinds(words.map((w) => w.id), () => 30, (id) => words.find((w) => w.id === id), true, KO_FAKE)).toEqual(['build', 'build'])
  })
  it('methodCounts yozish bermaydi (soni oʻzgarmaydi)', () => {
    for (let n = 1; n <= 16; n++) {
      for (const canListen of [true, false]) {
        const c = methodCounts(n, canListen, 0, false)
        expect(c.get('write') ?? 0).toBe(0)
        expect([...c.values()].reduce((a, b) => a + b, 0)).toBe(n)
      }
    }
  })
  it('nemis uchun standart — avvalgidek yozish bor', () => {
    expect(methodCounts(8, true, 1).get('write')).toBe(2)
    expect(methodCounts(8, true, 1, true)).toEqual(methodCounts(8, true, 1))
  })
  it('buildTest: kurs berilsa yozish va artikl savoli yoʻq', () => {
    const info = scopeInfo('a1-m1', 'general')!
    const qs = buildTest(info, { canListen: true, seed: 1, course: KO_FAKE })
    expect(qs.some((q) => q.kind === 'word' && (q.method === 'write' || q.method === 'article'))).toBe(false)
  })
})

describe('profil', () => {
  const base: Profile = { ageRange: '18-24', education: 'school', profession: 'electrician', germanLevel: 'none', dailyTime: '30', departure: '1y', createdAt: '2026-01-01T00:00:00.000Z', schemaVersion: PROFILE_SCHEMA_VERSION }
  it("vocabFront: eski 'de' → 'target'; notanish → undefined", () => {
    expect(normalizeVocabFront('de')).toBe('target')
    expect(normalizeVocabFront('target')).toBe('target')
    expect(normalizeVocabFront('tr')).toBe('tr')
    expect(normalizeVocabFront('ko')).toBeUndefined()
    expect(normalizeProfile({ ...base, vocabFront: 'de' })?.vocabFront).toBe('target')
    expect(normalizeProfile({ ...base, vocabFront: 'tr' })?.vocabFront).toBe('tr')
  })
  it('activeCourse: maʼlum qiymat saqlanadi, notanish → undefined', () => {
    expect(normalizeProfile({ ...base, activeCourse: 'ko' })?.activeCourse).toBe('ko')
    expect(normalizeProfile({ ...base, activeCourse: 'de' })?.activeCourse).toBe('de')
    expect(normalizeProfile({ ...base, activeCourse: 'fr' })?.activeCourse).toBeUndefined()
    expect(normalizeProfile(base)?.activeCourse).toBeUndefined()
  })
})
