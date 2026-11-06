/**
 * Oʻzbek lotin → oʻzbek kirill avtomatik oʻgirish.
 * Qoidalar: oʻ→ў, gʻ→ғ, sh→ш, ch→ч, ng→нг, ya→я, yo→ё, yu→ю, ye→е,
 * soʻz boshidagi e→э, ʼ→ъ. Katta harflar saqlanadi.
 * {n} kabi oʻrinbosarlar va istisno soʻzlar (Ausbildung, Google, A1…) oʻzgarmaydi.
 */

/** Oʻgirilmaydigan lotin soʻzlar (aniq yozuvi bilan). Qoʻshimchali shakli ham saqlanadi: "Ausbildungda" → "Ausbildungда". */
export const LATIN_EXCEPTIONS = ['Ausbildung', 'Google', 'Telegram', 'WhatsApp', 'AI', 'PWA', 'URL', 'Goethe', 'telc', 'ÖSD', 'TestDaF', 'EUR', 'CV', 'AufenthG', 'Chancenkarte', 'Verpflichtungserklärung', 'Auslandsportal', 'ZAB', 'BIBB', 'AHK']

const LEVEL = /^[ABC][12]/ // A1, A2, B1 … va "A1da" kabi shakllar

// ʻ (U+02BB) asosiy; ‘ ' ` — xato yozilgan matnlar uchun ham oʻ/gʻ deb qabul qilinadi
const TURNED = new Set(['ʻ', '‘', "'", '`'])
const APOS = new Set(['ʼ', '’'])

const SINGLE: Record<string, string> = {
  a: 'а', b: 'б', c: 'с', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м',
  n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'х', y: 'й', z: 'з'
}
const PAIRS: Record<string, string> = { sh: 'ш', ch: 'ч', ya: 'я', yo: 'ё', yu: 'ю', ye: 'е' }

const isUpper = (ch: string) => ch !== ch.toLowerCase()
const isLetter = (ch: string | undefined) => !!ch && /[A-Za-z]/.test(ch)

/** Bitta lotin soʻzni (istisnosiz) kirillga oʻgiradi. */
function word(w: string): string {
  let out = ''
  for (let i = 0; i < w.length; i++) {
    const ch = w[i]
    const lo = ch.toLowerCase()
    const next = w[i + 1]
    const prevLetter = isLetter(w[i - 1]) || (w[i - 1] !== undefined && (TURNED.has(w[i - 1]) || APOS.has(w[i - 1])))
    // Katta harf: birinchi harf katta boʻlsa natija ham katta
    const up = (s: string) => (isUpper(ch) ? s.toUpperCase() : s)

    if ((lo === 'o' || lo === 'g') && next && TURNED.has(next)) {
      out += up(lo === 'o' ? 'ў' : 'ғ')
      i++
      continue
    }
    if (APOS.has(ch)) {
      out += 'ъ'
      continue
    }
    if (TURNED.has(ch)) {
      out += ch // yolgʻiz belgi — tegmaymiz
      continue
    }
    if (next && isLetter(next)) {
      const pair = lo + next.toLowerCase()
      // "yoʻl": y + oʻ → й + ў, "yo" emas
      const yoTurned = pair === 'yo' && w[i + 2] !== undefined && TURNED.has(w[i + 2])
      if (PAIRS[pair] && !yoTurned) {
        out += up(PAIRS[pair])
        i++
        continue
      }
    }
    if (lo === 'e' && !prevLetter) {
      out += up('э')
      continue
    }
    out += SINGLE[lo] !== undefined ? up(SINGLE[lo]) : ch
  }
  return out
}

function keepPrefix(w: string): string | null {
  const m = w.match(LEVEL)
  if (m) return m[0]
  for (const ex of LATIN_EXCEPTIONS) if (w.startsWith(ex)) return ex
  return null
}

const TOKEN = /(\{[^}]*\})|([A-Za-zÖöÄäÜüßʻʼ‘’'`]+[0-9]*[A-Za-zʻʼ'`]*)/g

export function toCyrillic(text: string): string {
  return text.replace(TOKEN, (m, placeholder: string | undefined) => {
    if (placeholder) return m
    const keep = keepPrefix(m)
    if (keep) {
      const rest = m.slice(keep.length)
      const sep = rest.match(/^[ʼ’'`]/)?.[0] ?? ''
      return keep + sep + word(rest.slice(sep.length))
    }
    return word(m)
  })
}
