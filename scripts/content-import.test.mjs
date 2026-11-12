import { mkdirSync, mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { FIELD_COLUMNS, SITUATION_COLUMNS, WORD_COLUMNS } from '../src/content/pack/rows.ts'
import { cellText, importWorkbook } from './content-import.mjs'
import { checkPacks } from './content-check.mjs'
import { makeTemplate } from './make-content-template.mjs'

/** Vaqtinchalik "repo": public/ va src/content/packs/ bilan. */
function tmpRoot() {
  const root = mkdtempSync(join(tmpdir(), 'kontent-'))
  mkdirSync(join(root, 'public/content/de/img/technical'), { recursive: true })
  writeFileSync(join(root, 'public/content/de/img/technical/hammer.webp'), Buffer.alloc(12_000))
  return root
}

async function workbook(root, words) {
  const wb = new ExcelJS.Workbook()
  const add = (name, cols, rows) => {
    const ws = wb.addWorksheet(name)
    ws.addRow([...cols])
    ws.addRow(cols.map(() => 'izoh'))
    for (const r of rows) ws.addRow(cols.map((c) => r[c] ?? ''))
  }
  add('Sohalar', FIELD_COLUMNS, [{ id: 'technical', title_uz: 'Texnik kasblar', title_cyrl: 'Техник касблар', title_ru: 'Технические профессии', order: 1 }, { id: 'care', title_uz: 'Parvarish', order: 2 }])
  add('Vaziyatlar', SITUATION_COLUMNS, [{ field: 'technical', id: 'asboblar', title_uz: 'Asboblar', title_cyrl: 'Асбоблар', title_ru: 'Инструменты', order: 1, level: 'A1' }])
  add('Sozlar', WORD_COLUMNS, words)
  const f = join(root, 'test.xlsx')
  await wb.xlsx.writeFile(f)
  return f
}

const hammer = {
  field: 'technical', situation: 'asboblar', level: 'A1', article: 'der', term: 'Hammer', plural: 'die Hämmer',
  uz: 'bolgʻa', uz_cyrl: 'болға', ru: 'молоток', pron_uz: 'der ha-mer', pron_cyrl: 'дер ха-мер', pron_ru: 'дер ха-мер', safety: 'yoʻq', image_file: 'technical/hammer.webp', image_source: 'ai',
  image_checked: 'ha', status: 'tasdiqlangan', verified_by: 'Tekshiruvchi', verified_at: new Date(Date.UTC(2026, 10, 13))
}

describe('content:import (Excel → JSON)', () => {
  it('toʻgʻri faylni JSON ga yozadi; boʻsh soha (care) yozilmaydi; Excel sanasi YYYY-MM-DD', async () => {
    const root = tmpRoot()
    const res = await importWorkbook(await workbook(root, [hammer]), { root })
    expect(res.issues.filter((i) => i.level === 'error')).toEqual([])
    expect(res.ok).toBe(true)
    const f = join(root, 'src/content/packs/de/technical.json')
    expect(res.written).toEqual([f])
    expect(existsSync(join(root, 'src/content/packs/de/care.json'))).toBe(false)
    const pack = JSON.parse(readFileSync(f, 'utf8'))
    expect(pack).toMatchObject({ schema: 1, course: 'de', field: 'technical', title: { uz: 'Texnik kasblar' } })
    expect(pack.words[0]).toMatchObject({ id: 'technical-asboblar-hammer', term: 'der Hammer', status: 'approved', verifiedAt: '2026-11-13', image: { src: 'content/de/img/technical/hammer.webp', source: 'ai', checked: true } })
    expect(checkPacks(join(root, 'src/content/packs'), root).issues).toEqual([])
  })

  it('xato boʻlsa hech narsa yozilmaydi va qator raqami aytiladi', async () => {
    const root = tmpRoot()
    const res = await importWorkbook(await workbook(root, [hammer, { ...hammer, term: 'Zange', article: 'die', plural: 'die Zangen', image_file: 'technical/zange.webp' }]), { root })
    expect(res.ok).toBe(false)
    expect(res.written).toEqual([])
    expect(res.issues).toContainEqual({ level: 'error', where: 'Sozlar, 4-qator', message: 'rasm fayli topilmadi: public/content/de/img/technical/zange.webp' })
    expect(existsSync(join(root, 'src/content/packs/de/technical.json'))).toBe(false)
  })

  it('--dry: tekshiradi, lekin yozmaydi', async () => {
    const root = tmpRoot()
    const res = await importWorkbook(await workbook(root, [hammer]), { root, dry: true })
    expect(res.ok).toBe(true)
    expect(res.written).toEqual([])
  })

  it('nomaʼlum til', async () => {
    const root = tmpRoot()
    const res = await importWorkbook(await workbook(root, [hammer]), { root, course: 'fr' })
    expect(res.ok).toBe(false)
  })

  it('varaq yoki ustun yetishmasa — xato', async () => {
    const root = tmpRoot()
    const wb = new ExcelJS.Workbook()
    wb.addWorksheet('Sohalar').addRow(['id'])
    const f = join(root, 'yomon.xlsx')
    await wb.xlsx.writeFile(f)
    const res = await importWorkbook(f, { root })
    expect(res.ok).toBe(false)
    const text = res.issues.map((i) => i.message).join('\n')
    expect(text).toMatch(/"Vaziyatlar" varagʻi yoʻq/)
    expect(text).toMatch(/ustun\(lar\) yoʻq: title_uz/)
  })
})

describe('shablon', () => {
  it('yaratilgan shablon xatosiz import qilinadi (izoh qatori oʻtkaziladi, soʻzsiz sohalar yozilmaydi)', async () => {
    const root = tmpRoot()
    const out = await makeTemplate(join(root, 'shablon.xlsx'))
    const res = await importWorkbook(out, { root })
    expect(res.issues).toEqual([])
    expect(res.packs.map((p) => p.field)).toEqual(['general', 'care', 'technical', 'hospitality', 'logistics', 'metal'])
    expect(res.written).toEqual([])
  })
})

describe('cellText', () => {
  it.each([
    [null, ''], [3, '3'], ['  a ', '  a '], [new Date(Date.UTC(2026, 0, 5)), '2026-01-05'],
    [{ richText: [{ text: 'der ' }, { text: 'Hammer' }] }, 'der Hammer'], [{ formula: 'A1', result: 7 }, '7'], [{ text: 'link', hyperlink: 'x' }, 'link']
  ])('%o', (v, want) => expect(cellText(v)).toBe(want))
})
