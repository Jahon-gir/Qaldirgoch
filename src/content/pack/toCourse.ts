import type { Direction, Exercise, L3, Lesson, MatchExercise, Module, WordExercise } from '../german/types'
import type { ContentPack, PackWord } from './types'

/**
 * Paketlar → kurs modullari, darslari va mashqlari. Shu bilan kasbiy soʻzlar mavjud tizimga toʻliq ulanadi:
 * Lugʻat, takrorlash (SRS), barcha mashq usullari, modul yakuniy testi — yangi yodlash tizimi yoʻq.
 *
 * - Bitta vaziyat = bitta modul: id "<soha>-<vaziyat>", yoʻnalish = soha (general — hammaga, qolgani — tanlangan yoʻnalishga).
 * - Darslar: soʻzlar WORDS_PER_LESSON tadan; id "<modul>-l<n>". Har darsda soʻz kartalari + juftlash (≥ 3 soʻz).
 * - Lugʻat id'si (buildVocab: "<modul>-<slug>") paketdagi soʻz id'siga teng — progress shu id bilan saqlanadi.
 * - Qoralama (draft) soʻzlar ilovaga chiqmaydi (CLAUDE.md 5-qoida). Qolgan soʻzi yoʻq vaziyat — modul yoʻq.
 */
export const WORDS_PER_LESSON = 6
/** Paket modullari asosiy kurs modullaridan keyin: order = soha tartibi × 100 + vaziyat tartibi. */
export const PACK_ORDER_BASE = 100
export const FALLBACK_ICON = 'abc'

const PART: L3 = { uz: '{n}-qism', 'uz-Cyrl': '{n}-қисм', ru: 'Часть {n}' }
const MATCH_PROMPT: L3 = {
  uz: 'Juftlarni toping: avval chapdan, keyin oʻngdan tanlang',
  'uz-Cyrl': 'Жуфтларни топинг: аввал чапдан, кейин ўнгдан танланг',
  ru: 'Найдите пары: сначала слева, потом справа'
}

export type PackCourse = { modules: Module[]; lessons: Lesson[]; exercises: Record<string, Exercise[]> }

const partTitle = (title: L3, n: number, total: number): L3 =>
  total === 1 ? title : { uz: `${title.uz} · ${PART.uz.replace('{n}', String(n))}`, 'uz-Cyrl': `${title['uz-Cyrl']} · ${PART['uz-Cyrl'].replace('{n}', String(n))}`, ru: `${title.ru} · ${PART.ru.replace('{n}', String(n))}` }

function toWord(w: PackWord, id: string, icons?: ReadonlySet<string>): WordExercise {
  return {
    type: 'word',
    id,
    term: w.term,
    slug: w.slug,
    tr: w.tr,
    pron: w.pron ?? { uz: '', 'uz-Cyrl': '', ru: '' },
    icon: w.icon && (!icons || icons.has(w.icon)) ? w.icon : FALLBACK_ICON,
    ...(w.example && { example: w.example }),
    ...(w.audio && { audioUrl: w.audio }),
    ...(w.plural && { plural: w.plural }),
    ...(w.image && { image: w.image }),
    ...(w.safety && { safety: true })
  }
}

export function packsToCourse(packs: readonly ContentPack[], opts: { icons?: ReadonlySet<string> } = {}): PackCourse {
  const out: PackCourse = { modules: [], lessons: [], exercises: {} }
  for (const p of [...packs].sort((a, b) => a.order - b.order)) {
    for (const s of [...p.situations].sort((a, b) => a.order - b.order)) {
      const words = p.words.filter((w) => w.situation === s.id && w.status !== 'draft')
      if (words.length === 0) continue
      const moduleId = `${p.field}-${s.id}`
      out.modules.push({
        id: moduleId,
        level: s.level,
        direction: p.field as Direction,
        order: p.order * PACK_ORDER_BASE + s.order,
        status: words.every((w) => w.status === 'approved') ? 'approved' : 'review',
        title: s.title
      })
      const chunks: PackWord[][] = []
      for (let i = 0; i < words.length; i += WORDS_PER_LESSON) chunks.push(words.slice(i, i + WORDS_PER_LESSON))
      // Oxirgi dars juda kichik boʻlsa (1–2 soʻz), oldingisiga qoʻshiladi
      if (chunks.length > 1 && chunks[chunks.length - 1].length < 3) chunks[chunks.length - 2].push(...chunks.pop()!)
      chunks.forEach((chunk, i) => {
        const lessonId = `${moduleId}-l${i + 1}`
        out.lessons.push({ id: lessonId, moduleId, title: partTitle(s.title, i + 1, chunks.length), kind: 'words', minutes: Math.max(3, Math.ceil(chunk.length * 0.8)), order: i + 1 })
        const ex: Exercise[] = chunk.map((w, k) => toWord(w, `${lessonId}-e${k + 1}`, opts.icons))
        if (chunk.length >= 3) {
          const m: MatchExercise = {
            type: 'match',
            id: `${lessonId}-e${chunk.length + 1}`,
            prompt: MATCH_PROMPT,
            pairs: chunk.slice(0, 5).map((w, k) => ({ id: `${lessonId}-e${chunk.length + 1}-p${k + 1}`, term: w.term, tr: w.tr }))
          }
          ex.push(m)
        }
        out.exercises[lessonId] = ex
      })
    }
  }
  return out
}
