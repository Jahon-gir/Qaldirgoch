import { describe, expect, it } from 'vitest'
import { LESSON_ICONS } from '../../components/german/icons'
import { compose, decompose, isInitial, isVowel, syllablesOf } from '../../korean/hangul'
import { KO_COURSE } from '../../lang/ko'
import { resultIdsOf } from '../../lang/registry'
import { slugErrors } from '../../lang/words'
import type { Exercise, L3 } from '../german/types'
import { KO_LESSONS, KO_MODULES, koExercisesOf } from '.'

const LANGS = ['uz', 'uz-Cyrl', 'ru'] as const
const all = KO_LESSONS.flatMap((l) => koExercisesOf(l.id))

/** TZ dagi roʻyxat: FAQAT shu soʻzlar (yangi koreyscha soʻz toʻqilmaydi). */
const ALLOWED_WORDS: Record<string, string[]> = {
  'ko-h-m1-l1': ['아이', '오이'],
  'ko-h-m1-l2': ['나', '나라', '어머니', '아버지', '고기', '바다', '모자', '지도'],
  'ko-h-m1-l3': ['하나', '두부', '라디오', '사자'],
  'ko-h-m1-l4': ['커피', '토마토', '포도', '기차'],
  'ko-h-m1-l5': ['우유', '여자', '요리', '휴지', '노래', '네', '개'],
  'ko-h-m2-l1': ['아빠', '오빠', '토끼', '꼬리', '어깨', '아저씨', '뿌리', '가짜'],
  'ko-h-m2-l2': ['사과', '과자', '회사', '의사', '의자', '쥐', '시계', '돼지', '예'],
  'ko-h-m2-l3': ['밥', '물', '산', '강', '집', '문', '책', '옷', '가방', '사람', '김치', '한국'],
  'ko-h-m2-l4': ['한국어', '음악', '단어', '발음', '직업', '일요일', '목요일'],
  'ko-h-m2-l5': ['출구', '입구', '비상구', '화장실', '위험', '금연', '안녕하세요', '감사합니다']
}
const WORDS = new Set(Object.values(ALLOWED_WORDS).flat())
/** 1-modul soʻzlarida pastki harf (batchim) yoʻq; 2-modulda ruxsat. */
const M1_WORDS = Object.entries(ALLOWED_WORDS).filter(([id]) => id.startsWith('ko-h-m1')).flatMap(([, w]) => w)
const LETTERS = new Set('ㅏㅓㅗㅜㅡㅣㅇㄱㄴㄷㄹㅁㅂㅅㅈㅎㅋㅌㅍㅊㅑㅕㅛㅠㅐㅔㄲㄸㅃㅆㅉㅘㅝㅙㅞㅚㅟㅢㅒㅖ'.split(''))
/** Harf kartalaridagi boʻgʻinlar: 3-dars (1-modul), solishtirish jadvali (가/카/까…), bogʻlanib oʻqish kartalari. */
const SYLLABLES = new Set('나노가카까다타따바파빠한국어음악'.split(''))
/** "Qanday oʻqiladi?" savollari: [talaffuz yozuvi] va xato variantlar (yozilgani, pastki harf tushib qolgani). */
const READINGS = new Set(['한구거', '한구어', '다너', '다어', '바름', '바음', '지겁', '지어', '으막', '이료일', '모교일'])

/** Mashqdagi barcha koreyscha matnlar. */
function hangulTexts(e: Exercise): string[] {
  if (e.type === 'word') return [e.term]
  if (e.type === 'letter') return [...e.letters.map((l) => l.char), ...(e.example ? [e.example.term] : [])]
  if (e.type === 'syllable') return [e.initial, e.vowel, ...(e.final ? [e.final] : []), ...e.distractors]
  if (e.type === 'choice') return [...e.options.map((o) => o.text), ...(/\p{Script=Hangul}/u.test(e.translation.uz) ? [e.translation.uz] : [])]
  return e.pairs.map((p) => p.term)
}
function l3Texts(e: Exercise): L3[] {
  if (e.type === 'word') return [e.tr, e.pron]
  if (e.type === 'letter') return [e.note, ...(e.example ? [e.example.pron, e.example.tr] : [])]
  if (e.type === 'syllable') return [e.pron]
  if (e.type === 'choice') return [e.prompt, e.translation, e.explain]
  return [e.prompt, ...e.pairs.map((p) => p.tr)]
}
/** Harflar (jamo) — boʻgʻinlarga ajratib. */
const jamoOf = (s: string) => [...s].flatMap((c) => decompose(c) ?? [c])

describe('koreys kontenti: tuzilma', () => {
  it('darajalar: Hangul, TOPIK 1 (ochiq), TOPIK 2 (qulf)', () => {
    expect(KO_COURSE.levels.map((l) => [l.id, l.locked, l.label?.uz])).toEqual([
      ['ko-H', false, 'Hangul'],
      ['ko-T1', false, 'TOPIK 1'],
      ['ko-T2', true, 'TOPIK 2']
    ])
  })
  it('modullar: ko-h-m1 va ko-h-m2 (6 darsdan), ko-t1-m1..m8 darssiz', () => {
    expect(KO_MODULES.map((m) => m.id)).toEqual(['ko-h-m1', 'ko-h-m2', ...Array.from({ length: 8 }, (_, i) => `ko-t1-m${i + 1}`)])
    expect(KO_LESSONS.map((l) => l.id)).toEqual([...[1, 2, 3, 4, 5, 6].map((n) => `ko-h-m1-l${n}`), ...[1, 2, 3, 4, 5, 6].map((n) => `ko-h-m2-l${n}`)])
    expect(KO_LESSONS.filter((l) => l.kind === 'test').map((l) => l.id)).toEqual(['ko-h-m1-l6', 'ko-h-m2-l6'])
    expect(KO_LESSONS.filter((l) => l.moduleId === 'ko-h-m2').map((l) => l.order)).toEqual([1, 2, 3, 4, 5, 6])
  })
  it('holat: darsi bor modul — review, darssiz — draft', () => {
    for (const m of KO_MODULES) expect(m.status, m.id).toBe(KO_LESSONS.some((l) => l.moduleId === m.id) ? 'review' : 'draft')
  })
  it('har dars 8–12 qadam (1-modul: 8–10, L2 — 12; 2-modul L3 — 14: 12 soʻz + harf kartasi + 밥 mashqi, kelishilgan istisno)', () => {
    for (const l of KO_LESSONS) {
      const n = koExercisesOf(l.id).length
      if (l.id === 'ko-h-m1-l2') expect(n).toBe(12)
      else if (l.id === 'ko-h-m2-l3') expect(n).toBe(14)
      else {
        expect(n, l.id).toBeGreaterThanOrEqual(8)
        expect(n, l.id).toBeLessThanOrEqual(l.moduleId === 'ko-h-m1' ? 10 : 12)
      }
    }
  })
  it('BARCHA id ko- prefiksli va takrorlanmaydi', () => {
    const ids = [
      ...KO_MODULES.map((m) => m.id),
      ...KO_LESSONS.map((l) => l.id),
      ...all.map((e) => e.id),
      ...all.flatMap((e) => (e.type === 'match' ? e.pairs.map((p) => p.id) : e.type === 'choice' ? e.options.map((o) => o.id) : [])),
      ...KO_COURSE.vocab.map((w) => w.id),
      ...resultIdsOf(KO_COURSE).filter((id) => id.startsWith('test:')),
      ...KO_COURSE.levels.map((l) => l.id)
    ]
    for (const id of ids) expect(id.replace(/^test:(level-)?/, ''), id).toMatch(/^ko-/)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('har soʻzda slug (Revised Romanization, kichik lotin), id takrorlanmaydi', () => {
    expect(slugErrors(KO_COURSE)).toEqual([])
    for (const e of all) if (e.type === 'word') expect(e.slug, e.term).toMatch(/^[a-z]+$/)
    expect(KO_COURSE.vocab.map((w) => w.id)).toEqual([
      'ko-h-m1-ai', 'ko-h-m1-oi',
      'ko-h-m1-na', 'ko-h-m1-nara', 'ko-h-m1-eomeoni', 'ko-h-m1-abeoji', 'ko-h-m1-gogi', 'ko-h-m1-bada', 'ko-h-m1-moja', 'ko-h-m1-jido',
      'ko-h-m1-hana', 'ko-h-m1-dubu', 'ko-h-m1-radio', 'ko-h-m1-saja',
      'ko-h-m1-keopi', 'ko-h-m1-tomato', 'ko-h-m1-podo', 'ko-h-m1-gicha',
      'ko-h-m1-uyu', 'ko-h-m1-yeoja', 'ko-h-m1-yori', 'ko-h-m1-hyuji', 'ko-h-m1-norae', 'ko-h-m1-ne', 'ko-h-m1-gae',
      'ko-h-m2-appa', 'ko-h-m2-oppa', 'ko-h-m2-tokki', 'ko-h-m2-kkori', 'ko-h-m2-eokkae', 'ko-h-m2-ajeossi', 'ko-h-m2-ppuri', 'ko-h-m2-gajja',
      'ko-h-m2-sagwa', 'ko-h-m2-gwaja', 'ko-h-m2-hoesa', 'ko-h-m2-uisa', 'ko-h-m2-uija', 'ko-h-m2-jwi', 'ko-h-m2-sigye', 'ko-h-m2-dwaeji', 'ko-h-m2-ye',
      'ko-h-m2-bap', 'ko-h-m2-mul', 'ko-h-m2-san', 'ko-h-m2-gang', 'ko-h-m2-jip', 'ko-h-m2-mun', 'ko-h-m2-chaek', 'ko-h-m2-ot', 'ko-h-m2-gabang', 'ko-h-m2-saram', 'ko-h-m2-gimchi', 'ko-h-m2-hanguk',
      'ko-h-m2-hangugeo', 'ko-h-m2-eumak', 'ko-h-m2-daneo', 'ko-h-m2-bareum', 'ko-h-m2-jigeop', 'ko-h-m2-iryoil', 'ko-h-m2-mogyoil',
      'ko-h-m2-chulgu', 'ko-h-m2-ipgu', 'ko-h-m2-bisanggu', 'ko-h-m2-hwajangsil', 'ko-h-m2-wiheom', 'ko-h-m2-geumyeon', 'ko-h-m2-annyeonghaseyo', 'ko-h-m2-gamsahamnida'
    ])
    // slug 1-modul bilan ham takrorlanmaydi
    const slugs = all.flatMap((e) => (e.type === 'word' ? [e.slug!] : []))
    expect(new Set(slugs).size).toBe(slugs.length)
  })
  it('letter mashqi lugʻatga tushmaydi', () => {
    const letterIds = new Set(all.filter((e) => e.type === 'letter').map((e) => e.id))
    expect(KO_COURSE.vocab.some((w) => letterIds.has(w.exerciseId))).toBe(false)
  })
  it('soʻz ikonkalari mavjud', () => {
    for (const e of all) if (e.type === 'word') expect(LESSON_ICONS[e.icon], e.id).toBeTruthy()
  })
})

describe('koreys kontenti: faqat roʻyxatdagi soʻz va harflar', () => {
  it('har darsning soʻzlari aynan TZ roʻyxati', () => {
    for (const [lessonId, words] of Object.entries(ALLOWED_WORDS)) expect(koExercisesOf(lessonId).flatMap((e) => (e.type === 'word' ? [e.term] : []))).toEqual(words)
    for (const t of ['ko-h-m1-l6', 'ko-h-m2-l6']) expect(koExercisesOf(t).some((e) => e.type === 'word')).toBe(false)
  })
  it('barcha koreyscha matn — roʻyxatdagi soʻz, harf yoki darsda yigʻiladigan boʻgʻin', () => {
    for (const e of all) {
      for (const s of hangulTexts(e)) {
        const ok = WORDS.has(s) || LETTERS.has(s) || SYLLABLES.has(s) || READINGS.has(s)
        expect(ok, `${e.id}: ${s}`).toBe(true)
      }
    }
  })
  it('1-modul soʻzlarida pastki harf (batchim) yoʻq; 2-modulda ruxsat (3-darsdan soʻng)', () => {
    for (const w of M1_WORDS) for (const c of [...w]) expect(decompose(c)?.length, `${w}: ${c}`).toBe(2)
    // 2-modulda batchimli soʻzlar haqiqatan bor
    expect(['밥', '물', '한국어'].every((w) => [...w].some((c) => decompose(c)?.length === 3))).toBe(true)
  })
  it('boʻgʻin mashqi: toʻgʻri boʻgʻin, chalgʻituvchilar shu darsdagi harflardan (modul testida — moduldan)', () => {
    const lettersOf = (ids: string[]) => new Set(ids.flatMap((id) => koExercisesOf(id).flatMap((e) => hangulTexts(e).flatMap(jamoOf))))
    for (const l of KO_LESSONS) {
      const pool = l.kind === 'test' ? lettersOf(KO_LESSONS.filter((x) => x.moduleId === l.moduleId && x.kind !== 'test').map((x) => x.id)) : lettersOf([l.id])
      for (const e of koExercisesOf(l.id)) {
        if (e.type !== 'syllable') continue
        expect(compose(e.initial, e.vowel, e.final), e.id).not.toBeNull()
        expect(isInitial(e.initial) && isVowel(e.vowel), e.id).toBe(true)
        if (l.moduleId === 'ko-h-m1') {
          expect(e.final, e.id).toBeUndefined() // 1-modulda pastki harf yoʻq
          expect(e.showFinal, e.id).toBeUndefined()
          expect(e.distractors.length + 2, e.id).toBe(4) // 4 ta tugma
        } else {
          expect(e.distractors.length, e.id).toBe(2)
        }
        // chalgʻituvchilar noyob va toʻgʻri harflarga teng emas
        expect(new Set(e.distractors).size, e.id).toBe(e.distractors.length)
        for (const d of e.distractors) {
          expect([e.initial, e.vowel, e.final].includes(d), `${e.id}: ${d}`).toBe(false)
          expect(pool.has(d), `${e.id}: ${d}`).toBe(true)
        }
      }
    }
  })
  it('boʻgʻin mashqi (2-modul): murakkab unli — bitta tugma; pastki harfli 3 katak; "Yoʻq" varianti', () => {
    const syl = KO_LESSONS.filter((l) => l.moduleId === 'ko-h-m2').flatMap((l) => koExercisesOf(l.id)).flatMap((e) => (e.type === 'syllable' ? [e] : []))
    expect(syl.some((e) => ['ㅘ', 'ㅝ', 'ㅚ', 'ㅟ', 'ㅢ'].includes(e.vowel))).toBe(true) // murakkab unli
    for (const e of syl) expect(decompose(compose(e.initial, e.vowel, e.final)!)).toEqual(e.final ? [e.initial, e.vowel, e.final] : [e.initial, e.vowel])
    expect(syl.filter((e) => e.final).map((e) => compose(e.initial, e.vowel, e.final))).toEqual(['밥', '강', '산'])
    expect(syl.filter((e) => e.showFinal).map((e) => compose(e.initial, e.vowel))).toEqual(['사'])
    for (const e of syl) expect(e.final && e.showFinal, e.id).toBeFalsy()
  })
  it('choice: bitta toʻgʻri, 3 variant, takrorlanmaydi', () => {
    for (const e of all) {
      if (e.type !== 'choice') continue
      expect(e.options.filter((o) => o.correct), e.id).toHaveLength(1)
      expect(new Set(e.options.map((o) => o.text)).size).toBe(3)
    }
  })
  it('match: 4 noyob juft', () => {
    for (const e of all) {
      if (e.type !== 'match') continue
      expect(e.pairs).toHaveLength(4)
      expect(new Set(e.pairs.map((p) => p.term)).size).toBe(4)
      for (const lang of LANGS) expect(new Set(e.pairs.map((p) => p.tr[lang])).size, `${e.id} ${lang}`).toBe(4)
    }
  })
})

describe('koreys kontenti: matn uch tilda', () => {
  const texts = all.flatMap(l3Texts).concat(KO_MODULES.map((m) => m.title), KO_LESSONS.map((l) => l.title))
  it('har matn uch tilda toʻliq', () => {
    for (const t of texts) for (const lang of LANGS) expect(t[lang]?.trim().length, JSON.stringify(t)).toBeGreaterThan(0)
  })
  it('lotin matnda oddiy apostrof yoʻq (faqat ʻ ʼ)', () => {
    for (const t of texts) expect(t.uz, t.uz).not.toMatch(/['‘’`´]/)
  })
  it('kirill: lotincha tutuq yoʻq; "ц" va "тс" yoʻq', () => {
    for (const t of texts) {
      expect(t['uz-Cyrl'], t['uz-Cyrl']).not.toMatch(/['‘’`´ʻʼ]/)
      expect(t['uz-Cyrl']).not.toMatch(/тс(?![а-я])|ц/i)
    }
  })
  it("oʻqilishi qoidasi: yumshoq ㄱ ㄷ ㅂ ㅈ — g d b j; nafasli ㅋ ㅌ ㅍ ㅊ — k t p ch; qattiq ㄲ ㄸ ㅃ ㅆ ㅉ — kk tt pp ss jj", () => {
    // [uz, uz-Cyrl, ru] boshlanishi; ㅈ: uz j, kirill ж, ru дж; ㅉ: jj, жж, ддж
    const RULE: Record<string, [string, string, string]> = {
      ㄱ: ['g', 'г', 'г'], ㄷ: ['d', 'д', 'д'], ㅂ: ['b', 'б', 'б'], ㅈ: ['j', 'ж', 'дж'],
      ㅋ: ['k', 'к', 'к'], ㅌ: ['t', 'т', 'т'], ㅍ: ['p', 'п', 'п'], ㅊ: ['ch', 'ч', 'ч'],
      ㄲ: ['kk', 'кк', 'кк'], ㄸ: ['tt', 'тт', 'тт'], ㅃ: ['pp', 'пп', 'пп'], ㅆ: ['ss', 'сс', 'сс'], ㅉ: ['jj', 'жж', 'ддж']
    }
    type Item = { term: string; pron: L3; first: boolean }
    // 4- va 5-darsda (bogʻlanib oʻqish, belgilar) talaffuz yozuvdan farq qiladi: faqat BIRINCHI boʻgʻin boshidagi undosh tekshiriladi
    const items: Item[] = KO_LESSONS.flatMap((l) =>
      koExercisesOf(l.id).flatMap((e): Item[] => {
        const first = l.id === 'ko-h-m2-l4' || l.id === 'ko-h-m2-l5'
        return e.type === 'word' ? [{ term: e.term, pron: e.pron, first }]
          : e.type === 'letter' && e.example ? [{ term: e.example.term, pron: e.example.pron, first }]
          : e.type === 'syllable' ? [{ term: compose(e.initial, e.vowel, e.final)!, pron: e.pron, first }]
          : []
      })
    )
    expect(items.length).toBeGreaterThan(60)
    let checked = 0
    let tense = 0
    for (const { term, pron, first } of items) {
      const syl = syllablesOf(term)
      const parts = (['uz', 'uz-Cyrl', 'ru'] as const).map((k) => pron[k].split('-'))
      for (const [k, segs] of parts.entries()) expect(segs.length, `${term} ${k}`).toBe(syl.length)
      syl.forEach((sy, i) => {
        if (first && i > 0) return
        const init = decompose(sy)![0]
        const rule = RULE[init]
        if (!rule) return
        checked++
        if ('ㄲㄸㅃㅆㅉ'.includes(init)) tense++
        parts.forEach((segs, k) => expect(segs[i].startsWith(rule[k]), `${term} [${sy}] ${segs[i]} → ${rule[k]}`).toBe(true))
      })
    }
    expect(checked).toBeGreaterThan(60)
    expect(tense).toBeGreaterThanOrEqual(8) // qattiq undoshlar tekshirilgan
    // 고 va 코 bir xil yozilmasin (4-darsdagi farq)
    expect(KO_COURSE.wordById('ko-h-m1-gogi')!.pron.uz.startsWith('go')).toBe(true)
    expect(KO_COURSE.wordById('ko-h-m1-keopi')!.pron.uz.startsWith('ko')).toBe(true)
    expect(KO_COURSE.wordById('ko-h-m2-kkori')!.pron.uz.startsWith('kko')).toBe(true)
  })
  it('oʻqilishi (pron): uz — lotin, kirill va ru — kirill harflarida', () => {
    const prons = all.flatMap((e) => (e.type === 'word' || e.type === 'syllable' ? [e.pron] : e.type === 'letter' && e.example ? [e.example.pron] : []))
    for (const p of prons) {
      expect(p.uz, p.uz).toMatch(/^[a-zʻ -]+$/)
      expect(p['uz-Cyrl'], p['uz-Cyrl']).toMatch(/^[а-яўқғҳё -]+$/)
      expect(p.ru, p.ru).toMatch(/^[а-яё -]+$/)
    }
  })
})
