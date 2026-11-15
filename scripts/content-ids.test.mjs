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
    const lessons = {}
    for (const c of COURSES) {
      for (const l of [...c.lessons].sort((a, b) => a.id.localeCompare(b.id))) {
        const words = lessonWordIds(c, l.id)
        if (!words.length) continue
        for (const w of words) if (!w.startsWith(`${l.moduleId}-`)) throw new Error(`Soʻz id modul bilan boshlanmaydi: ${w}`)
        lessons[l.id] = [l.moduleId, ...words.map((w) => w.slice(l.moduleId.length + 1))]
      }
    }
    writeFileSync(new URL('../src/lang/ids.gen.json', import.meta.url), JSON.stringify({ results: [...ALL_RESULT_IDS].sort(), lessons }) + '\n')
  })
})
