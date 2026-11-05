/**
 * Progress har doim shu telefonda (localStorage) turadi — internetsiz ham ishlaydi.
 * Kirgan boʻlsa serverga (user_progress) yoziladi; internet boʻlmasa oʻzgarishlar navbatda turadi va ulangach yuboriladi.
 */
export const PROGRESS_KEYS = {
  items: 'qaldirgoch.progress',
  pending: 'qaldirgoch.progress.pending', // { uid, ops }
  synced: 'qaldirgoch.progress.synced', // mehmon progressi shu akkaunt bilan birlashtirilgan: foydalanuvchi id
  lessons: 'qaldirgoch.lessons', // til darslari natijalari (user_lessons keshi)
  words: 'qaldirgoch.words', // takrorlash qutisidagi soʻzlar (user_words keshi)
  activity: 'qaldirgoch.activity', // kunlik tugatilgan dars va takrorlash soni, maqsad, kechirim (user_daily_activity keshi)
  wordsSynced: 'qaldirgoch.words.synced' // mehmon soʻzlari shu akkauntga koʻchirilgan: foydalanuvchi id
}

export function read<T>(key: string, parse: (s: string) => T, fallback: T): T {
  try {
    const s = localStorage.getItem(key)
    return s == null ? fallback : parse(s)
  } catch {
    return fallback
  }
}
export function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* xususiy rejimda saqlanmasa ham sessiya davomida ishlayveradi */
  }
}

/** Chiqishda (umumiy telefon) mahalliy progress nusxasi tozalanadi. */
export function clearProgressStorage() {
  for (const k of Object.values(PROGRESS_KEYS)) write(k, null)
}

