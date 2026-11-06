/**
 * Gapda boʻsh joyni toʻldirish (yakuniy test uchun). B2+ tekshiruvchi koʻrishi kerak (CLAUDE.md 5).
 * QOIDA: yangi nemis gapi yoki soʻz oʻylab topilmaydi — faqat darslardagi mavjud gaplar, aynan shu koʻrinishda.
 * Tarjima darsdan olinadi (ikkinchi nusxa yozilmaydi): gap toʻliq holda darsdagi soʻz, misol, variant yoki juft matnidan qidiriladi.
 */
import { exercisesOf } from './index'
import type { ContentStatus, L3 } from './types'
import { WORD_IDS, wordId } from './words'

export type GapItem = {
  id: string
  moduleId: string
  /** Darsdagi gap, aynan shunday; boʻsh joy "___". */
  sentence: string
  answer: string
  /** Yozish rejimida qoʻshimcha toʻgʻri javoblar. */
  accept?: string[]
  /** ANIQ notoʻgʻri, faqat darslardagi soʻzlar. */
  distractors: [string, string]
  /** Darsdagi tarjima (tarjima javobni bir maʼnoli qiladi). */
  tr: L3
  /** Gap lugʻatda (VOCAB) boʻlsa — uning id'si. */
  wordId?: string
  /** Qaysi darsdan olingan. */
  lessonId: string
}

export const GAPS_STATUS: ContentStatus = 'review'

/** Darsdagi barcha (nemischa → tarjima) juftlar: soʻz, misol gap, toʻldirilgan variant gap, juftlash. */
export function lessonPhrases(lessonId: string): { de: string; tr: L3 }[] {
  return exercisesOf(lessonId).flatMap((ex) => {
    if (ex.type === 'word') return [{ de: ex.de, tr: ex.tr }, { de: ex.example.de, tr: ex.example.tr }]
    if (ex.type === 'choice') return [{ de: ex.full, tr: ex.translation }]
    return ex.pairs.map((p) => ({ de: p.de, tr: p.tr }))
  })
}

export const fullSentence = (g: Pick<GapItem, 'sentence' | 'answer'>) => g.sentence.replace('___', g.answer)

type Raw = Omit<GapItem, 'tr' | 'wordId' | 'moduleId'>
function gap(r: Raw): GapItem {
  const full = fullSentence(r)
  const found = lessonPhrases(r.lessonId).find((p) => p.de === full)
  if (!found) throw new Error(`gaps: "${full}" ${r.lessonId} darsida topilmadi`)
  const moduleId = r.lessonId.replace(/-l\d+$/, '')
  const id = wordId(moduleId, full)
  return { ...r, moduleId, tr: found.tr, wordId: WORD_IDS.has(id) ? id : undefined }
}

export const GAPS: GapItem[] = [
  gap({ id: 'g1', lessonId: 'a1-m1-l5', sentence: 'Ich ___ aus Usbekistan.', answer: 'komme', distractors: ['heiße', 'Sie'] }),
  gap({ id: 'g2', lessonId: 'a1-m1-l3', sentence: 'Ich ___ Anna.', answer: 'heiße', accept: ['bin'], distractors: ['komme', 'Sie'] }),
  gap({ id: 'g3', lessonId: 'a1-m1-l1', sentence: 'Guten ___, Frau Schmidt!', answer: 'Morgen', distractors: ['Nacht', 'Tschüss'] }),
  gap({ id: 'g4', lessonId: 'a1-m1-l2', sentence: 'Bis ___, Anna!', answer: 'morgen', distractors: ['Nacht', 'heiße'] }),
  gap({ id: 'g5', lessonId: 'a1-m1-l4', sentence: 'Wie ___ Sie?', answer: 'heißen', distractors: ['komme', 'bin'] }),
  gap({ id: 'g6', lessonId: 'a1-m1-l5', sentence: '___ kommen Sie?', answer: 'Woher', distractors: ['Ich', 'Guten'] }),
  gap({ id: 'g7', lessonId: 'a1-m1-l4', sentence: 'Ich ___ Elektriker.', answer: 'bin', distractors: ['komme', 'Sie'] }),
  gap({ id: 'g8', lessonId: 'a1-m1-l5', sentence: 'Mir ___ es gut, danke.', answer: 'geht', distractors: ['bin', 'heiße'] }),
  gap({ id: 'g9', lessonId: 'a1-m1-l2', sentence: 'Gute ___, Anna!', answer: 'Nacht', distractors: ['Morgen', 'Tag'] }),
  gap({ id: 'g10', lessonId: 'a1-m1-l2', sentence: 'Auf ___, Herr Müller!', answer: 'Wiedersehen', distractors: ['Nacht', 'Tag'] })
]

export const gapById = (id: string) => GAPS.find((g) => g.id === id)
