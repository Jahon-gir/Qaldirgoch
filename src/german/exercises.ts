import { VOCAB, type VocabWord } from '../content/german/words'
import { normalize } from './answer'
import { shuffled } from './vocab'

/* ---------- Artikl ---------- */

export type Article = 'der' | 'die' | 'das'
export const ARTICLES: readonly Article[] = ['der', 'die', 'das']

/** Ot soʻz: "der |die |das " bilan boshlanib, keyin bosh harf bilan davom etadi ("Danke", "die" yolgʻiz — ot emas). */
export function articleOf(de: string): { article: Article; noun: string } | null {
  const m = /^(der|die|das) (\p{Lu}.*)$/u.exec(de)
  return m ? { article: m[1] as Article, noun: m[2] } : null
}
export const isNoun = (w: VocabWord) => articleOf(w.de) !== null

/* ---------- Usullar ---------- */

/** Bitta savol koʻrinishi (Kartochka va Roʻyxat — savol emas). */
/**
 * 'speak' (Talaffuz) — FAQAT lugʻat mashq usuli sifatida tanlanganda. kindsFor/Aralash, takrorlash (reviewKind) va yakuniy testga kirmaydi:
 * mikrofon ruxsati faqat foydalanuvchi shu usulni oʻzi tanlaganda soʻraladi.
 */
export type ExerciseKind = 'test' | 'build' | 'listen' | 'write' | 'article' | 'speak'

/** 3+ soʻzli gap — soʻz boʻlaklaridan yigʻiladi; 2 soʻzgacha — harflardan. */
export const wordCount = (de: string) => de.trim().split(/\s+/).length
export const isSentence = (de: string) => wordCount(de) >= 3

/* ---------- Harflardan yigʻish ---------- */

export type Tile = { id: string; text: string }

/** Targetdagi harflar (boʻsh joysiz, katta-kichik asl holida). */
export const targetLetters = (de: string) => [...de.normalize('NFC')].filter((c) => c !== ' ')

/** Harf tugmalari: target harflari + 2 ta chalgʻituvchi harf (shu moduldagi boshqa soʻzlardan). Tartib aralash. */
export function letterTiles(word: VocabWord, rand: () => number = Math.random, vocab: readonly VocabWord[] = VOCAB, extra = 2): Tile[] {
  const own = targetLetters(word.de)
  const pool = vocab.filter((w) => w.moduleId === word.moduleId && w.id !== word.id).flatMap((w) => targetLetters(w.de).filter((c) => /\p{L}/u.test(c)))
  const distract = shuffled(pool, rand).slice(0, extra)
  return shuffled([...own, ...distract].map((text, i) => ({ id: `t${i}`, text })), rand)
}

/** Yigʻilgan harflar targetga mosmi (katta-kichik farqsiz). */
export const lettersMatch = (placed: string[], de: string) => placed.join('').toLocaleLowerCase('de') === targetLetters(de).join('').toLocaleLowerCase('de')

/** Qoʻyilgan harflar target boshiga mosmi (Yordam: mos boʻlmasa avval tozalanadi). */
export function lettersPrefixOk(placed: string[], de: string) {
  const t = targetLetters(de)
  return placed.every((c, i) => c.toLocaleLowerCase('de') === t[i]?.toLocaleLowerCase('de'))
}

/* ---------- Soʻz boʻlaklaridan yigʻish (3+ soʻz) ---------- */

/** Boʻlaklar boʻsh joy boʻyicha; tinish belgisi soʻzga yopishgan holda qoladi ("Usbekistan."). */
export const chunksOf = (de: string) => de.trim().split(/\s+/)

/** Boʻlak tugmalari: target boʻlaklari + 1 ta chalgʻituvchi soʻz (shu moduldan, targetda yoʻq). */
export function chunkTiles(word: VocabWord, rand: () => number = Math.random, vocab: readonly VocabWord[] = VOCAB): Tile[] {
  const own = chunksOf(word.de)
  const have = new Set(own.map(normalize))
  const pool = vocab.filter((w) => w.moduleId === word.moduleId && w.id !== word.id).flatMap((w) => chunksOf(w.de)).filter((c) => !have.has(normalize(c)))
  const distract = shuffled(pool, rand).slice(0, 1)
  return shuffled([...own, ...distract].map((text, i) => ({ id: `c${i}`, text })), rand)
}

export const chunksMatch = (placed: string[], de: string) => normalize(placed.join(' ')) === normalize(de)

/* ---------- Aralash ---------- */

/** Soʻz uchun mumkin boʻlgan usullar: test, yigʻish, tinglash (ovoz boʻlsa), yozish, artikl (ot boʻlsa). */
export function kindsFor(word: VocabWord, canListen: boolean): ExerciseKind[] {
  const out: ExerciseKind[] = ['test', 'build']
  if (canListen) out.push('listen')
  out.push('write')
  if (isNoun(word)) out.push('article')
  return out
}

/** Keyingi soʻz usuli: tasodifiy, oldingisi bilan bir xil emas. */
export function nextMixedKind(word: VocabWord, prev: ExerciseKind | undefined, canListen: boolean, rand: () => number = Math.random): ExerciseKind {
  const opts = kindsFor(word, canListen).filter((k) => k !== prev)
  return opts[Math.floor(rand() * opts.length)] ?? 'test'
}

export function mixedKinds(words: readonly VocabWord[], canListen: boolean, rand: () => number = Math.random): ExerciseKind[] {
  const out: ExerciseKind[] = []
  for (const w of words) out.push(nextMixedKind(w, out[out.length - 1], canListen, rand))
  return out
}

/* ---------- Takrorlash: usul soʻz holatiga qarab ---------- */

/**
 * Joriy oraliq boʻyicha: 1 yoki 3 kun → Test; 7 kun → Harflardan yigʻish va Tinglab topish navbat bilan
 * (tinglash imkoni boʻlmasa — yigʻish); 14 va 30 kun → Yozish (3+ soʻzli gapda — soʻz boʻlaklaridan yigʻish).
 * Xato boʻlsa soʻz 1-oraliqqa qaytadi (srs.ts) — keyingi safar oʻzi osonroq usulda keladi.
 */
export function reviewKind(interval: number, word: VocabWord, canListen: boolean, nth7 = 0): ExerciseKind {
  if (interval >= 14) return isSentence(word.de) ? 'build' : 'write'
  if (interval >= 7) return canListen && nth7 % 2 === 1 ? 'listen' : 'build'
  return 'test'
}

/** Sessiya boshida har soʻz usuli (oraliq javob berilgach oʻzgaradi — usul savol oʻrtasida almashmasin). */
export function reviewKinds(ids: readonly string[], intervalOf: (id: string) => number, wordOf: (id: string) => VocabWord | undefined, canListen: boolean): ExerciseKind[] {
  let n7 = 0
  return ids.map((id) => {
    const w = wordOf(id)
    if (!w) return 'test'
    const iv = intervalOf(id)
    const k = reviewKind(iv, w, canListen, iv >= 7 && iv < 14 ? n7 : 0)
    if (iv >= 7 && iv < 14) n7++
    return k
  })
}

/** Ovoz yoʻq boʻlsa tinglash — Test bilan almashtiriladi. */
export const playable = (k: ExerciseKind, canListen: boolean): ExerciseKind => (k === 'listen' && !canListen ? 'test' : k)
