import { describe, expect, it } from 'vitest'
import { check, isBlank, isRight, levenshtein, normalize, specialLettersOf, specialToInsert, squash } from './answer'

describe('normalize', () => {
  it('trim, kichik harf, boʻsh joylar siqiladi', () => {
    expect(normalize('  Guten   Morgen  ')).toBe('guten morgen')
    expect(squash('  Guten \t  Morgen ')).toBe('Guten Morgen')
  })
  it('tinish belgilari olib tashlanadi', () => {
    expect(normalize('Wie heißen Sie?')).toBe('wie heissen sie')
    expect(normalize('Mir geht es gut, danke.')).toBe('mir geht es gut danke')
    expect(normalize('«Hallo»! "ja"; nein: \'so\'')).toBe('hallo ja nein so')
  })
  it('umlaut va ß: ä→ae, ö→oe, ü→ue, ß→ss (katta harf ham)', () => {
    expect(normalize('Tschüss')).toBe('tschuess')
    expect(normalize('TSCHÜSS')).toBe('tschuess')
    expect(normalize('Schweißer')).toBe('schweisser')
    expect(normalize('Ärzte Öl')).toBe('aerzte oel')
  })
  it('Unicode NFC: ajratilgan umlaut (u + ¨) ham bir xil', () => {
    expect(normalize('Tschüss')).toBe(normalize('Tschüss'))
  })
})

describe('check', () => {
  it('exact: harfma-harf (chetdagi va ikki karra boʻsh joy hisobga olinmaydi)', () => {
    expect(check('Tschüss', 'Tschüss')).toBe('exact')
    expect(check('  Guten  Morgen ', 'Guten Morgen')).toBe('exact')
  })
  it('correct: ae/oe/ue/ss, katta-kichik, tinish belgisi', () => {
    expect(check('tschuess', 'Tschüss')).toBe('correct')
    expect(check('tschüss', 'Tschüss')).toBe('correct')
    expect(check('TSCHÜSS', 'Tschüss')).toBe('correct')
    expect(check('wie heissen sie', 'Wie heißen Sie?')).toBe('correct')
    expect(check('Der Schweisser', 'der Schweißer')).toBe('correct')
  })
  it('almost: 5+ harfda bitta harf farq (Levenshtein 1)', () => {
    expect(check('Tschuss', 'Tschüss')).toBe('almost') // tschuss ↔ tschuess
    expect(check('Gutn Morgen', 'Guten Morgen')).toBe('almost')
    expect(check('Pflegekraf', 'die Pflegekraft')).toBe('wrong') // artiklsiz — koʻp farq
    expect(check('die Pflegekraf', 'die Pflegekraft')).toBe('almost')
  })
  it('almost chegarasi: 5 harfdan kam boʻlsa bitta harf ham xato', () => {
    expect(check('Hall', 'Hallo')).toBe('almost') // 5 harf — chegara
    expect(check('ich bn', 'ich bin')).toBe('almost') // boʻsh joysiz 6
    expect(check('Kch', 'Koch')).toBe('wrong') // 4 harf
    expect(check('der Kch', 'der Koch')).toBe('almost') // boʻsh joysiz 7
  })
  it('Levenshtein 2 — xato', () => {
    expect(check('Tschss', 'Tschüss')).toBe('wrong') // tschss ↔ tschuess = 2
    expect(check('Gtn Morgen', 'Guten Morgen')).toBe('wrong')
  })
  it('boʻsh kiritish tekshirilmaydi', () => {
    expect(isBlank('')).toBe(true)
    expect(isBlank('   ')).toBe(true)
    expect(isBlank(' a ')).toBe(false)
    expect(check('  ', 'Hallo')).toBe('wrong')
  })
  it('exact, correct, almost — toʻgʻri; wrong — xato', () => {
    expect(['exact', 'correct', 'almost', 'wrong'].map((r) => isRight(r as never))).toEqual([true, true, true, false])
  })
})

describe('levenshtein', () => {
  it('asosiy holatlar', () => {
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('abc', 'abc')).toBe(0)
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('abc', 'abxc')).toBe(1)
    expect(levenshtein('abc', 'ab')).toBe(1)
  })
})

describe('Yozish: faqat kerakli harflar', () => {
  it('javobdagi harflar, ä ö ü ß tartibida', () => {
    expect(specialLettersOf('Tschüss')).toEqual(['ü', 'ß']) // ss ≡ ß qabul qilinadi
    expect(specialLettersOf('Guten Tag')).toEqual([])
    expect(specialLettersOf('Ärger')).toEqual(['ä'])
    expect(specialLettersOf('Öl')).toEqual(['ö'])
    expect(specialLettersOf('Übung')).toEqual(['ü'])
    expect(specialLettersOf('der Schweißer')).toEqual(['ß'])
    expect(specialLettersOf('Größe über Äpfel')).toEqual(['ä', 'ö', 'ü', 'ß'])
    expect(specialLettersOf('Hallo')).toEqual([])
  })
  it('katta harf: soʻz boshida (kursor oldida belgi yoʻq/boʻsh joy) va targetda katta boʻlsa', () => {
    expect(specialToInsert('ä', 'Ärger', '')).toBe('Ä')
    expect(specialToInsert('ö', 'Öl', '')).toBe('Ö')
    expect(specialToInsert('ü', 'Übung', '')).toBe('Ü')
    expect(specialToInsert('ü', 'die Übung', 'die ')).toBe('Ü')
    expect(specialToInsert('ü', 'Übung', 'Üb')).toBe('ü') // soʻz oʻrtasida
    expect(specialToInsert('ä', 'Ärger', 'x')).toBe('ä')
    expect(specialToInsert('ü', 'Tschüss', '')).toBe('ü') // targetda katta Ü yoʻq
    expect(specialToInsert('ß', 'heißen', '')).toBe('ß')
  })
})
