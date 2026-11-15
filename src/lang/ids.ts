import manifest from './ids.gen.json'

/**
 * Barcha kurslarning saqlanadigan natija va soʻz id'lari — kontentni yuklamasdan (0.28.0).
 * Provayderlar (localStorage/server maʼlumotini tozalash) ilova ochilishi bilan ishlaydi: ular endi butun nemis kursini
 * (10 ta paket, ~2,3 MB) kutmaydi — paketlar faqat til sahifasi ochilganda yuklanadi.
 * ids.gen.json — registry.ts dan yasalgan nusxa: `npm run content:ids` (content:import buni oʻzi chaqiradi);
 * ids.test.ts u registry bilan aynan tengligini tekshiradi (eskirsa test yiqiladi).
 */
type Manifest = { results: string[]; lessons: Record<string, string[]> }
const M = manifest as Manifest

/** Dars → [modul id, ...soʻz slug'lari]; soʻz id = "<modul>-<slug>". */
const LESSON_WORDS: ReadonlyMap<string, readonly string[]> = new Map(
  Object.entries(M.lessons).map(([lessonId, [moduleId, ...slugs]]) => [lessonId, slugs.map((s) => `${moduleId}-${s}`)])
)

export const ALL_RESULT_IDS: ReadonlySet<string> = new Set(M.results)
export const ALL_WORD_IDS: ReadonlySet<string> = new Set([...LESSON_WORDS.values()].flat())

/** Dars (istalgan kurs) tugaganda takrorlash qutisiga tushadigan soʻzlar id'lari; notanish dars — boʻsh. */
export const wordIdsOfAnyLesson = (lessonId: string): string[] => [...(LESSON_WORDS.get(lessonId) ?? [])]
