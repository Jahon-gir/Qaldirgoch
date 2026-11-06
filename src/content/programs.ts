import type { Key } from '../i18n/uz'
import { BIBB, MIG, type Source } from './ausbildung'

/**
 * Yoʻl kontenti: kirish ekrani (IntroPage) va "Batafsil" sahifasi (DetailPage) shu ma'lumotdan quriladi.
 * QOIDA (CLAUDE.md, 5–6): faqat tasdiqlangan matn va raqam; noaniq narsa uchun "rasmiy manbada tekshiring".
 * Matnlar i18n kalitlarida (uz, ru, cyrl); bu yerda faqat kalitlar va manbalar.
 */
export type NeedIcon = 'language' | 'coin-euro' | 'contract' | 'certificate' | 'file-text' | 'file-check' | 'briefcase' | 'school' | 'clock' | 'shield-check'

/** Batafsil boʻlimining bir qismi (ixtiyoriy): paragraf yoki roʻyxat, kichik sarlavha, izoh. items oʻrniga ishlatiladi. */
export type DetailBlock = { sub?: Key; keys: Key[]; as?: 'p' | 'ul'; strong?: boolean; note?: Key }
export type DetailSection = {
  id: string
  title: Key
  /** Oddiy boʻlim: 1 ta matn — paragraf, bir nechta — roʻyxat. */
  items: Key[]
  /** Murakkab boʻlim (Ausbildung): items oʻrniga. */
  blocks?: DetailBlock[]
  /** Boʻlim ostidagi rangli blok (warn — sariq "Diqqat", danger — qizil xavf). */
  callout?: Key
  calloutTone?: 'warn' | 'danger'
}
export type ProgramContent = {
  what: Key
  needs: { icon: NeedIcon; title: Key; text: Key }[]
  /** Sariq "tekshiring" bloki. */
  notice?: Key
  /** Qizil xavf bloki. */
  warning: Key
  detail: DetailSection[]
  sources: Source[]
  /** Faqat Ausbildung: "Qanday ishlaydi" bloki va yoʻl xaritasi tugmasi. */
  roadmap?: boolean
}

/** Yangi manbalar (0.6.7) tekshirilgan sana. */
export const NEW_CHECKED_AT = '2026-11-06'

const AUSBILDUNG: ProgramContent = {
  what: 'intro.what',
  needs: [
    { icon: 'language', title: 'intro.needLang', text: 'intro.needLangText' },
    { icon: 'coin-euro', title: 'intro.needMoney', text: 'intro.needMoneyText' },
    { icon: 'contract', title: 'intro.needContract', text: 'intro.needContractText' }
  ],
  notice: 'step.yol.f4',
  warning: 'step.viza.warning',
  roadmap: true,
  sources: [MIG, BIBB],
  detail: [
    { id: 'what', title: 'detail.what', items: [], blocks: [{ keys: ['step.yol.t1'], as: 'p', strong: true }, { keys: ['intro.what'], as: 'p' }] },
    {
      id: 'money',
      title: 'detail.money',
      items: [],
      blocks: [{ keys: ['step.yol.f1'], as: 'p' }, { keys: ['step.yol.f2'], as: 'p' }, { keys: ['step.yol.f3'], as: 'p', note: 'detail.perMonthGross' }],
      callout: 'step.yol.f4',
      calloutTone: 'warn'
    },
    { id: 'lang', title: 'detail.lang', items: [], blocks: [{ keys: ['step.nemis.f1'], as: 'p' }, { keys: ['step.sertifikat.t1', 'step.nemis.t1', 'step.nemis.t2'], as: 'ul' }] },
    {
      id: 'docs',
      title: 'detail.docs',
      items: [],
      blocks: [
        { sub: 'step.tasks', keys: ['step.hujjatlar.t1', 'step.hujjatlar.t2', 'step.hujjatlar.t3'], as: 'ul' },
        { sub: 'step.documents', keys: ['step.hujjatlar.d1', 'step.hujjatlar.d2', 'step.hujjatlar.d3', 'step.hujjatlar.d4', 'step.hujjatlar.d5'], as: 'ul' }
      ]
    },
    { id: 'job', title: 'detail.job', items: [], blocks: [{ keys: ['step.joy.t1', 'step.joy.t2'], as: 'ul' }], callout: 'step.joy.warning', calloutTone: 'danger' },
    {
      id: 'contract',
      title: 'detail.contract',
      items: [],
      blocks: [
        { keys: ['step.shartnoma.t1', 'step.shartnoma.t2', 'step.viza.t1', 'step.viza.t2'], as: 'ul' },
        { sub: 'step.documents', keys: ['step.viza.d1', 'step.viza.d2', 'step.viza.d3', 'step.viza.d4'], as: 'ul' }
      ],
      callout: 'step.viza.warning',
      calloutTone: 'danger'
    },
    {
      id: 'abroad',
      title: 'detail.abroad',
      items: [],
      blocks: [{ keys: ['step.jonash.t1', 'step.jonash.t2', 'step.jonash.t3', 'step.jonash.t4', 'step.germaniyada.t1', 'step.germaniyada.t2'], as: 'ul' }]
    }
  ]
}

/** Kontenti bor yoʻllar: "<davlat>/<yoʻl>". Kontenti yoʻq yopiq yoʻl — ProgramPage. */
export const PROGRAM_CONTENT: Record<string, ProgramContent> = {
  'de/ausbildung': AUSBILDUNG,
  'de/chancenkarte': {
    what: 'ck.what',
    needs: [
      { icon: 'certificate', title: 'ck.n1t', text: 'ck.n1' },
      { icon: 'language', title: 'ck.n2t', text: 'ck.n2' },
      { icon: 'coin-euro', title: 'ck.n3t', text: 'ck.n3' }
    ],
    notice: 'ck.notice',
    warning: 'step.viza.warning',
    detail: [
      { id: 's1', title: 'ck.s1h', items: ['ck.s1'] },
      { id: 's2', title: 'ck.s2h', items: ['ck.s2'] },
      { id: 's3', title: 'ck.s3h', items: ['ck.s3'] },
      { id: 's4', title: 'ck.s4h', items: ['ck.s4'] },
      { id: 's5', title: 'ck.s5h', items: ['ck.s5'] },
      { id: 's6', title: 'ck.s6h', items: ['ck.s6'] },
      { id: 's7', title: 'ck.s7h', items: ['ck.s7'] }
    ],
    sources: [
      { title: 'Make it in Germany', url: 'https://www.make-it-in-germany.com/fileadmin/1_Rebrush_2022/a_Fachkraefte/PDF-Dateien/3_Visum_u_Aufenthalt/Visagrafik_EN/Chancenkarte_zur_Jobsuche_EN.pdf', checkedAt: NEW_CHECKED_AT },
      { title: 'germany.info', url: 'https://www.germany.info/resource/blob/2663778/ab8cb2c068d1819dd3822b81231fe0b9/opportunity-card-data.pdf', checkedAt: NEW_CHECKED_AT }
    ]
  },
  'de/tan-oldirish': {
    what: 'to.what',
    needs: [
      { icon: 'certificate', title: 'to.n1t', text: 'to.n1' },
      { icon: 'file-text', title: 'to.n2t', text: 'to.n2' },
      { icon: 'briefcase', title: 'to.n3t', text: 'to.n3' }
    ],
    notice: 'to.notice',
    warning: 'step.viza.warning',
    detail: [
      { id: 's1', title: 'to.s1h', items: ['to.s1'] },
      { id: 's2', title: 'to.s2h', items: ['to.s2'] },
      { id: 's3', title: 'to.s3h', items: ['to.s3'] },
      { id: 's4', title: 'to.s4h', items: ['to.s4'] },
      { id: 's5', title: 'to.s5h', items: ['to.s5'] },
      { id: 's6', title: 'to.s6h', items: ['to.s6'] },
      { id: 's7', title: 'to.s7h', items: ['to.s7'] },
      { id: 's8', title: 'to.s8h', items: ['to.s8'] }
    ],
    sources: [
      { title: 'Anerkennung in Deutschland', url: 'https://www.anerkennung-in-deutschland.de/html/en/what-is-recognition.php', checkedAt: NEW_CHECKED_AT },
      { title: 'Make it in Germany', url: 'https://www.make-it-in-germany.com/en/visa-residence/types/recognition', checkedAt: NEW_CHECKED_AT }
    ]
  },
  'de/mutaxassis': {
    what: 'mu.what',
    needs: [
      { icon: 'certificate', title: 'mu.n1t', text: 'mu.n1' },
      { icon: 'contract', title: 'mu.n2t', text: 'mu.n2' },
      { icon: 'file-check', title: 'mu.n3t', text: 'mu.n3' }
    ],
    notice: 'mu.notice',
    warning: 'step.viza.warning',
    detail: [
      { id: 's1', title: 'mu.s1h', items: ['mu.s1'] },
      { id: 's2', title: 'mu.s2h', items: ['mu.s2'] },
      { id: 's3', title: 'mu.s3h', items: ['mu.s3'] },
      { id: 's4', title: 'mu.s4h', items: ['mu.s4'] },
      { id: 's5', title: 'mu.s5h', items: ['mu.s5'] },
      { id: 's6', title: 'mu.s6h', items: ['mu.s6'] }
    ],
    sources: [
      { title: 'Make it in Germany', url: 'https://www.make-it-in-germany.com/en/visa-residence/types/work-qualified-professionals', checkedAt: NEW_CHECKED_AT },
      { title: 'BAMF', url: 'https://www.bamf.de/EN/Themen/MigrationAufenthalt/ZuwandererDrittstaaten/Arbeit/Fachkraft/fachkraft-node.html', checkedAt: NEW_CHECKED_AT }
    ]
  },
  'de/oqish': {
    what: 'oq.what',
    needs: [
      { icon: 'school', title: 'oq.n1t', text: 'oq.n1' },
      { icon: 'file-text', title: 'oq.n2t', text: 'oq.n2' },
      { icon: 'coin-euro', title: 'oq.n3t', text: 'oq.n3' }
    ],
    notice: 'oq.notice',
    warning: 'step.viza.warning1',
    detail: [
      { id: 's1', title: 'oq.s1h', items: ['oq.s1'] },
      { id: 's2', title: 'oq.s2h', items: ['oq.s2'] },
      { id: 's3', title: 'oq.s3h', items: ['oq.s3'] },
      { id: 's4', title: 'oq.s4h', items: ['oq.s4'] },
      { id: 's5', title: 'oq.s5h', items: ['oq.s5'] },
      { id: 's6', title: 'oq.s6h', items: ['oq.s6'] }
    ],
    sources: [
      { title: 'Make it in Germany', url: 'https://www.make-it-in-germany.com/fileadmin/1_Rebrush_2022/a_Fachkraefte/PDF-Dateien/3_Visum_u_Aufenthalt/Visagrafik_EN/Visum_Studieren_EN.pdf', checkedAt: NEW_CHECKED_AT },
      { title: 'DAAD', url: 'https://www.daad.de/en/studying-in-germany/requirements/overview/', checkedAt: NEW_CHECKED_AT }
    ]
  },
  'de/til-kursi': {
    what: 'tk.what',
    needs: [
      { icon: 'clock', title: 'tk.n1t', text: 'tk.n1' },
      { icon: 'coin-euro', title: 'tk.n2t', text: 'tk.n2' },
      { icon: 'shield-check', title: 'tk.n3t', text: 'tk.n3' }
    ],
    notice: 'tk.notice',
    warning: 'step.viza.warning1',
    detail: [
      { id: 's1', title: 'tk.s1h', items: ['tk.s1'] },
      { id: 's2', title: 'tk.s2h', items: ['tk.s2'] },
      { id: 's3', title: 'tk.s3h', items: ['tk.s3'] },
      { id: 's4', title: 'tk.s4h', items: ['tk.s4'] },
      { id: 's5', title: 'tk.s5h', items: ['tk.s5'] }
    ],
    sources: [
      { title: 'taschkent.diplo.de', url: 'https://taschkent.diplo.de/uz-de/service/05-visaeinreise/2445792-2445792', checkedAt: NEW_CHECKED_AT }
    ]
  }
}

export const contentOf = (country: string, program: string): ProgramContent | undefined => PROGRAM_CONTENT[`${country}/${program}`]

/** Manba qatori uchun: nomlar va eng soʻnggi tekshirilgan sana. */
export function sourceSummary(c: ProgramContent): { names: string; date: string } {
  return { names: c.sources.map((s) => s.title).join(', '), date: c.sources.map((s) => s.checkedAt).reduce((a, b) => (b > a ? b : a), '') }
}
