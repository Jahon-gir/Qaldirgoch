import type { Exercise, Lesson, Module } from '../german/types'
import { l3 } from './helpers'
import { KO_H_M1_L1 } from './ko-h-m1-l1'
import { KO_H_M1_L2 } from './ko-h-m1-l2'
import { KO_H_M1_L3 } from './ko-h-m1-l3'
import { KO_H_M1_L4 } from './ko-h-m1-l4'
import { KO_H_M1_L5 } from './ko-h-m1-l5'
import { KO_H_M1_L6 } from './ko-h-m1-l6'
import { KO_H_M2_L1 } from './ko-h-m2-l1'
import { KO_H_M2_L2 } from './ko-h-m2-l2'
import { KO_H_M2_L3 } from './ko-h-m2-l3'
import { KO_H_M2_L4 } from './ko-h-m2-l4'
import { KO_H_M2_L5 } from './ko-h-m2-l5'
import { KO_H_M2_L6 } from './ko-h-m2-l6'

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
  { id: 'ko-h-m2', level: 'ko-H', direction: 'general', order: 2, status: 'review', title: l3('Oʻqish qoidalari', 'Ўқиш қоидалари', 'Правила чтения') },
  t1(1, l3('Salomlashish va tanishuv', 'Саломлашиш ва танишув', 'Приветствие и знакомство')),
  t1(2, l3('Raqamlar va vaqt', 'Рақамлар ва вақт', 'Числа и время')),
  t1(3, l3('Oʻzim va oilam', 'Ўзим ва оилам', 'Я и моя семья')),
  t1(4, l3('Kundalik hayot: xarid, narx', 'Кундалик ҳаёт: харид, нарх', 'Повседневная жизнь: покупки, цены')),
  t1(5, l3('Ovqat va oshxona', 'Овқат ва ошхона', 'Еда и кухня')),
  t1(6, l3('Shahar va transport', 'Шаҳар ва транспорт', 'Город и транспорт')),
  t1(7, l3('Ish joyida: asboblar va xavfsizlik belgilari', 'Иш жойида: асбоблар ва хавфсизлик белгилари', 'На работе: инструменты и знаки безопасности')),
  t1(8, l3('Imtihonga tayyorgarlik (TOPIK I va EPS-TOPIK)', 'Имтиҳонга тайёргарлик (TOPIK I ва EPS-TOPIK)', 'Подготовка к экзамену (TOPIK I и EPS-TOPIK)'))
]

const lesson = (moduleId: string, n: number, kind: Lesson['kind'], minutes: number, title: Lesson['title']): Lesson => ({ id: `${moduleId}-l${n}`, moduleId, title, kind, minutes, order: n })
const m1 = (n: number, kind: Lesson['kind'], minutes: number, title: Lesson['title']) => lesson('ko-h-m1', n, kind, minutes, title)
const m2 = (n: number, kind: Lesson['kind'], minutes: number, title: Lesson['title']) => lesson('ko-h-m2', n, kind, minutes, title)

export const KO_LESSONS: Lesson[] = [
  m1(1, 'letters', 6, l3('Oddiy unlilar', 'Оддий унлилар', 'Простые гласные')),
  m1(2, 'letters', 8, l3('Asosiy undoshlar', 'Асосий ундошлар', 'Основные согласные')),
  m1(3, 'letters', 7, l3('Boʻgʻin yasash', 'Бўғин ясаш', 'Как строится слог')),
  m1(4, 'letters', 6, l3('Nafasli undoshlar', 'Нафасли ундошлар', 'Придыхательные согласные')),
  m1(5, 'letters', 7, l3('Y-li unlilar va ㅐ ㅔ', 'Й-ли унлилар ва ㅐ ㅔ', 'Йотированные гласные и ㅐ ㅔ')),
  m1(6, 'test', 6, l3('Modul testi', 'Модул тести', 'Тест модуля')),
  m2(1, 'letters', 8, l3('Qattiq undoshlar', 'Қаттиқ ундошлар', 'Напряжённые согласные')),
  m2(2, 'letters', 8, l3('Murakkab unlilar', 'Мураккаб унлилар', 'Сложные гласные')),
  m2(3, 'letters', 10, l3('Pastki harf (batchim)', 'Пастки ҳарф (батчим)', 'Нижняя буква (патчим)')),
  m2(4, 'letters', 8, l3('Bogʻlanib oʻqish', 'Боғланиб ўқиш', 'Слитное чтение')),
  m2(5, 'letters', 8, l3('Birinchi soʻzlar va belgilar', 'Биринчи сўзлар ва белгилар', 'Первые слова и надписи')),
  m2(6, 'test', 8, l3('Modul testi', 'Модул тести', 'Тест модуля'))
]

const EXERCISES: Record<string, Exercise[]> = {
  'ko-h-m1-l1': KO_H_M1_L1,
  'ko-h-m1-l2': KO_H_M1_L2,
  'ko-h-m1-l3': KO_H_M1_L3,
  'ko-h-m1-l4': KO_H_M1_L4,
  'ko-h-m1-l5': KO_H_M1_L5,
  'ko-h-m1-l6': KO_H_M1_L6,
  'ko-h-m2-l1': KO_H_M2_L1,
  'ko-h-m2-l2': KO_H_M2_L2,
  'ko-h-m2-l3': KO_H_M2_L3,
  'ko-h-m2-l4': KO_H_M2_L4,
  'ko-h-m2-l5': KO_H_M2_L5,
  'ko-h-m2-l6': KO_H_M2_L6
}

export const koExercisesOf = (lessonId: string): Exercise[] => EXERCISES[lessonId] ?? []
