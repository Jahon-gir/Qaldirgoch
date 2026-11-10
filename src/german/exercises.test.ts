import { describe, expect, it } from 'vitest'
import { l3 } from '../content/german/helpers'
import { VOCAB, wordById, type VocabWord } from '../content/german/words'
import { articleOf, chunksMatch, chunksOf, chunkTiles, isNoun, kindsFor, letterTiles, lettersMatch, lettersPrefixOk, mixedKinds, nextMixedKind, playable, reviewKind, reviewKinds, targetLetters } from './exercises'
import { normalize } from './answer'

const w = (id: string, term: string, moduleId = 'm1'): VocabWord => ({ id, lessonId: 'l1', moduleId, exerciseId: id, term, tr: l3('x', 'x', 'x'), pron: l3('x', 'x', 'x') })
const byDe = (de: string) => VOCAB.find((x) => x.term === de)!

describe('artikl aniqlash', () => {
  it('der / die / das + bosh harf — ot', () => {
    expect(articleOf('der Elektriker')).toEqual({ article: 'der', noun: 'Elektriker' })
    expect(articleOf('die Pflegekraft')).toEqual({ article: 'die', noun: 'Pflegekraft' })
    expect(articleOf('das Auto')).toEqual({ article: 'das', noun: 'Auto' })
    expect(articleOf('der Schweißer')?.noun).toBe('Schweißer')
  })
  it('ot emas: "Danke", artiklsiz, kichik harf bilan davom etsa, artikl yopishgan', () => {
    expect(articleOf('Danke')).toBeNull()
    expect(articleOf('ich bin')).toBeNull()
    expect(articleOf('die sind')).toBeNull()
    expect(articleOf('derElektriker')).toBeNull()
    expect(articleOf('Der Koch')).toBeNull()
    expect(articleOf('Guten Tag')).toBeNull()
  })
  it('darslarda: 1-darsda ot yoʻq, 4-darsda bor', () => {
    expect(VOCAB.filter((x) => x.lessonId === 'a1-m1-l1').some(isNoun)).toBe(false)
    expect(VOCAB.filter((x) => x.lessonId === 'a1-m1-l4').filter(isNoun).map((x) => x.term)).toEqual(['der Elektriker', 'der Mechaniker', 'der Schweißer', 'die Pflegekraft', 'der Koch'])
  })
})

describe('harflardan yigʻish', () => {
  it('tugmalar: target harflari (asl katta-kichik) + 2 ta chalgʻituvchi shu moduldan', () => {
    const word = byDe('Guten Morgen')
    const tiles = letterTiles(word)
    expect(tiles).toHaveLength(targetLetters('Guten Morgen').length + 2)
    const pool = new Set(VOCAB.filter((x) => x.moduleId === word.moduleId && x.id !== word.id).flatMap((x) => targetLetters(x.term)))
    const rest = [...tiles.map((x) => x.text)]
    for (const c of targetLetters('Guten Morgen')) rest.splice(rest.indexOf(c), 1)
    expect(rest).toHaveLength(2)
    expect(rest.every((c) => pool.has(c) && /\p{L}/u.test(c))).toBe(true)
    expect(tiles.map((x) => x.text)).toContain('G')
    expect(tiles.map((x) => x.text)).toContain('M')
    expect(new Set(tiles.map((x) => x.id)).size).toBe(tiles.length)
  })
  it('boshqa modulda soʻz boʻlmasa chalgʻituvchi yoʻq; boʻsh joy kiritilmaydi', () => {
    const a = w('a', 'Ab Cd', 'solo')
    expect(letterTiles(a, Math.random, [a]).map((x) => x.text).sort()).toEqual(['A', 'C', 'b', 'd'])
  })
  it('tekshiruv katta-kichik farqsiz; Yordam uchun boshi mosligi', () => {
    expect(lettersMatch(['h', 'A', 'l', 'l', 'o'], 'Hallo')).toBe(true)
    expect(lettersMatch(['H', 'a', 'l', 'o', 'l'], 'Hallo')).toBe(false)
    expect(lettersMatch(['G', 'u', 't', 'e', 'n', 'T', 'a', 'g'], 'Guten Tag')).toBe(true)
    expect(lettersPrefixOk(['H', 'a'], 'Hallo')).toBe(true)
    expect(lettersPrefixOk(['h'], 'Hallo')).toBe(true)
    expect(lettersPrefixOk(['a'], 'Hallo')).toBe(false)
    expect(lettersPrefixOk([], 'Hallo')).toBe(true)
  })
})

describe('soʻz boʻlaklari (3+ soʻz)', () => {
  it('boʻlaklar boʻsh joy boʻyicha, tinish belgisi soʻzga yopishgan', () => {
    expect(chunksOf('Ich komme aus Usbekistan.')).toEqual(['Ich', 'komme', 'aus', 'Usbekistan.'])
    expect(chunksOf('Mir geht es gut, danke.')).toEqual(['Mir', 'geht', 'es', 'gut,', 'danke.'])
  })
  it('+1 chalgʻituvchi soʻz shu moduldan, targetda yoʻq', () => {
    const word = byDe('Wie heißen Sie?')
    for (let i = 0; i < 20; i++) {
      const tiles = chunkTiles(word)
      expect(tiles).toHaveLength(4)
      const extra = tiles.map((x) => x.text).filter((x) => !chunksOf(word.term).includes(x))
      expect(extra).toHaveLength(1)
      expect(['wie', 'heissen', 'sie']).not.toContain(normalize(extra[0]))
    }
  })
  it('tekshiruv normalize bilan', () => {
    expect(chunksMatch(['Ich', 'komme', 'aus', 'Usbekistan.'], 'Ich komme aus Usbekistan.')).toBe(true)
    expect(chunksMatch(['komme', 'Ich', 'aus', 'Usbekistan.'], 'Ich komme aus Usbekistan.')).toBe(false)
  })
})

describe('aralash', () => {
  it('ketma-ket ikki marta bir xil usul yoʻq', () => {
    for (let r = 0; r < 50; r++) {
      const kinds = mixedKinds(VOCAB, true)
      for (let i = 1; i < kinds.length; i++) expect(kinds[i]).not.toBe(kinds[i - 1])
    }
  })
  it('artikl faqat ot soʻzga, tinglash faqat ovoz boʻlsa', () => {
    const noun = byDe('der Koch')
    const other = byDe('Hallo')
    expect(kindsFor(noun, true)).toEqual(['test', 'build', 'listen', 'write', 'article'])
    expect(kindsFor(other, false)).toEqual(['test', 'build', 'write'])
    for (let r = 0; r < 50; r++) {
      expect(mixedKinds([other, other, other], false).every((k) => k !== 'article' && k !== 'listen')).toBe(true)
    }
    expect(nextMixedKind(other, 'test', false, () => 0)).toBe('build')
    expect(nextMixedKind(other, 'build', false, () => 0.99)).toBe('write')
  })
})

describe('takrorlash: oraliq → usul', () => {
  const short = byDe('Hallo')
  const sentence = byDe('Ich komme aus Usbekistan.')
  it('1 va 3 kun — Test; 7 — yigʻish/tinglash navbat bilan; 14 va 30 — Yozish (gapda — soʻz boʻlaklari)', () => {
    expect(reviewKind(1, short, true)).toBe('test')
    expect(reviewKind(3, short, true)).toBe('test')
    expect(reviewKind(7, short, true, 0)).toBe('build')
    expect(reviewKind(7, short, true, 1)).toBe('listen')
    expect(reviewKind(7, short, false, 1)).toBe('build')
    expect(reviewKind(14, short, true)).toBe('write')
    expect(reviewKind(30, short, true)).toBe('write')
    expect(reviewKind(14, sentence, true)).toBe('build')
    expect(reviewKind(30, sentence, false)).toBe('build')
  })
  it('sessiya boshida: 7 kunliklar navbat bilan; ovoz yoʻq boʻlsa tinglash — Test', () => {
    const iv: Record<string, number> = { 'a1-m1-hallo': 7, 'a1-m1-guten-tag': 7, 'a1-m1-tschuess': 3, 'a1-m1-bis-morgen': 7, 'a1-m1-gute-nacht': 30 }
    const ids = Object.keys(iv)
    expect(reviewKinds(ids, (id) => iv[id], wordById, true)).toEqual(['build', 'listen', 'test', 'build', 'write'])
    expect(reviewKinds(ids, (id) => iv[id], wordById, false)).toEqual(['build', 'build', 'test', 'build', 'write'])
    expect(playable('listen', false)).toBe('test')
    expect(playable('listen', true)).toBe('listen')
  })
})
