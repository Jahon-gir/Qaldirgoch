import manifest from './ids.gen.json'

/**
 * Barcha kurslarning saqlanadigan natija va soʻz id'lari — kontentni yuklamasdan (0.28.0).
 * Provayderlar (localStorage/server maʼlumotini tozalash) ilova ochilishi bilan ishlaydi: ular endi butun nemis kursini
 * (10 ta paket, ~2,3 MB) kutmaydi — paketlar faqat til sahifasi ochilganda yuklanadi.
 * ids.gen.json — registry.ts dan yasalgan nusxa: `npm run content:ids` (content:import buni oʻzi chaqiradi);
 * ids.test.ts u registry bilan aynan tengligini tekshiradi (eskirsa test yiqiladi).
 */
/**
 * Ixcham shakl (0.29.1): `modules` — modul → { dars qoʻshimchasi ("l1") → "slug slug …" };
 * dars id = "<modul>-<qoʻshimcha>", soʻz id = "<modul>-<slug>". Natija id'lari = soʻzli darslar + `extra`
 * (testlar va soʻzsiz darslar).
 */
type Manifest = { extra: string[]; modules: Record<string, Record<string, string>> }
const M = manifest as Manifest

/** Dars → soʻz id'lari. */
const LESSON_WORDS: ReadonlyMap<string, readonly string[]> = new Map(
  Object.entries(M.modules).flatMap(([moduleId, lessons]) =>
    Object.entries(lessons).map(([suffix, slugs]) => [`${moduleId}-${suffix}`, slugs.split(' ').map((s) => `${moduleId}-${s}`)] as const)
  )
)

export const ALL_RESULT_IDS: ReadonlySet<string> = new Set([...M.extra, ...LESSON_WORDS.keys()])
export const ALL_WORD_IDS: ReadonlySet<string> = new Set([...LESSON_WORDS.values()].flat())

/** Dars (istalgan kurs) tugaganda takrorlash qutisiga tushadigan soʻzlar id'lari; notanish dars — boʻsh. */
export const wordIdsOfAnyLesson = (lessonId: string): string[] => [...(LESSON_WORDS.get(lessonId) ?? [])]
