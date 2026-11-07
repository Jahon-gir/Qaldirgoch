#!/usr/bin/env node
/**
 * Migratsiya agentligi reestridan (HTML jadval) supabase/seed/agencies.sql hosil qiladi.
 * Bir martalik; SQL keyin Supabase SQL Editor'da QO'LDA ishga tushiriladi (avval 0005_agencies.sql).
 *
 *   node scripts/import-agencies.mjs                 # sahifani URL'dan oladi
 *   node scripts/import-agencies.mjs --file page.html # saqlangan HTML'dan (oflayn)
 *
 * Saqlanmaydi: rahbar ismi, STIR (reestrda yo'q), reyting. Qatorlar soni 48 dan farq qilsa — xato bilan to'xtaydi.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizePhone, normalizeText } from '../src/safety/normalize.ts'

export const SOURCE_URL = 'https://gov.uz/oz/migration/activity_page/xususiy-bandlik-agentliklari_'
export const EXPECTED_ROWS = 48

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”' }
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
    return ENTITIES[e.toLowerCase()] ?? m
  })
const clean = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
/** Ichki satr uzilishlarini (br, p) bo'sh joyga aylantirib matn oladi. */
const paragraphs = (cellHtml) =>
  [...cellHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => clean(m[1])).filter(Boolean)

/** Sahifa HTML'idan jadval qatorlarini (sarlavhasiz) va "oxirgi yangilanish" sanasini ajratadi. */
export function parseRegistry(html) {
  const table = html.match(/<table[\s\S]*?<\/table>/i)?.[0]
  if (!table) throw new Error('Jadval topilmadi: sahifa tuzilishi o‘zgargan')
  const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => [...m[0].matchAll(/<td[\s\S]*?<\/td>/gi)].map((c) => c[0]))
  const data = rows.slice(1)
  const upd = html.match(/Oxirgi yangilani[sş]:?\s*(\d{4}-\d{2}-\d{2})/)
  if (!upd) throw new Error('"Oxirgi yangilanish" sanasi topilmadi')
  return { rows: data, updated: upd[1] }
}

const toIsoDate = (s) => {
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

/** Bitta qator (5 ta <td>) → agentlik. Rahbar ismi bu yerda tashlab yuboriladi. */
export function parseRow(cells) {
  if (cells.length !== 5) throw new Error(`Ustunlar soni 5 emas (${cells.length})`)
  const nomi = clean(cells[1]).replace(/\s+([”"»])/g, '$1')
  const manzil = clean(cells[2]) || null
  // 4-ustun: rahbar ismi, telefon(lar), email — ba'zan bitta paragrafda aralash. Paragraf emas, butun matn bo'yicha ajratamiz.
  let text = paragraphs(cells[3]).join(' ')
  const emails = (text.match(/[^\s,;]+@[^\s,;]+/g) ?? []).map((x) => x.toLowerCase())
  text = text.replace(/[^\s,;]+@[^\s,;]+/g, ' ')
  // Birinchi telefon boshlanishigacha — rahbar ismi: tashlanadi, saqlanmaydi
  const start = text.search(/[+\d]/)
  const rest = start < 0 ? '' : text.slice(start)
  const pieces = rest.split(/\s*[,;]\s*|\s+(?=\+)/).map((x) => x.trim()).filter(Boolean)
  const phones = []
  const skipped = [] // telefonga o'xshamagan bo'laklar (matni emas, faqat soni hisobotga chiqadi)
  for (const p of pieces) {
    const d = p.replace(/\D/g, '')
    if (/^[+\d\s()\-]+$/.test(p) && d.length >= 9 && d.length <= 12) phones.push(p.replace(/^\+\s+/, '+'))
    else skipped.push(p)
  }
  const lic = paragraphs(cells[4]).join(' ')
  const raqam = lic.match(/№?\s*(\d{1,})/)?.[1] ?? null
  const sana = toIsoDate(lic)
  return {
    nomi,
    nomi_norm: normalizeText(nomi),
    litsenziya_raqami: raqam,
    litsenziya_sanasi: sana,
    manzil,
    telefonlar: phones,
    telefonlar_norm: phones.map(normalizePhone).filter(Boolean),
    email: emails.length ? emails.join(', ') : null,
    _skipped: skipped
  }
}

const q = (v) => (v === null || v === undefined ? 'null::text' : `'${String(v).replace(/'/g, "''")}'`)
const arr = (a) => (a.length ? `array[${a.map(q).join(', ')}]::text[]` : "'{}'::text[]")

export function buildSql(agencies, { updated, checked }) {
  const values = agencies
    .map(
      (a) =>
        `  (${q(a.nomi)}, ${q(a.nomi_norm)}, ${q(a.litsenziya_raqami)}, ${a.litsenziya_sanasi ? q(a.litsenziya_sanasi) + '::date' : 'null::date'}, ${q(a.manzil)}, ${arr(a.telefonlar)}, ${arr(a.telefonlar_norm)}, ${q(a.email)})`
    )
    .join(',\n')
  return `-- Qaldirg'och: xususiy bandlik agentliklari reestri (${agencies.length} ta). Fayl scripts/import-agencies.mjs bilan HOSIL QILINGAN.
-- Manba: Migratsiya agentligi reestri, ${SOURCE_URL}
-- Reestr oxirgi yangilangan: ${updated}; skript ishga tushirilgan (tekshirilgan): ${checked}.
-- Supabase SQL Editor'da QO'LDA ishga tushiriladi (avval 0005_agencies.sql). Qayta ishga tushirsa ham xato bermaydi:
-- litsenziya raqami bo'yicha yangilanadi. Rahbar ismi va STIR saqlanmaydi.

insert into public.agencies
  (nomi, nomi_norm, litsenziya_raqami, litsenziya_sanasi, manzil, telefonlar, telefonlar_norm, email, manba_url, reestr_yangilangan, tekshirilgan)
select v.*, ${q(SOURCE_URL)}, ${q(updated)}::date, ${q(checked)}::date
from (values
${values}
) as v(nomi, nomi_norm, litsenziya_raqami, litsenziya_sanasi, manzil, telefonlar, telefonlar_norm, email)
on conflict (litsenziya_raqami) do update set
  nomi = excluded.nomi, nomi_norm = excluded.nomi_norm, litsenziya_sanasi = excluded.litsenziya_sanasi,
  manzil = excluded.manzil, telefonlar = excluded.telefonlar, telefonlar_norm = excluded.telefonlar_norm,
  email = excluded.email, manba_url = excluded.manba_url,
  reestr_yangilangan = excluded.reestr_yangilangan, tekshirilgan = excluded.tekshirilgan;
`
}

/** Hisobot: qatorlar soni, bo'sh maydonlar, takrorlar, tashlab yuborilgan paragraflar. */
export function buildReport(agencies, updated) {
  const empty = (k) => agencies.filter((a) => (Array.isArray(a[k]) ? a[k].length === 0 : !a[k]))
  const lic = agencies.map((a) => a.litsenziya_raqami).filter(Boolean)
  const dups = lic.filter((x, i) => lic.indexOf(x) !== i)
  const lines = [`Qatorlar: ${agencies.length} (kutilgan ${EXPECTED_ROWS})`, `Reestr yangilangan: ${updated}`, 'Bo‘sh maydonlar:']
  for (const k of ['nomi', 'litsenziya_raqami', 'litsenziya_sanasi', 'manzil', 'telefonlar', 'email']) {
    const e = empty(k)
    lines.push(`  ${k}: ${e.length}${e.length ? ' — ' + e.map((a) => a.nomi).join(' | ') : ''}`)
  }
  lines.push(`Takror litsenziya raqamlari: ${dups.length ? dups.join(', ') : 'yo‘q'}`)
  // Rahbar ismi hisobotga ham chiqmaydi; faqat telefonga o'xshamagan bo'laklar soni (0 bo'lishi kerak)
  const sk = agencies.filter((a) => a._skipped.length)
  lines.push(`Telefon deb tanilmagan bo‘laklar: ${sk.reduce((n, a) => n + a._skipped.length, 0)}${sk.length ? ' — qatorlar: ' + sk.map((a) => a.nomi).join(' | ') : ''}`)
  return lines.join('\n')
}

async function main() {
  const args = process.argv.slice(2)
  const fi = args.indexOf('--file')
  const html = fi >= 0 ? readFileSync(args[fi + 1], 'utf8') : await (await fetch(SOURCE_URL)).text()
  const { rows, updated } = parseRegistry(html)
  if (rows.length !== EXPECTED_ROWS) {
    console.error(`TO‘XTADI: reestrda ${rows.length} ta qator, ${EXPECTED_ROWS} kutilgan edi. Fayl yozilmadi.`)
    process.exit(1)
  }
  const agencies = rows.map(parseRow)
  const bad = agencies.filter((a) => !a.nomi || !a.litsenziya_raqami)
  console.log(buildReport(agencies, updated))
  if (bad.length) {
    console.error('TO‘XTADI: nomi yoki litsenziya raqami bo‘sh qator bor. Fayl yozilmadi.')
    process.exit(1)
  }
  const checked = new Date().toISOString().slice(0, 10)
  const out = resolve(dirname(fileURLToPath(import.meta.url)), '../supabase/seed/agencies.sql')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, buildSql(agencies, { updated, checked }))
  console.log(`Yozildi: ${out}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
