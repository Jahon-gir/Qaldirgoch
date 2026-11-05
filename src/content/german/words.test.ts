import { describe, expect, it } from 'vitest'
import { exercisesOf, LESSONS } from './index'
import { VOCAB, WORD_IDS, wordById, wordIdsOfLesson, wordOfExercise, wordSlug } from './words'

describe('lugʻat — faqat darslardagi soʻzlar', () => {
  it('id barqaror (oʻzgarsa foydalanuvchi progressi yoʻqoladi)', () => {
    expect(VOCAB.map((w) => w.id)).toEqual([
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
    ])
  })

  it('slug: umlaut va ß', () => {
    expect(wordSlug('Tschüss')).toBe('tschuess')
    expect(wordSlug('Schweißer')).toBe('schweisser')
    expect(wordSlug('Öl & Äpfel!')).toBe('oel-aepfel')
  })

  it('har soʻz darsdagi word mashqidan, tarjima uch tilda', () => {
    const fromLessons = LESSONS.flatMap((l) => exercisesOf(l.id)).filter((e) => e.type === 'word')
    expect(VOCAB).toHaveLength(new Set(fromLessons.map((e) => e.de)).size)
    expect(WORD_IDS.size).toBe(VOCAB.length)
    for (const w of VOCAB) {
      const ex = fromLessons.find((e) => e.id === w.exerciseId)!
      expect(ex.de).toBe(w.de)
      expect(w.tr).toBe(ex.tr)
      for (const lang of ['uz', 'uz-Cyrl', 'ru'] as const) expect(w.tr[lang].trim()).not.toBe('')
      expect(wordById(w.id)).toBe(w)
      expect(wordOfExercise(w.exerciseId)).toBe(w)
    }
  })

  it('dars soʻzlari', () => {
    expect(wordIdsOfLesson('a1-m1-l1')).toEqual(['a1-m1-hallo', 'a1-m1-guten-morgen', 'a1-m1-guten-tag', 'a1-m1-guten-abend'])
    expect(wordIdsOfLesson('a1-m1-l6')).toEqual([])
    expect(wordIdsOfLesson('yoq')).toEqual([])
  })
})
