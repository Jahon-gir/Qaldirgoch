/**
 * Hangul: moslik harflari (U+3131…, klaviaturadagi ㄱ ㅏ) ↔ Unicode boʻgʻin (U+AC00…).
 * Boʻgʻin = 0xAC00 + (L × 21 + V) × 28 + T; L — bosh undosh (19), V — unli (21), T — pastki harf (0 = yoʻq, 27 ta).
 */

/** Bosh undoshlar (choseong) tartibi. */
const INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
/** Unlilar (jungseong) tartibi. */
const VOWELS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
/** Pastki harflar (jongseong); 0-oʻrin — yoʻq. */
const FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

const BASE = 0xac00
const LAST = 0xd7a3

/** Harflardan boʻgʻin: compose('ㄴ', 'ㅏ') = '나', compose('ㅎ', 'ㅏ', 'ㄴ') = '한'. Notoʻgʻri harf — null. */
export function compose(initial: string, vowel: string, final?: string): string | null {
  const l = INITIALS.indexOf(initial)
  const v = VOWELS.indexOf(vowel)
  const t = final ? FINALS.indexOf(final) : 0
  if (l < 0 || v < 0 || t < 0 || (final !== undefined && final !== '' && t === 0)) return null
  return String.fromCharCode(BASE + (l * 21 + v) * 28 + t)
}

/** Boʻgʻindan harflar: decompose('한') = ['ㅎ', 'ㅏ', 'ㄴ'], decompose('나') = ['ㄴ', 'ㅏ']. Boʻgʻin boʻlmasa — null. */
export function decompose(syllable: string): string[] | null {
  const s = syllable.normalize('NFC')
  if ([...s].length !== 1) return null
  const code = s.charCodeAt(0)
  if (code < BASE || code > LAST) return null
  const i = code - BASE
  const t = i % 28
  const v = Math.floor(i / 28) % 21
  const l = Math.floor(i / 28 / 21)
  return t ? [INITIALS[l], VOWELS[v], FINALS[t]] : [INITIALS[l], VOWELS[v]]
}

/** Hangul boʻgʻinimi. */
export const isSyllable = (s: string) => decompose(s) !== null
/** Boʻgʻinda pastki harf (batchim) bormi. */
export const hasFinal = (s: string) => (decompose(s)?.length ?? 0) === 3
/** Soʻzning boʻgʻinlari (boʻsh joy va tinish belgilarisiz). */
export const syllablesOf = (term: string) => [...term.normalize('NFC')].filter(isSyllable)

/** Bosh undosh boʻla oladigan harfmi (ㄱ…ㅎ). */
export const isInitial = (c: string) => INITIALS.includes(c)
/** Unlimi (ㅏ…ㅣ). */
export const isVowel = (c: string) => VOWELS.includes(c)
