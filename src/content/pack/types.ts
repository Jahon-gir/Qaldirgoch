import type { ContentImage, ContentStatus, L3 } from '../german/types'

/**
 * Kasbiy kontent paketi (0.12.0): bitta til + bitta soha (yoʻnalish) = bitta JSON fayl
 * src/content/packs/<til>/<soha>.json. Excel shablondan `npm run content:import` bilan hosil qilinadi.
 * Hozircha ilovaga ULANMAGAN (ekranga chiqishi keyingi PR'larda).
 */
export const PACK_SCHEMA = 1

export type PackSituation = {
  /** Soha ichida barqaror id: kichik lotin harf, raqam, chiziqcha ("birinchi-kun"). */
  id: string
  title: L3
  order: number
  level: string
}

export type PackWord = {
  /** Barqaror soʻz id'si: <kurs prefiksi><soha>-<vaziyat>-<slug>. Serverda saqlanadi — oʻzgarmaydi. */
  id: string
  slug: string
  /** Ilovadagi koʻrinish: nemischa otda artikl bilan ("der Hammer") — mavjud Artikl mashqi shunday ishlaydi. */
  term: string
  /** Tabler ikonka nomi (LESSON_ICONS kalitlaridan); rasm boʻlmasa koʻrsatiladi. Boʻlmasa — 'abc'. */
  icon?: string
  article?: 'der' | 'die' | 'das'
  plural?: string
  tr: L3
  pron?: L3
  level: string
  field: string
  jobs: string[]
  situation: string
  example?: { term: string; tr: L3 }
  safety: boolean
  image?: ContentImage
  /** public/ ichidagi yoʻl. Boʻlmasa ilova mavjud ovozdan (speechSynthesis) foydalanadi. */
  audio?: string
  source?: string
  status: ContentStatus
  verifiedBy?: string
  /** YYYY-MM-DD */
  verifiedAt?: string
}

export type ContentPack = {
  schema: typeof PACK_SCHEMA
  course: string
  field: string
  title: L3
  order: number
  situations: PackSituation[]
  words: PackWord[]
}

/** Kurs qoidalari (import va tekshiruv uchun). */
export type PackRules = {
  course: string
  /** Soʻz id prefiksi: nemischa — boʻsh, koreyscha — "ko-". */
  prefix: string
  fields: readonly string[]
  levels: readonly string[]
  /** Nemischa: artikl va koʻplik ustunlari ishlaydi. */
  article: boolean
  /** Lotin boʻlmagan yozuv: slug majburiy va oʻqilishi qoralamada ham majburiy. (Qoralamadan boshqa holatda oʻqilishi hamma kursda majburiy — dars kartasida koʻrsatiladi.) */
  pron: boolean
}

export type Issue = { level: 'error' | 'warning'; where: string; message: string }

/** Fayl haqida maʼlumot (skriptda fs bilan; testda soxta). null — fayl yoʻq. */
export type FileInfo = (publicPath: string) => { size: number } | null
