#!/usr/bin/env node
/**
 * Jamoa toʻldiradigan Excel shablonini yaratadi: docs/content/shablon.xlsx
 *   npm run content:template
 * Ustunlar src/content/pack/rows.ts dagi roʻyxatdan olinadi (import bilan doim mos).
 */
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'
import { FIELD_COLUMNS, SHEET, SITUATION_COLUMNS, WORD_COLUMNS } from '../src/content/pack/rows.ts'
import { PACK_RULES } from '../src/content/pack/rules.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LAST = 2000

/** 2-qator: har ustun uchun izoh va misol (import bu qatorni oʻtkazib yuboradi). */
const NOTES = {
  id: 'Lotin kichik harf, chiziqcha. Misol: birinchi-kun',
  title_uz: 'Nomi (lotin). Misol: Birinchi ish kuni',
  title_cyrl: 'Nomi (kirill, qoʻlda). Misol: Биринчи иш куни',
  title_ru: 'Nomi (rus). Misol: Первый рабочий день',
  order: 'Tartib raqami: 1, 2, 3 ...',
  level: 'Daraja: A1, A2, B1, B2',
  field: 'Soha id (roʻyxatdan): technical, care, hospitality, general',
  situation: 'Vaziyat id ("Vaziyatlar" varagʻidan). Misol: asboblar',
  article: 'Faqat otlarda: der / die / das. Boshqa soʻzda boʻsh',
  term: 'Soʻz yoki ibora ARTIKLSIZ. Misol: Hammer',
  plural: 'Koʻplik: die Hämmer. Koʻpligi yoʻq boʻlsa: —',
  icon: 'Ikonka (rasm boʻlmasa). Tabler nomi: tools, first-aid-kit. Boʻsh — umumiy belgi',
  slug: 'Boʻsh qoldiring (oʻzi chiqadi). Koreys tilida majburiy: chulgu',
  uz: 'Oʻzbekcha tarjima (lotin). Misol: bolgʻa',
  uz_cyrl: 'Kirill, qoʻlda yozing. Misol: болға',
  ru: 'Ruscha. Misol: молоток',
  pron_uz: 'Oʻqilishi (ixtiyoriy; koreysda majburiy). Misol: der ha-mer',
  pron_cyrl: 'Oʻqilishi kirillda. Misol: дер ха-мер',
  pron_ru: 'Oʻqilishi ruscha. Misol: дер ха-мер',
  example_term: 'Misol gap (oʻzimiz yozamiz, darslikdan koʻchirilmaydi). Misol: Gib mir bitte den Hammer.',
  example_uz: 'Misol tarjimasi. Misol: Bolgʻani bering, iltimos.',
  example_cyrl: 'Misol tarjimasi kirillda',
  example_ru: 'Misol tarjimasi ruscha',
  jobs: 'Kasblar (ixtiyoriy), vergul bilan: elektroniker, shk',
  safety: 'Xavfsizlik soʻzimi: ha / yoʻq',
  image_file: 'Rasm fayli: public/content/de/img/ ichidagi yoʻl. Misol: technical/hammer.webp',
  image_source: 'Rasm manbai: ai / own / cc',
  image_license: 'Faqat cc: litsenziya. Misol: CC BY 4.0',
  image_author: 'Faqat cc: muallif',
  image_checked: 'Rasmni odam koʻrib chiqdimi: ha / yoʻq',
  audio_file: 'Ixtiyoriy: public/content/de/audio/ ichidagi yoʻl. Boʻsh — ilova ovozi',
  source: 'Manba (ixtiyoriy). Misol: Goethe A1 Wortliste — faqat daraja uchun',
  status: 'Holat: qoralama / tekshiruvda / tasdiqlangan',
  verified_by: 'Tasdiqlangan boʻlsa: tekshiruvchi ismi',
  verified_at: 'Tasdiqlangan boʻlsa: sana YYYY-MM-DD'
}

const list = (values) => ({ type: 'list', allowBlank: true, formulae: [`"${values.join(',')}"`], showErrorMessage: true, errorTitle: 'Roʻyxatdan tanlang', error: `Mumkin: ${values.join(', ')}` })
const letter = (i) => {
  let s = ''
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

function sheet(wb, name, columns, validations = {}) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 2 }] })
  ws.addRow([...columns])
  ws.addRow(columns.map((c) => NOTES[c] ?? ''))
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF143C8C' } }
  ws.getRow(2).font = { italic: true, color: { argb: 'FF6B7280' }, size: 9 }
  ws.getRow(2).alignment = { wrapText: true, vertical: 'top' }
  ws.getRow(2).height = 48
  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = Math.min(Math.max(c.length + 4, 14), 34)
    if (validations[c]) ws.dataValidations.add(`${letter(i)}3:${letter(i)}${LAST}`, validations[c])
  })
  return ws
}

export async function makeTemplate(out = join(ROOT, 'docs/content/shablon.xlsx')) {
  const de = PACK_RULES.de
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Qaldirgʻoch'

  const guide = wb.addWorksheet('Qollanma')
  guide.getColumn(1).width = 110
  ;[
    'Kasbiy soʻzlar shabloni — qanday toʻldirish',
    '1. "Sohalar": soha id roʻyxatdan (technical, care, hospitality, general). Nomlar uch tilda.',
    '2. "Vaziyatlar": har soha ichidagi vaziyatlar (masalan, Birinchi ish kuni, Asboblar). id — lotin kichik harf va chiziqcha.',
    '3. "Sozlar": har qator — bitta soʻz. Ot boʻlsa artikl alohida ustunda (der/die/das), "term" da artiklsiz.',
    '4. 2-qatordagi kulrang izohlarni oʻchirmang — import ularni oʻtkazib yuboradi. Maʼlumot 3-qatordan boshlanadi.',
    '5. Rasm: .webp, ~30 KB (60 KB dan oshmasin), bitta uslubda. AI chizgan boʻlsa image_source = ai; odam koʻrib chiqqach image_checked = ha.',
    '6. Holat: qoralama → tekshiruvda → tasdiqlangan. "Tasdiqlangan" faqat nemis tilini biladigan tekshiruvchi koʻrgach (verified_by, verified_at).',
    '7. Darslik, telc, Goethe matni, misol gapi va rasmi KOʻCHIRILMAYDI. Misol gaplarni oʻzimiz yozamiz.',
    '8. Tekshirish: npm run content:import -- fayl.xlsx --dry   ·   Yozish: npm run content:import -- fayl.xlsx',
    'Batafsil: docs/content/README.md'
  ].forEach((t, i) => {
    const r = guide.addRow([t])
    if (i === 0) r.font = { bold: true, size: 14 }
  })

  const fields = sheet(wb, SHEET.fields, FIELD_COLUMNS, { id: list([...de.fields]) })
  ;[
    ['general', 'Umumiy: ish kundaligi', 'Умумий: иш кундалиги', 'Общее: рабочие будни', 1],
    ['care', 'Parvarish va tibbiyot', 'Парвариш ва тиббиёт', 'Уход и медицина', 2],
    ['technical', 'Texnik kasblar', 'Техник касблар', 'Технические профессии', 3],
    ['hospitality', 'Mehmonxona va oshxona', 'Меҳмонхона ва ошхона', 'Гостиницы и кухня', 4]
  ].forEach((r) => fields.addRow(r))

  sheet(wb, SHEET.situations, SITUATION_COLUMNS, { field: list([...de.fields]), level: list([...de.levels]) })
  const yn = list(['ha', 'yoʻq'])
  sheet(wb, SHEET.words, WORD_COLUMNS, {
    field: list([...de.fields]),
    level: list([...de.levels]),
    article: list(['der', 'die', 'das']),
    safety: yn,
    image_source: list(['ai', 'own', 'cc']),
    image_checked: yn,
    status: list(['qoralama', 'tekshiruvda', 'tasdiqlangan'])
  })

  mkdirSync(dirname(out), { recursive: true })
  await wb.xlsx.writeFile(out)
  return out
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = await makeTemplate()
  console.log(`Shablon yaratildi: ${out.replace(ROOT + '/', '')}`)
}
