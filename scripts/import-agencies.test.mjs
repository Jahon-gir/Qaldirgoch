import { describe, expect, it } from 'vitest'
import { buildSql, parseRegistry, parseRow } from './import-agencies.mjs'

const cell = (...ps) => `<td>${ps.map((p) => `<p>${p}</p>`).join('')}</td>`
const row = (nomi, manzil, contact, lic) => `<tr>${cell('1.')}${cell(nomi)}${cell(manzil)}<td>${contact}</td>${cell(lic)}</tr>`
const page = (rows, n = rows.length) => `<table><tr>${cell('№')}${cell('Nomi')}${cell('Manzil')}${cell('Aloqa')}${cell('Lits')}</tr>${rows.join('')}</table> Oxirgi yangilaniş: 2026-10-28 10:04:22`

describe('import-agencies', () => {
  it('rahbar ismi (hatto telefon bilan bir paragrafda bo‘lsa ham) saqlanmaydi', () => {
    const a = parseRow(
      [
        '<td>1</td>',
        cell('“Alfa” MChJ'),
        cell('Test,&nbsp;1-uy'),
        cell('Soatova Jamila Marupovna +998 95 000 15 47 +998 91 532 33 07 INFO@Alfa.UZ'),
        cell('№0022<br />18.01.2019')
      ]
    )
    expect(a.telefonlar).toEqual(['+998 95 000 15 47', '+998 91 532 33 07'])
    expect(a.telefonlar_norm).toEqual(['950001547', '915323307'])
    expect(a.email).toBe('info@alfa.uz')
    expect(a.litsenziya_raqami).toBe('0022')
    expect(a.litsenziya_sanasi).toBe('2019-01-18')
    expect(JSON.stringify(a)).not.toMatch(/Soatova|Jamila|Marupovna/)
  })
  it('alohida paragrafdagi rahbar, bo‘sh email, "+ 998" tozalanadi', () => {
    const a = parseRow(['<td>1</td>', cell('X MChJ'), cell('Manzil'), `<td>${'<p>Ali Valiyev</p><p>+ 998 95 027 54 55</p>'}</td>`, cell('№12', '01.02.2020')])
    expect(a.telefonlar).toEqual(['+998 95 027 54 55'])
    expect(a.email).toBeNull()
    expect(a.litsenziya_sanasi).toBe('2020-02-01')
  })
  it('sahifadan sarlavhasiz qatorlar va yangilanish sanasi olinadi', () => {
    const r = parseRegistry(page(['<tr><td>1</td></tr>', '<tr><td>2</td></tr>']))
    expect(r.rows).toHaveLength(2)
    expect(r.updated).toBe('2026-10-28')
    expect(() => parseRegistry('<table></table>')).toThrow()
  })
  it('SQL: apostrof ekranlanadi, STIR/rahbar/muddati ustuni yo‘q', () => {
    const a = parseRow(['<td>1</td>', cell("“O'z” MChJ"), cell('M'), cell('Ali +998 90 111 22 33'), cell('№1', '01.01.2020')])
    const sql = buildSql([a], { updated: '2026-10-28', checked: '2026-11-07' })
    expect(sql).toContain("“O''z” MChJ")
    expect(sql).toContain('on conflict (litsenziya_raqami)')
    expect(sql.replace(/^--.*$/gm, '')).not.toMatch(/\b(stir|muddati|reyting|rahbar)\b/i)
  })
})
