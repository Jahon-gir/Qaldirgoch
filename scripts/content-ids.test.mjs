/**
 * src/lang/ids.gen.json yasash: `npm run content:ids` (content:import buni oʻzi chaqiradi).
 * Oddiy `vitest run` da oʻtkazib yuboriladi; tenglik src/lang/ids.test.ts da tekshiriladi.
 * Vitest orqali — chunki kurs import.meta.glob bilan yuklanadi (oddiy Node buni bilmaydi).
 */
import { writeFileSync } from 'node:fs'
import { describe, it, vi } from 'vitest'

vi.unmock('../src/content/german/packs')

describe.skipIf(!process.env.UPDATE_CONTENT_IDS)('ids.gen.json', () => {
  it('yangilash', async () => {
    const { ALL_RESULT_IDS, COURSES } = await import('../src/lang/registry')
    const { lessonWordIds } = await import('../src/lang/words')
    // Ixcham shakl (0.29.1): modul → { dars qoʻshimchasi → "slug slug …" }; natija id'lari = shu darslar + `extra`
    const modules = {}
    const withWords = new Set()
    for (const c of COURSES) {
      for (const l of [...c.lessons].sort((a, b) => a.id.localeCompare(b.id))) {
        const words = lessonWordIds(c, l.id)
        if (!words.length) continue
        if (!l.id.startsWith(`${l.moduleId}-`)) throw new Error(`Dars id modul bilan boshlanmaydi: ${l.id}`)
        if (!ALL_RESULT_IDS.has(l.id)) throw new Error(`Soʻzli dars natija id'lari orasida yoʻq: ${l.id}`)
        const slugs = words.map((w) => {
          if (!w.startsWith(`${l.moduleId}-`)) throw new Error(`Soʻz id modul bilan boshlanmaydi: ${w}`)
          const s = w.slice(l.moduleId.length + 1)
          if (!s || /\s/.test(s)) throw new Error(`Soʻz slug'i boʻsh yoki boʻshliqli: ${w}`)
          return s
        })
        ;(modules[l.moduleId] ??= {})[l.id.slice(l.moduleId.length + 1)] = slugs.join(' ')
        withWords.add(l.id)
      }
    }
    const extra = [...ALL_RESULT_IDS].filter((id) => !withWords.has(id)).sort()
    writeFileSync(new URL('../src/lang/ids.gen.json', import.meta.url), JSON.stringify({ extra, modules }) + '\n')
  })
})
