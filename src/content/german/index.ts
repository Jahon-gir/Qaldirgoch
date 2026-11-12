import { A1_M1_L1 } from './a1-m1-l1'
import { A1_M1_L2 } from './a1-m1-l2'
import { A1_M1_L3 } from './a1-m1-l3'
import { A1_M1_L4 } from './a1-m1-l4'
import { A1_M1_L5 } from './a1-m1-l5'
import { A1_M1_L6 } from './a1-m1-l6'
import { l3, REVIEW } from './helpers'
import { DE_PACK_COURSE } from './packs'
import { LEVELS, type GermanExercise, type Lesson, type Module } from './types'

export * from './types'

/**
 * Nemis tili kontenti (statik import: tez va oflayn). Bu versiyadagi barcha darslar "review" — tekshiruvda.
 * Tartib: daraja → modul → dars → mashq. Matn uch tilda; kirill matn qoʻlda yozilgan (translit emas).
 */
/** Asosiy kurs modullari (qoʻlda yozilgan darslar). */
export const BASE_MODULES: Module[] = [
  { id: 'a1-m1', level: 'A1', direction: 'general', order: 1, status: REVIEW, title: l3('Salomlashish va tanishuv', 'Саломлашиш ва танишув', 'Приветствие и знакомство') },
  { id: 'a1-m2', level: 'A1', direction: 'general', order: 2, status: 'draft', title: l3('Raqamlar va vaqt', 'Рақамлар ва вақт', 'Числа и время') },
  { id: 'a1-m3', level: 'A1', direction: 'technical', order: 3, status: 'draft', title: l3('Ish joyida', 'Иш жойида', 'На рабочем месте') }
]

const lesson = (n: number, kind: Lesson['kind'], minutes: number, title: Lesson['title']): Lesson => ({ id: `a1-m1-l${n}`, moduleId: 'a1-m1', title, kind, minutes, order: n })

export const BASE_LESSONS: Lesson[] = [
  lesson(1, 'words', 5, l3('Salomlashish', 'Саломлашиш', 'Приветствия')),
  lesson(2, 'words', 5, l3('Xayrlashish', 'Хайрлашиш', 'Прощание')),
  lesson(3, 'grammar', 7, l3('Oʻzingizni tanishtiring', 'Ўзингизни таништиринг', 'Представьтесь')),
  lesson(4, 'phrases', 8, l3('Ismingiz va kasbingiz', 'Исмингиз ва касбингиз', 'Ваше имя и профессия')),
  lesson(5, 'phrases', 8, l3('Kimligingizni soʻrash', 'Кимлигингизни сўраш', 'Узнаём, кто вы')),
  lesson(6, 'test', 6, l3('Modul testi', 'Модул тести', 'Тест модуля'))
]

const BASE_EXERCISES: Record<string, GermanExercise[]> = {
  'a1-m1-l1': A1_M1_L1,
  'a1-m1-l2': A1_M1_L2,
  'a1-m1-l3': A1_M1_L3,
  'a1-m1-l4': A1_M1_L4,
  'a1-m1-l5': A1_M1_L5,
  'a1-m1-l6': A1_M1_L6
}

/** Barcha modullar: asosiy + kasbiy paketlar (src/content/packs/de/*.json, 0.12.1). */
export const MODULES: Module[] = [...BASE_MODULES, ...DE_PACK_COURSE.modules]
export const LESSONS: Lesson[] = [...BASE_LESSONS, ...DE_PACK_COURSE.lessons]
const EXERCISES: Record<string, GermanExercise[]> = { ...BASE_EXERCISES, ...(DE_PACK_COURSE.exercises as Record<string, GermanExercise[]>) }

export const exercisesOf = (lessonId: string): GermanExercise[] => EXERCISES[lessonId] ?? []
export const lessonById = (id: string) => LESSONS.find((l) => l.id === id)
export const moduleById = (id: string) => MODULES.find((m) => m.id === id)
export const LESSON_IDS: ReadonlySet<string> = new Set(LESSONS.map((l) => l.id))

/** Yakuniy test natijalari ham user_lessons da saqlanadi: "test:<modul id>" va "test:level-<daraja>". Dars deb sanalmaydi. */
export const testResultId = (scope: string) => `test:${scope}`
export const TEST_IDS: ReadonlySet<string> = new Set([...MODULES.map((m) => testResultId(m.id)), ...LEVELS.map((lv) => testResultId(`level-${lv}`))])
/** Saqlanadigan natija id'lari: darslar + testlar. */
export const RESULT_IDS: ReadonlySet<string> = new Set([...LESSON_IDS, ...TEST_IDS])
