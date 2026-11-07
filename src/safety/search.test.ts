import { describe, expect, it } from 'vitest'
import { FIXTURE } from './fixtures'
import { normalizeLicense, normalizePhone, normalizeText } from './normalize'
import { classifyQuery, searchAgencies } from './search'

const names = (q: string) => searchAgencies(FIXTURE, q).map((a) => a.litsenziya_raqami)

describe('normalizeText', () => {
  it('kichik harf, tinish belgilari va ortiqcha bo‘shliqsiz', () => {
    expect(normalizeText('  “Alfa   xususiy-bandlik”,  MChJ. ')).toBe('alfa xususiy bandlik mchj')
  })
  it('ʻ ʼ \' ` bitta shaklga keladi', () => {
    const forms = ["O'zbek", 'Oʻzbek', 'O‘zbek', 'O’zbek', 'O`zbek', 'Ozbek']
    expect(new Set(forms.map(normalizeText)).size).toBe(1)
  })
  it('kirill lotinga o‘giriladi', () => {
    expect(normalizeText('Ўзбек')).toBe(normalizeText("O'zbek"))
    expect(normalizeText('Алфа')).toBe('alfa')
    expect(normalizeText('Шоша')).toBe('shosha')
  })
})

describe('normalizePhone / normalizeLicense', () => {
  it('telefon: oxirgi 9 raqam, format farqsiz', () => {
    for (const p of ['+998(90) 111-22-33', '+998901112233', '90 111 22 33', '998 90-111-22-33', '901112233']) expect(normalizePhone(p)).toBe('901112233')
    expect(normalizePhone('12345')).toBe('')
  })
  it('litsenziya: faqat raqamlar, boshidagi nollarsiz', () => {
    expect(normalizeLicense('№0022')).toBe('22')
    expect(normalizeLicense('№ 061652')).toBe('61652')
  })
})

describe('classifyQuery', () => {
  it('qisqa va bo‘sh so‘rov — empty', () => {
    for (const q of ['', '   ', 'al', '12', '№1', '--']) expect(classifyQuery(q).kind).toBe('empty')
  })
  it('turlari', () => {
    expect(classifyQuery('№0101').kind).toBe('license')
    expect(classifyQuery('+998 90 111 22 33').kind).toBe('phone')
    expect(classifyQuery('alfa').kind).toBe('name')
  })
})

describe('searchAgencies', () => {
  it('nom: ʻ / \' farqi va kirill', () => {
    for (const q of ["o'zbek", 'oʻzbek', 'O‘ZBEK', 'ozbek ish', 'ўзбек иш']) expect(names(q)).toEqual(['0303'])
  })
  it('nom: so‘rovdagi barcha so‘zlar nomda bo‘lsa mos; umumiy so‘zlar shart emas', () => {
    expect(names('alfa xususiy')).toEqual(['0101'])
    expect(names('alfa mchj')).toEqual(['0101', '0202'])
    expect(names('alfa ozbek')).toEqual([])
  })
  it('bir nechta natija', () => {
    expect(names('alfa')).toEqual(['0101', '0202'])
  })
  it('litsenziya raqami: aniq moslik', () => {
    expect(names('0101')).toEqual(['0101'])
    expect(names('№ 0202')).toEqual(['0202'])
    expect(names('101')).toEqual(['0101'])
    expect(names('0909')).toEqual([])
  })
  it('telefon: turli formatlar', () => {
    for (const q of ['+998(90) 111-22-33', '+998901112233', '90 111 22 33', '998 91 222 33 44']) expect(names(q)).toEqual(['0101'])
    expect(names('+998 93 555 66 77')).toEqual(['0202'])
  })
  it('topilmadi', () => {
    expect(names('zzzzzz')).toEqual([])
    expect(names('+998 99 000 00 00')).toEqual([])
  })
  it('qisqa/bo‘sh so‘rovda hech narsa chiqmaydi', () => {
    for (const q of ['', ' ', 'a', 'al', '10']) expect(names(q)).toEqual([])
  })
})
