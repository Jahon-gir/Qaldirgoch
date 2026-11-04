import { A1_M1_L1 } from './a1-m1-l1'
import { A1_M1_L2 } from './a1-m1-l2'
import { A1_M1_L3 } from './a1-m1-l3'
import { A1_M1_L4 } from './a1-m1-l4'
import { A1_M1_L5 } from './a1-m1-l5'
import { A1_M1_L6 } from './a1-m1-l6'
import { l3, REVIEW } from './helpers'
import type { Exercise, Lesson, Module } from './types'

export * from './types'

/**
 * Nemis tili kontenti (statik import: tez va oflayn). Bu versiyadagi barcha darslar "review" — tekshiruvda.
 * Tartib: daraja → modul → dars → mashq. Matn uch tilda; kirill matn qoʻlda yozilgan (translit emas).
 */
export const MODULES: Module[] = [
  { id: 'a1-m1', level: 'A1', direction: 'general', order: 1, status: REVIEW, title: l3('Salomlashish va tanishuv', 'Саломлашиш ва танишув', 'Приветствие и знакомство') },
  { id: 'a1-m2', level: 'A1', direction: 'general', order: 2, status: 'draft', title: l3('Raqamlar va vaqt', 'Рақамлар ва вақт', 'Числа и время') },
  { id: 'a1-m3', level: 'A1', direction: 'technical', order: 3, status: 'draft', title: l3('Ish joyida', 'Иш жойида', 'На рабочем месте') }
]

const lesson = (n: number, kind: Lesson['kind'], minutes: number, title: Lesson['title']): Lesson => ({ id: `a1-m1-l${n}`, moduleId: 'a1-m1', title, kind, minutes, order: n })

export const LESSONS: Lesson[] = [
  lesson(1, 'words', 5, l3('Salomlashish', 'Саломлашиш', 'Приветствия')),
  lesson(2, 'words', 5, l3('Xayrlashish', 'Хайрлашиш', 'Прощание')),
  lesson(3, 'grammar', 7, l3('Oʻzingizni tanishtiring', 'Ўзингизни таништиринг', 'Представьтесь')),
  lesson(4, 'phrases', 8, l3('Ismingiz va kasbingiz', 'Исмингиз ва касбингиз', 'Ваше имя и профессия')),
  lesson(5, 'phrases', 8, l3('Kimligingizni soʻrash', 'Кимлигингизни сўраш', 'Узнаём, кто вы')),
  lesson(6, 'test', 6, l3('Modul testi', 'Модул тести', 'Тест модуля'))
]

const EXERCISES: Record<string, Exercise[]> = {
  'a1-m1-l1': A1_M1_L1,
  'a1-m1-l2': A1_M1_L2,
  'a1-m1-l3': A1_M1_L3,
  'a1-m1-l4': A1_M1_L4,
  'a1-m1-l5': A1_M1_L5,
  'a1-m1-l6': A1_M1_L6
}

export const exercisesOf = (lessonId: string): Exercise[] => EXERCISES[lessonId] ?? []
export const lessonById = (id: string) => LESSONS.find((l) => l.id === id)
export const moduleById = (id: string) => MODULES.find((m) => m.id === id)
export const LESSON_IDS: ReadonlySet<string> = new Set(LESSONS.map((l) => l.id))
