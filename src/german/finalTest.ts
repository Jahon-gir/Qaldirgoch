import { LESSONS, TEST_IDS, moduleById, testResultId, type Direction } from '../content/german'
import { GAPS, type GapItem } from '../content/german/gaps'
import { VOCAB, type VocabWord } from '../content/german/words'
import { DE_COURSE } from '../lang/de'
import type { Course } from '../lang/types'
import { hasArticle, type ExerciseKind } from './exercises'
import { lessonsOf, visibleModules, type Results } from './logic'

/**
 * Modul va daraja yakuniy testi (sof funksiyalar).
 * Modul: 8 soʻz savoli + 4 gap (3 tanlash, oxirgisi yozish) = 12. Daraja: 16 + 4 = 20.
 * Har savolga BIR MARTA javob. Oʻtish: toʻgʻri / jami ≥ 11/12 (qisqa testda ham shu nisbat, yuqoriga yaxlitlab).
 * Natija user_lessons da "test:<scope>" id bilan saqlanadi (yangi jadval yoʻq).
 */

export type Scope = string // modul id (masalan "a1-m1") yoki "level-A1" (boshqa kurs: "ko-t1-m1", "level-ko-T1")
export type Question = { kind: 'word'; method: ExerciseKind; wordId: string } | { kind: 'gap'; mode: 'choice' | 'write'; gapId: string }

export const LEVEL_PREFIX = 'level-'
/** lv — daraja id'si (nemischa "A1"; boshqa kurslar "ko-T1"). */
export const levelScope = (lv: string) => `${LEVEL_PREFIX}${lv}`
export const testId = (scope: Scope) => testResultId(scope)
export const isTestId = (id: string) => TEST_IDS.has(id)

export const PASS_RATIO = 11 / 12
export const passMark = (total: number) => Math.ceil(total * PASS_RATIO - 1e-9)
export const isPassed = (score: number, total: number) => total > 0 && score >= passMark(total)

/** Soʻz savollari usullari (8 ta uchun): test 2, tinglash 2, yigʻish 1, yozish 2, artikl 1. */
const PATTERN: ExerciseKind[] = ['test', 'test', 'listen', 'listen', 'build', 'write', 'write', 'article']

/* ---------- Seeded tasodif ---------- */

export function seeded(seed: string | number): () => number {
  let h = 2166136261
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ---------- Doira (scope) ---------- */

export type ScopeInfo = { scope: Scope; type: 'module' | 'level'; level: string; moduleIds: string[]; wordCount: number; gapCount: number }

/** Doiradagi modullar: modul — oʻzi; daraja — shu darajadagi koʻrinadigan modullar (soni kontentdan). */
export function scopeInfo(scope: Scope, direction: Direction): ScopeInfo | null {
  if (scope.startsWith(LEVEL_PREFIX)) {
    const level = scope.slice(LEVEL_PREFIX.length)
    const mods = visibleModules(direction).filter((m) => m.level === level)
    if (!mods.length) return null
    return { scope, type: 'level', level, moduleIds: mods.map((m) => m.id), wordCount: 16, gapCount: 4 }
  }
  const m = moduleById(scope)
  if (!m) return null
  return { scope, type: 'module', level: m.level, moduleIds: [m.id], wordCount: 8, gapCount: 4 }
}

const wordsOf = (moduleIds: string[], vocab: readonly VocabWord[] = VOCAB) => vocab.filter((w) => moduleIds.includes(w.moduleId))
const gapsOf = (moduleIds: string[], gaps: readonly GapItem[] = GAPS) => gaps.filter((g) => moduleIds.includes(g.moduleId))

/** Savollar soni (kartochka uchun): soʻz va gap yetmasa — qisqaroq. */
export function testSize(info: ScopeInfo, vocab: readonly VocabWord[] = VOCAB, gaps: readonly GapItem[] = GAPS) {
  return Math.min(info.wordCount, wordsOf(info.moduleIds, vocab).length) + Math.min(info.gapCount, gapsOf(info.moduleIds, gaps).length)
}

/** Ochilganmi: modul — barcha darslari tugagan; daraja — barcha koʻrinadigan modullarning barcha darslari (darsi yoʻq modul — tugamagan). */
export function isScopeUnlocked(info: ScopeInfo, results: Results): boolean {
  return info.moduleIds.every((id) => {
    const ls = lessonsOf(id, LESSONS)
    return ls.length > 0 && ls.every((l) => l.id in results)
  })
}

/* ---------- Usullar ketma-ketligi ---------- */

/**
 * Usullar sanogʻi n ta soʻz uchun; ovoz yoʻq — tinglash Test; ot yetmasa — artikl Test; kursda yozish yoʻq (write = false) — yozish yigʻishga;
 * Test juda koʻp boʻlsa — yigʻishga (yozish boʻlsa navbat bilan yozishga ham).
 */
export function methodCounts(n: number, canListen: boolean, nouns: number, write = true): Map<ExerciseKind, number> {
  const list: ExerciseKind[] = Array.from({ length: n }, (_, i) => PATTERN[i % PATTERN.length])
  const c = new Map<ExerciseKind, number>()
  let art = 0
  for (const k of list) {
    let m = k
    if (m === 'listen' && !canListen) m = 'test'
    if (m === 'article' && ++art > nouns) m = 'test'
    if (m === 'write' && !write) m = 'build'
    c.set(m, (c.get(m) ?? 0) + 1)
  }
  // Ketma-ket bir xil usul boʻlmasligi uchun birorta usul yarmidan oshmasin
  const cap = Math.ceil(n / 2)
  const swap: ExerciseKind[] = write ? ['build', 'write'] : ['build']
  let i = 0
  while ((c.get('test') ?? 0) > cap) {
    c.set('test', c.get('test')! - 1)
    const to = swap[i++ % swap.length]
    c.set(to, (c.get(to) ?? 0) + 1)
  }
  return c
}

/** Ketma-ket bir xil usul yoʻq: har qadamda eng koʻp qolgan (oldingisidan boshqa) usul; tenglikda tasodif. */
export function arrange(counts: Map<ExerciseKind, number>, rand: () => number): ExerciseKind[] {
  const left = new Map(counts)
  const total = [...left.values()].reduce((a, b) => a + b, 0)
  const out: ExerciseKind[] = []
  for (let i = 0; i < total; i++) {
    const prev = out[out.length - 1]
    const opts = shuffle([...left.entries()].filter(([k, v]) => v > 0 && k !== prev), rand).sort((a, b) => b[1] - a[1])
    const pick = (opts[0] ?? [...left.entries()].find(([, v]) => v > 0)!)[0]
    out.push(pick)
    left.set(pick, left.get(pick)! - 1)
  }
  return out
}

/** Test savollari: soʻzlar aralash (usullar ketma-ket takrorlanmaydi), keyin gap-tanlash, eng oxirida gap-yozish. */
export function buildTest(info: ScopeInfo, opts: { canListen: boolean; seed: string | number; vocab?: readonly VocabWord[]; gaps?: readonly GapItem[]; course?: Pick<Course, 'features'> }): Question[] {
  const course = opts.course ?? DE_COURSE
  const rand = seeded(opts.seed)
  const words = shuffle(wordsOf(info.moduleIds, opts.vocab), rand).slice(0, info.wordCount)
  const nouns = words.filter((w) => hasArticle(w, course))
  const methods = arrange(methodCounts(words.length, opts.canListen, nouns.length, course.features.write), rand)
  // Artikl — faqat ot soʻzga; qolganlari tasodifiy
  const nounPool = [...nouns]
  const restPool = words.filter((w) => !nounPool.includes(w))
  const used = new Set<string>()
  const wordQs: Question[] = methods.map((method) => {
    let w: VocabWord | undefined
    if (method === 'article') w = nounPool.find((x) => !used.has(x.id))
    else w = restPool.find((x) => !used.has(x.id)) ?? nounPool.find((x) => !used.has(x.id))
    used.add(w!.id)
    return { kind: 'word', method, wordId: w!.id }
  })
  // Artikl uchun otlar ishlatilgan boʻlsa (otga boshqa usul tushgan) — tartib saqlanadi, chunki otlar soni artikl sonidan kam emas
  const gaps = shuffle(gapsOf(info.moduleIds, opts.gaps), rand).slice(0, info.gapCount)
  const gapQs: Question[] = gaps.map((g, i) => ({ kind: 'gap', mode: i === gaps.length - 1 ? 'write' : 'choice', gapId: g.id }))
  return [...wordQs, ...gapQs]
}

/** Natija kartasi qatori: ism · sana · ball. Ism boʻlmasa (mehmon) — ism qismi umuman yoʻq. Ism oldindan tozalangan boʻlishi kerak. */
export const resultLine = (name: string | undefined, date: string, score: number, total: number) => [name, date, `${score}/${total}`].filter(Boolean).join(' · ')
