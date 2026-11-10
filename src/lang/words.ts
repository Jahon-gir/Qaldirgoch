import type { Exercise, Lesson } from '../content/german/types'
import type { VocabWord } from './types'

/** Barqaror qism lotin harflaridan (umlaut → ae/oe/ue, ß → ss), masalan "Guten Morgen" → "guten-morgen". Hangul kabi yozuv oʻchadi (boʻsh qator). */
export function wordSlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Soʻz id: modul + slug (berilgan boʻlsa — undan, aks holda term'dan). Bir marta berilgach oʻzgarmaydi (serverda saqlanadi). */
export const wordId = (moduleId: string, term: string, slug?: string) => `${moduleId}-${wordSlug(slug ?? term)}`

type Source = { lessons: readonly Lesson[]; exercisesOf: (lessonId: string) => Exercise[] }

const sorted = (lessons: readonly Lesson[]) => [...lessons].sort((a, b) => a.moduleId.localeCompare(b.moduleId) || a.order - b.order)

/** Lugʻat: darslardagi word mashqlaridan, modul → dars tartibida. Bir soʻz ikki darsda boʻlsa — birinchisi. */
export function buildVocab({ lessons, exercisesOf }: Source): VocabWord[] {
  const out: VocabWord[] = []
  const seen = new Set<string>()
  for (const l of sorted(lessons)) {
    for (const ex of exercisesOf(l.id)) {
      if (ex.type !== 'word') continue
      const id = wordId(l.moduleId, ex.term, ex.slug)
      if (seen.has(id)) continue
      seen.add(id)
      out.push({ id, moduleId: l.moduleId, lessonId: l.id, exerciseId: ex.id, term: ex.term, tr: ex.tr })
    }
  }
  return out
}

/** Dars tugaganda takrorlash qutisiga tushadigan soʻzlar id'lari. */
export function lessonWordIds({ lessons, exercisesOf }: Source, lessonId: string): string[] {
  const l = lessons.find((x) => x.id === lessonId)
  if (!l) return []
  return exercisesOf(l.id).flatMap((ex) => (ex.type === 'word' ? [wordId(l.moduleId, ex.term, ex.slug)] : []))
}

/** Kontent tekshiruvi: slug boʻsh chiqadigan soʻzlar (masalan Hangul, slug berilmagan). Kontent testi buni boʻsh boʻlishini talab qiladi. */
export function slugErrors({ lessons, exercisesOf }: Source): string[] {
  const out: string[] = []
  for (const l of lessons) for (const ex of exercisesOf(l.id)) if (ex.type === 'word' && wordSlug(ex.slug ?? ex.term) === '') out.push(`${ex.id}: "${ex.term}" — slug boʻsh (slug maydonini yozing)`)
  return out
}
