import { describe, expect, it } from 'vitest'
import { exercisesOf, LESSONS } from './index'
import { fullSentence, GAPS, GAPS_STATUS, lessonPhrases } from './gaps'
import { WORD_IDS } from './words'

/** Darslardagi barcha nemischa soʻzlar (soʻz, misol, variant, juftlash). */
const LESSON_TOKENS = new Set(
  LESSONS.flatMap((l) =>
    exercisesOf(l.id).flatMap((ex) => {
      const texts = ex.type === 'word' ? [ex.term, ex.example!.term] : ex.type === 'choice' ? [ex.full, ...ex.options.map((o) => o.text)] : ex.pairs.map((p) => p.term)
      return texts.flatMap((s) => s.split(/[^\p{L}]+/u).filter(Boolean))
    })
  )
)

describe('gap toʻldirish kontenti', () => {
  it('10 ta, id takrorlanmaydi, holat — tekshiruvda', () => {
    expect(GAPS).toHaveLength(10)
    expect(new Set(GAPS.map((g) => g.id)).size).toBe(10)
    expect(GAPS_STATUS).toBe('review')
  })

  it('har gap ___ bilan, answer qoʻyilganda darsdagi gap AYNAN shu koʻrinishda bor; tarjima oʻsha darsdagi', () => {
    for (const g of GAPS) {
      expect(g.sentence.split('___'), g.id).toHaveLength(2)
      const found = lessonPhrases(g.lessonId).find((p) => p.de === fullSentence(g))
      expect(found, g.id).toBeTruthy()
      expect(g.tr).toEqual(found!.tr)
      expect(g.moduleId).toBe('a1-m1')
    }
  })

  it('tarjimalar topshiriqdagidek (uz)', () => {
    expect(GAPS.map((g) => g.tr.uz)).toEqual([
      'Men Oʻzbekistondanman.',
      'Mening ismim Anna.',
      'Xayrli tong, Shmidt xonim!',
      'Ertagacha, Anna!',
      'Ismingiz nima?',
      'Siz qayerdansiz?',
      'Men elektrikman.',
      'Yaxshi, rahmat.',
      'Xayrli tun, Anna!',
      'Koʻrishguncha, Myuller janob!'
    ])
  })

  it('chalgʻituvchilar: 2 ta, javobdan va accept dan farqli, darslardagi soʻzlar ichida; javob ham darslarda', () => {
    for (const g of GAPS) {
      expect(new Set(g.distractors).size, g.id).toBe(2)
      for (const d of g.distractors) {
        expect(d, g.id).not.toBe(g.answer)
        expect(g.accept ?? []).not.toContain(d)
        expect(LESSON_TOKENS.has(d), `${g.id}: ${d}`).toBe(true)
      }
      expect(LESSON_TOKENS.has(g.answer), g.id).toBe(true)
    }
  })

  it('wordId — faqat gap lugʻatda boʻlsa', () => {
    const withWord = GAPS.filter((g) => g.wordId).map((g) => [g.id, g.wordId])
    expect(withWord).toEqual([
      ['g1', 'a1-m1-ich-komme-aus-usbekistan'],
      ['g5', 'a1-m1-wie-heissen-sie'],
      ['g6', 'a1-m1-woher-kommen-sie'],
      ['g8', 'a1-m1-mir-geht-es-gut-danke']
    ])
    for (const g of GAPS) if (g.wordId) expect(WORD_IDS.has(g.wordId)).toBe(true)
  })

  it('g2: accept [bin]', () => {
    expect(GAPS.find((g) => g.id === 'g2')!.accept).toEqual(['bin'])
  })
})
