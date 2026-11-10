import type { CourseId } from './types'

/**
 * Kurs sahifalari manzillari. Nemischa ichki manzillar AVVALGIDEK (/til/dars/:id, /til/modul/:id, /til/takrorlash,
 * /til/lugat, /til/test/:scope) — eski havolalar ishlayveradi; faqat kurs ekrani /til/de. Boshqa kurslar: /til/<id>/...
 */
export type CoursePaths = {
  home: string
  module: (id: string) => string
  lesson: (id: string) => string
  review: string
  vocab: string
  vocabLesson: (id: string) => string
  test: (scope: string) => string
}

export function coursePaths(id: CourseId): CoursePaths {
  const base = id === 'de' ? '/til' : `/til/${id}`
  return {
    home: `/til/${id}`,
    module: (m) => `${base}/modul/${m}`,
    lesson: (l) => `${base}/dars/${l}`,
    review: `${base}/takrorlash`,
    vocab: `${base}/lugat`,
    vocabLesson: (l) => `${base}/lugat/${l}`,
    test: (s) => `${base}/test/${s}`
  }
}
