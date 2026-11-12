import { describe, expect, it } from 'vitest'
import { KO_LEVELS } from '../korean'
import { LEVELS } from '../german/types'
import { ALL_WORD_IDS } from '../../lang/registry'
import { LESSON_ICON_NAMES } from '../../components/german/iconNames'
import { PACK_RULES } from './rules'
import { validatePacks } from './validate'
import type { ContentPack } from './types'

/** Repodagi barcha paketlar (src/content/packs/<til>/<soha>.json). Hozircha ilovaga ulanmagan. */
const files = import.meta.glob<ContentPack>('../packs/*/*.json', { eager: true, import: 'default' })
const byCourse = new Map<string, ContentPack[]>()
for (const [path, pack] of Object.entries(files)) {
  const course = path.split('/').slice(-2)[0]
  byCourse.set(course, [...(byCourse.get(course) ?? []), pack])
}

describe('kasbiy kontent paketlari', () => {
  it('har bir paket qoidalarga mos (rasm/audio fayllari content:check skriptida tekshiriladi)', () => {
    for (const [course, packs] of byCourse) {
      const rules = PACK_RULES[course]
      expect(rules, `nomaʼlum til papkasi: ${course}`).toBeDefined()
      expect(validatePacks(packs, rules).filter((i) => i.level === 'error')).toEqual([])
    }
  })

  it('paket soʻzlari oʻzaro takrorlanmaydi', () => {
    const ids = [...byCourse.values()].flat().flatMap((p) => p.words.map((w) => w.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ilovaga chiqqan paket soʻzlari lugʻatda aynan paket id si bilan (progress shu id bilan saqlanadi)', () => {
    const live = [...byCourse.values()].flat().flatMap((p) => p.words.filter((w) => w.status !== 'draft').map((w) => w.id))
    expect(live.filter((id) => !ALL_WORD_IDS.has(id))).toEqual([])
  })

  it('ikonkalar darslar roʻyxatida bor (aks holda umumiy belgi chiqadi)', () => {
    const bad = [...byCourse.values()].flat().flatMap((p) => p.words.filter((w) => w.icon && !LESSON_ICON_NAMES.has(w.icon)).map((w) => `${w.id}: ${w.icon}`))
    expect(bad).toEqual([])
  })
})

describe('import qoidalari kurslar bilan mos', () => {
  it('nemis darajalari: kursdagi A1, A2, B1 + Pflege uchun B2', () => {
    expect(PACK_RULES.de.levels).toEqual([...LEVELS, 'B2'])
  })
  it('koreys darajalari KO_LEVELS bilan bir xil', () => {
    expect(PACK_RULES.ko.levels).toEqual(KO_LEVELS.map((l) => l.id))
  })
  it('nemischa id prefikssiz, koreyscha "ko-" (registry.courseIdOfWord bilan mos)', () => {
    expect(PACK_RULES.de.prefix).toBe('')
    expect(PACK_RULES.ko.prefix).toBe('ko-')
  })
})
