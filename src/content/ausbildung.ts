import type { Key } from '../i18n/uz'

/**
 * Germaniya · Ausbildung yoʻli: 10 bosqich (TZ 3 va 4.2). Matnlar lugʻatda (i18n), bu yerda faqat kalitlar.
 * QOIDA (CLAUDE.md, 5–6): tasdiqlanmagan raqam, muddat yoki havola yozilmaydi — ular null boʻladi
 * va ekranda "Tekshiruvda" chiqadi. Valyuta EUR'da qoladi (kurs tasdiqlanmagan).
 */
export type Source = { title: string; url: string; checkedAt: string }

export type Step = {
  id: StepId
  order: number
  title: Key
  summary: Key
  cost?: { amount: number; currency: 'EUR'; note: Key; upTo?: boolean } | null
  duration?: Key | null
  tasks: { id: string; text: Key }[]
  documents: { id: string; text: Key }[]
  /** Muhim tasdiqlangan faktlar (maʼlumot bloki). */
  facts?: Key[]
  /** Xavf (firibgarlik) ogohlantirishi: faqat xavf bor bosqichda. */
  warning?: Key
  /** Boshqa modulga havola; ready=false boʻlsa "Tez orada" koʻrsatiladi. */
  module?: { label: Key; to: string; ready: boolean }
  sources: Source[]
}

export const STEP_IDS = ['profil', 'yol', 'nemis', 'sertifikat', 'hujjatlar', 'joy', 'shartnoma', 'viza', 'jonash', 'germaniyada'] as const
export type StepId = (typeof STEP_IDS)[number]

/** Onboarding tugagach avtomatik bajarilgan hisoblanadigan bosqichlar (1 va 2). */
export const AUTO_DONE_STEPS: readonly StepId[] = ['profil', 'yol']

const CHECKED_AT = '2026-11-04'
const MIG: Source = {
  title: 'Make it in Germany',
  url: 'https://www.make-it-in-germany.com/fileadmin/1_Rebrush_2022/a_Fachkraefte/PDF-Dateien/3_Visum_u_Aufenthalt/Visagrafik_EN/Visum_Absolvierung_Berufsausbildung_EN.pdf',
  checkedAt: CHECKED_AT
}
const BIBB: Source = { title: 'BIBB', url: 'https://www.bibb.de/de/pressemitteilung_212952.php', checkedAt: CHECKED_AT }

export const AUSBILDUNG_STEPS: Step[] = [
  {
    id: 'profil',
    order: 1,
    title: 'step.profil.title',
    summary: 'step.profil.summary',
    cost: null,
    duration: null,
    tasks: [{ id: 'profil.t1', text: 'step.profil.t1' }],
    documents: [],
    sources: []
  },
  {
    id: 'yol',
    order: 2,
    title: 'step.yol.title',
    summary: 'step.yol.summary',
    cost: { amount: 822, currency: 'EUR', note: 'step.yol.costNote' },
    duration: null,
    tasks: [
      { id: 'yol.t1', text: 'step.yol.t1' },
      { id: 'yol.t2', text: 'step.yol.t2' }
    ],
    documents: [],
    facts: ['step.yol.f1', 'step.yol.f2', 'step.yol.f3', 'step.yol.f4'],
    sources: [MIG, BIBB]
  },
  {
    id: 'nemis',
    order: 3,
    title: 'step.nemis.title',
    summary: 'step.nemis.summary',
    cost: null,
    duration: null,
    tasks: [
      { id: 'nemis.t1', text: 'step.nemis.t1' },
      { id: 'nemis.t2', text: 'step.nemis.t2' }
    ],
    documents: [],
    facts: ['step.nemis.f1'],
    module: { label: 'step.nemis.module', to: '/til', ready: false },
    sources: [MIG]
  },
  {
    id: 'sertifikat',
    order: 4,
    title: 'step.sertifikat.title',
    summary: 'step.sertifikat.summary',
    cost: null,
    duration: null,
    tasks: [
      { id: 'sertifikat.t1', text: 'step.sertifikat.t1' },
      { id: 'sertifikat.t2', text: 'step.sertifikat.t2' }
    ],
    documents: [],
    sources: []
  },
  {
    id: 'hujjatlar',
    order: 5,
    title: 'step.hujjatlar.title',
    summary: 'step.hujjatlar.summary',
    cost: null,
    duration: null,
    tasks: [
      { id: 'hujjatlar.t1', text: 'step.hujjatlar.t1' },
      { id: 'hujjatlar.t2', text: 'step.hujjatlar.t2' },
      { id: 'hujjatlar.t3', text: 'step.hujjatlar.t3' }
    ],
    documents: [
      { id: 'hujjatlar.d1', text: 'step.hujjatlar.d1' },
      { id: 'hujjatlar.d2', text: 'step.hujjatlar.d2' },
      { id: 'hujjatlar.d3', text: 'step.hujjatlar.d3' },
      { id: 'hujjatlar.d4', text: 'step.hujjatlar.d4' },
      { id: 'hujjatlar.d5', text: 'step.hujjatlar.d5' }
    ],
    sources: [MIG]
  },
  {
    id: 'joy',
    order: 6,
    title: 'step.joy.title',
    summary: 'step.joy.summary',
    cost: null,
    duration: null,
    tasks: [
      { id: 'joy.t1', text: 'step.joy.t1' },
      { id: 'joy.t2', text: 'step.joy.t2' }
    ],
    documents: [],
    warning: 'step.joy.warning',
    sources: []
  },
  {
    id: 'shartnoma',
    order: 7,
    title: 'step.shartnoma.title',
    summary: 'step.shartnoma.summary',
    cost: null,
    duration: null,
    tasks: [
      { id: 'shartnoma.t1', text: 'step.shartnoma.t1' },
      { id: 'shartnoma.t2', text: 'step.shartnoma.t2' }
    ],
    documents: [
      { id: 'shartnoma.d1', text: 'step.shartnoma.d1' },
      { id: 'shartnoma.d2', text: 'step.shartnoma.d2' }
    ],
    sources: [MIG]
  },
  {
    id: 'viza',
    order: 8,
    title: 'step.viza.title',
    summary: 'step.viza.summary',
    cost: { amount: 75, currency: 'EUR', note: 'step.viza.costNote' },
    duration: null,
    tasks: [
      { id: 'viza.t1', text: 'step.viza.t1' },
      { id: 'viza.t2', text: 'step.viza.t2' }
    ],
    documents: [
      { id: 'viza.d1', text: 'step.viza.d1' },
      { id: 'viza.d2', text: 'step.viza.d2' },
      { id: 'viza.d3', text: 'step.viza.d3' },
      { id: 'viza.d4', text: 'step.viza.d4' }
    ],
    warning: 'step.viza.warning',
    sources: [MIG]
  },
  {
    id: 'jonash',
    order: 9,
    title: 'step.jonash.title',
    summary: 'step.jonash.summary',
    cost: null,
    duration: null,
    tasks: [
      { id: 'jonash.t1', text: 'step.jonash.t1' },
      { id: 'jonash.t2', text: 'step.jonash.t2' },
      { id: 'jonash.t3', text: 'step.jonash.t3' },
      { id: 'jonash.t4', text: 'step.jonash.t4' }
    ],
    documents: [],
    sources: []
  },
  {
    id: 'germaniyada',
    order: 10,
    title: 'step.germaniyada.title',
    summary: 'step.germaniyada.summary',
    cost: { amount: 100, currency: 'EUR', note: 'step.germaniyada.costNote', upTo: true },
    duration: null,
    tasks: [
      { id: 'germaniyada.t1', text: 'step.germaniyada.t1' },
      { id: 'germaniyada.t2', text: 'step.germaniyada.t2' }
    ],
    documents: [],
    sources: [MIG]
  }
]

export const stepById = (id: string): Step | undefined => AUSBILDUNG_STEPS.find((s) => s.id === id)

/** Belgilanadigan barcha elementlar (vazifa + hujjat) idlari: saqlangan progressni tekshirish uchun. */
export const ALL_ITEM_IDS: ReadonlySet<string> = new Set(AUSBILDUNG_STEPS.flatMap((s) => [...s.tasks, ...s.documents].map((i) => i.id)))
