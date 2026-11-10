import type { Course, CourseDef } from './types'
import { lessonWordIds } from './words'

/** Kurs taʼrifiga qidiruv funksiyalarini qoʻshadi (bir marta, Map bilan). */
export function makeCourse(def: CourseDef): Course {
  const modules = new Map(def.modules.map((m) => [m.id, m]))
  const lessons = new Map(def.lessons.map((l) => [l.id, l]))
  const words = new Map(def.vocab.map((w) => [w.id, w]))
  const byExercise = new Map(def.vocab.map((w) => [w.exerciseId, w]))
  const gaps = new Map(def.gaps.map((g) => [g.id, g]))
  return {
    ...def,
    moduleById: (id) => modules.get(id),
    lessonById: (id) => lessons.get(id),
    wordById: (id) => words.get(id),
    wordOfExercise: (id) => byExercise.get(id),
    gapById: (id) => gaps.get(id),
    wordIdsOfLesson: (id) => lessonWordIds(def, id)
  }
}
