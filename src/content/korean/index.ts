import type { Exercise, Lesson, Module } from '../german/types'
import { l3 } from './helpers'
import { KO_H_M1_L1 } from './ko-h-m1-l1'
import { KO_H_M1_L2 } from './ko-h-m1-l2'
import { KO_H_M1_L3 } from './ko-h-m1-l3'
import { KO_H_M1_L4 } from './ko-h-m1-l4'
import { KO_H_M1_L5 } from './ko-h-m1-l5'
import { KO_H_M1_L6 } from './ko-h-m1-l6'

/**
 * Koreys tili kontenti. BARCHA id'lar "ko-" prefiksli (nemischa id'lar bilan toʻqnashmaydi; src/lang/types.ts).
 * Darajalar: ko-H (Hangul), ko-T1 (TOPIK 1, darslar hali yoʻq), ko-T2 (qulf).
 * Darsi bor modul — "review" (tekshiruvda), darssiz — "draft" (ekranda "Tez orada").
 */
export const KO_LEVELS = [
  { id: 'ko-H', locked: false, label: l3('Hangul', 'Ҳангул', 'Хангыль') },
  { id: 'ko-T1', locked: false, label: l3('TOPIK 1', 'TOPIK 1', 'TOPIK 1') },
  { id: 'ko-T2', locked: true, label: l3('TOPIK 2', 'TOPIK 2', 'TOPIK 2') }
] as const

const t1 = (n: number, title: Module['title']): Module => ({ id: `ko-t1-m${n}`, level: 'ko-T1', direction: 'general', order: n, status: 'draft', title })

export const KO_MODULES: Module[] = [
  { id: 'ko-h-m1', level: 'ko-H', direction: 'general', order: 1, status: 'review', title: l3('Harflar', 'Ҳарфлар', 'Буквы') },
  { id: 'ko-h-m2', level: 'ko-H', direction: 'general', order: 2, status: 'draft', title: l3('Oʻqish qoidalari', 'Ўқиш қоидалари', 'Правила чтения') },
  t1(1, l3('Salomlashish va tanishuv', 'Саломлашиш ва танишув', 'Приветствие и знакомство')),
  t1(2, l3('Raqamlar va vaqt', 'Рақамлар ва вақт', 'Числа и время')),
  t1(3, l3('Oʻzim va oilam', 'Ўзим ва оилам', 'Я и моя семья')),
  t1(4, l3('Kundalik hayot: xarid, narx', 'Кундалик ҳаёт: харид, нарх', 'Повседневная жизнь: покупки, цены')),
  t1(5, l3('Ovqat va oshxona', 'Овқат ва ошхона', 'Еда и кухня')),
  t1(6, l3('Shahar va transport', 'Шаҳар ва транспорт', 'Город и транспорт')),
  t1(7, l3('Ish joyida: asboblar va xavfsizlik belgilari', 'Иш жойида: асбоблар ва хавфсизлик белгилари', 'На работе: инструменты и знаки безопасности')),
  t1(8, l3('Imtihonga tayyorgarlik (TOPIK I va EPS-TOPIK)', 'Имтиҳонга тайёргарлик (TOPIK I ва EPS-TOPIK)', 'Подготовка к экзамену (TOPIK I и EPS-TOPIK)'))
]

const lesson = (n: number, kind: Lesson['kind'], minutes: number, title: Lesson['title']): Lesson => ({ id: `ko-h-m1-l${n}`, moduleId: 'ko-h-m1', title, kind, minutes, order: n })

export const KO_LESSONS: Lesson[] = [
  lesson(1, 'letters', 6, l3('Oddiy unlilar', 'Оддий унлилар', 'Простые гласные')),
  lesson(2, 'letters', 8, l3('Asosiy undoshlar', 'Асосий ундошлар', 'Основные согласные')),
  lesson(3, 'letters', 7, l3('Boʻgʻin yasash', 'Бўғин ясаш', 'Как строится слог')),
  lesson(4, 'letters', 6, l3('Nafasli undoshlar', 'Нафасли ундошлар', 'Придыхательные согласные')),
  lesson(5, 'letters', 7, l3('Y-li unlilar va ㅐ ㅔ', 'Й-ли унлилар ва ㅐ ㅔ', 'Йотированные гласные и ㅐ ㅔ')),
  lesson(6, 'test', 6, l3('Modul testi', 'Модул тести', 'Тест модуля'))
]

const EXERCISES: Record<string, Exercise[]> = {
  'ko-h-m1-l1': KO_H_M1_L1,
  'ko-h-m1-l2': KO_H_M1_L2,
  'ko-h-m1-l3': KO_H_M1_L3,
  'ko-h-m1-l4': KO_H_M1_L4,
  'ko-h-m1-l5': KO_H_M1_L5,
  'ko-h-m1-l6': KO_H_M1_L6
}

export const koExercisesOf = (lessonId: string): Exercise[] => EXERCISES[lessonId] ?? []
