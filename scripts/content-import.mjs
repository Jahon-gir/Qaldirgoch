#!/usr/bin/env node
/**
 * Kasbiy kontent: Excel shablon → src/content/packs/<til>/<soha>.json
 *
 *   npm run content:import -- docs/content/fayl.xlsx            # nemis tili (standart)
 *   npm run content:import -- docs/content/fayl.xlsx --til ko   # koreys tili
 *   npm run content:import -- docs/content/fayl.xlsx --dry      # faqat tekshirish, yozmaydi
 *
 * Xato boʻlsa hech narsa yozilmaydi (qator, ustun va sabab oʻzbekcha chiqadi). Ogohlantirishlar yozishni toʻxtatmaydi.
 * Excel'dagi har bir soha uchun JSON qayta yoziladi; Excel'da yoʻq sohalarning JSON'lari tegilmaydi.
 * Qoʻllanma: docs/content/README.md
 */
import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'
import { DIALOG_COLUMNS, FIELD_COLUMNS, SHEET, SITUATION_COLUMNS, WORD_COLUMNS, rowsToPacks } from '../src/content/pack/rows.ts'
import { rulesOf } from '../src/content/pack/rules.ts'
import { packReport } from '../src/content/pack/validate.ts'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const PACKS_DIR = join(ROOT, 'src/content/packs')
/** public/ ichidagi fayl hajmi (yoʻq boʻlsa null). */
export const publicFileInfo = (root = ROOT) => (p) => {
  try {
    const s = statSync(join(root, 'public', p))
    return s.isFile() ? { size: s.size } : null
  } catch {
    return null
  }
}

const iso = (d) => d.toISOString().slice(0, 10)
/** exceljs katak qiymati → matn. */
export function cellText(v) {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return iso(v)
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('')
    if ('result' in v) return cellText(v.result)
    if ('text' in v) return cellText(v.text)
    if ('error' in v) return ''
    return ''
  }
  return String(v)
}

const REQUIRED = { [SHEET.fields]: FIELD_COLUMNS, [SHEET.situations]: SITUATION_COLUMNS, [SHEET.words]: WORD_COLUMNS, [SHEET.dialogs]: DIALOG_COLUMNS }

/** Varaqni qatorlarga aylantiradi: 1-qator — ustun nomlari, 2-qator — izoh, maʼlumot 3-qatordan; boʻsh qatorlar tashlanadi. */
export function sheetRows(ws, issues) {
  const header = []
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, col) => {
    header[col] = cellText(c.value).trim().toLowerCase()
  })
  const missing = REQUIRED[ws.name].filter((k) => !header.includes(k))
  if (missing.length) issues.push({ level: 'error', where: `${ws.name}, 1-qator`, message: `ustun(lar) yoʻq: ${missing.join(', ')}` })
  const rows = []
  for (let r = 3; r <= ws.rowCount; r++) {
    const row = { __row: String(r) }
    let any = false
    header.forEach((k, col) => {
      if (!k) return
      const t = cellText(ws.getRow(r).getCell(col).value).trim()
      row[k] = t
      if (t !== '') any = true
    })
    if (any) rows.push(row)
  }
  return rows
}

export async function readWorkbook(file) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(file)
  const issues = []
  const get = (name, optional = false) => {
    const ws = wb.getWorksheet(name)
    if (!ws && optional) return []
    if (!ws) {
      issues.push({ level: 'error', where: file, message: `"${name}" varagʻi yoʻq (shablondan foydalaning: docs/content/shablon.xlsx)` })
      return []
    }
    return sheetRows(ws, issues)
  }
  return { sheets: { fields: get(SHEET.fields), situations: get(SHEET.situations), words: get(SHEET.words), dialogs: get(SHEET.dialogs, true) }, issues }
}

/** Import: xatolar boʻlsa yozmaydi. Natija: { ok, packs, issues, written }. */
export async function importWorkbook(file, { course = 'de', dry = false, root = ROOT, existingWordIds } = {}) {
  const rules = rulesOf(course)
  if (!rules) return { ok: false, packs: [], written: [], issues: [{ level: 'error', where: '--til', message: `nomaʼlum til "${course}" (mumkin: de, ko)` }] }
  const read = await readWorkbook(file)
  const res = rowsToPacks(read.sheets, rules, { fileInfo: publicFileInfo(root), existingWordIds })
  const issues = [...read.issues, ...res.issues]
  const ok = !issues.some((i) => i.level === 'error')
  const written = []
  if (ok && !dry) {
    const dir = join(root, 'src/content/packs', course)
    mkdirSync(dir, { recursive: true })
    for (const p of res.packs) {
      if (p.words.length === 0 && p.situations.length === 0) continue
      const f = join(dir, `${p.field}.json`)
      writeFileSync(f, JSON.stringify(p, null, 2) + '\n')
      written.push(f)
    }
  }
  return { ok, packs: res.packs, issues, written }
}

export function printIssues(issues) {
  const errors = issues.filter((i) => i.level === 'error')
  const warnings = issues.filter((i) => i.level === 'warning')
  for (const i of errors) console.error(`XATO  ${i.where}: ${i.message}`)
  for (const i of warnings) console.warn(`DIQQAT ${i.where}: ${i.message}`)
  return { errors: errors.length, warnings: warnings.length }
}

async function main() {
  const args = process.argv.slice(2)
  const tilIdx = args.indexOf('--til')
  const file = args.find((a, i) => !a.startsWith('--') && (tilIdx < 0 || i !== tilIdx + 1))
  const course = tilIdx >= 0 ? args[tilIdx + 1] : 'de'
  const dry = args.includes('--dry')
  if (!file) {
    console.error('Foydalanish: npm run content:import -- <fayl.xlsx> [--til de|ko] [--dry]')
    process.exit(2)
  }
  const { ok, packs, issues, written } = await importWorkbook(resolve(file), { course, dry })
  const n = printIssues(issues)
  for (const l of packReport(packs)) console.log(l)
  if (!ok) {
    console.error(`\n${n.errors} ta xato — hech narsa yozilmadi. Excel'ni tuzatib, qayta ishga tushiring.`)
    process.exit(1)
  }
  console.log(dry ? '\nTekshiruv oʻtdi (--dry: fayl yozilmadi).' : `\nYozildi: ${written.map((f) => f.replace(ROOT + '/', '')).join(', ') || '— (boʻsh)'}`)
  console.log('Keyingi qadam: npm run content:check (ilovadagi mavjud soʻzlar bilan toʻqnashuv ham tekshiriladi).')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
