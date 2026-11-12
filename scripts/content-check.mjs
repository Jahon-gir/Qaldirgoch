#!/usr/bin/env node
/**
 * Tayyor JSON paketlarni (src/content/packs/<til>/*.json) Excel'siz tekshiradi: import bilan bir xil qoidalar
 * + public/ dagi rasm va audio fayllar. `npm run content:check` keyin vitest bilan ilovadagi mavjud soʻz id'lariga
 * toʻqnashuvni ham tekshiradi (src/content/pack/packs.test.ts).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rulesOf } from '../src/content/pack/rules.ts'
import { packReport, validatePacks } from '../src/content/pack/validate.ts'
import { PACKS_DIR, ROOT, printIssues, publicFileInfo } from './content-import.mjs'

export function checkPacks(dir = PACKS_DIR, root = ROOT) {
  const issues = []
  const all = []
  if (!existsSync(dir)) return { issues, packs: all }
  for (const course of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    const rules = rulesOf(course)
    if (!rules) {
      issues.push({ level: 'error', where: `packs/${course}`, message: `nomaʼlum til papkasi (mumkin: de, ko)` })
      continue
    }
    const packs = []
    for (const f of readdirSync(join(dir, course)).filter((f) => f.endsWith('.json')).sort()) {
      try {
        const p = JSON.parse(readFileSync(join(dir, course, f), 'utf8'))
        if (`${p.field}.json` !== f) issues.push({ level: 'error', where: `${course}/${f}`, message: `fayl nomi soha nomiga (${p.field}.json) teng emas` })
        packs.push(p)
      } catch (e) {
        issues.push({ level: 'error', where: `${course}/${f}`, message: `JSON oʻqilmadi: ${e.message}` })
      }
    }
    issues.push(...validatePacks(packs, rules, { fileInfo: publicFileInfo(root) }))
    all.push(...packs)
  }
  return { issues, packs: all }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { issues, packs } = checkPacks()
  const n = printIssues(issues)
  for (const l of packReport(packs)) console.log(l)
  if (n.errors) {
    console.error(`\n${n.errors} ta xato.`)
    process.exit(1)
  }
  console.log(packs.length ? `\nFayllar tekshiruvi oʻtdi (${packs.length} ta paket).` : '\nPaketlar hali yoʻq (src/content/packs/) — tekshiradigan narsa yoʻq.')
}
