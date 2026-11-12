import { describe, expect, it } from 'vitest'
import { PACK_RULES } from './rules'
import { rowsToPacks, yesNo, type Row, type Sheets } from './rows'
import type { FileInfo } from './types'

const de = PACK_RULES.de
const ko = PACK_RULES.ko

let n = 3
const row = (o: Record<string, string>): Row => ({ __row: String(n++), ...o })
const field = (o: Record<string, string> = {}) => row({ id: 'technical', title_uz: 'Texnik kasblar', title_cyrl: 'Техник касблар', title_ru: 'Технические профессии', order: '1', ...o })
const sit = (o: Record<string, string> = {}) => row({ field: 'technical', id: 'asboblar', title_uz: 'Asboblar', title_cyrl: 'Асбоблар', title_ru: 'Инструменты', order: '1', level: 'A1', ...o })
const word = (o: Record<string, string> = {}) =>
  row({
    field: 'technical', situation: 'asboblar', level: 'A1', article: 'der', term: 'Hammer', plural: 'die Hämmer',
    uz: 'bolgʻa', uz_cyrl: 'болға', ru: 'молоток', pron_uz: 'der ha-mer', pron_cyrl: 'дер ха-мер', pron_ru: 'дер ха-мер', safety: 'yoʻq', status: 'tekshiruvda', ...o
  })
const sheets = (words: Row[], extra: Partial<Sheets> = {}): Sheets => ({ fields: [field()], situations: [sit()], words, ...extra })
const errors = (s: Sheets, rules = de, opts = {}) => rowsToPacks(s, rules, opts).issues.filter((i) => i.level === 'error').map((i) => i.message)
const files = (m: Record<string, number>): FileInfo => (p) => (p in m ? { size: m[p] } : null)

describe('rowsToPacks — toʻgʻri qator', () => {
  it('nemischa ot: artikl term ga qoʻshiladi, id = soha-vaziyat-slug, holat kodi', () => {
    const { packs, issues } = rowsToPacks(sheets([word({ jobs: 'elektroniker, shk', example_term: 'Gib mir den Hammer.', example_uz: 'Bolgʻani bering.', example_cyrl: 'Болғани беринг.', example_ru: 'Дай молоток.' })]), de)
    expect(issues.filter((i) => i.level === 'error')).toEqual([])
    expect(packs).toHaveLength(1)
    const w = packs[0].words[0]
    expect(w).toMatchObject({ id: 'technical-asboblar-hammer', slug: 'hammer', term: 'der Hammer', article: 'der', plural: 'die Hämmer', jobs: ['elektroniker', 'shk'], safety: false, status: 'review' })
    expect(w.tr).toEqual({ uz: 'bolgʻa', 'uz-Cyrl': 'болға', ru: 'молоток' })
    expect(w.example?.term).toBe('Gib mir den Hammer.')
    expect(packs[0].situations[0]).toMatchObject({ id: 'asboblar', level: 'A1', order: 1 })
  })

  it('umlaut slug: Schraubenzieher → schraubenzieher, Säge → saege', () => {
    const { packs } = rowsToPacks(sheets([word({ term: 'Säge', article: 'die', plural: 'die Sägen' })]), de)
    expect(packs[0].words[0].id).toBe('technical-asboblar-saege')
  })

  it('"Das ..." bilan boshlanadigan ibora — artikl xatosi emas', () => {
    const r = rowsToPacks(sheets([word({ article: '', plural: '', term: 'Das ist im Gang drei.' }), word({ article: '', plural: '', term: 'Das haben wir leider nicht.' })]), de)
    expect(r.issues.filter((i) => i.level === 'error')).toEqual([])
  })

  it('ibora artiklsiz ham boʻladi (ogohlantirishsiz)', () => {
    const r = rowsToPacks(sheets([word({ article: '', plural: '', term: 'Vorsicht!', safety: 'ha' })]), de)
    expect(r.issues).toEqual([])
    expect(r.packs[0].words[0]).toMatchObject({ term: 'Vorsicht!', safety: true, id: 'technical-asboblar-vorsicht' })
  })

  it('rasm: yoʻl public/content/de/img/ ga bogʻlanadi, hajm tekshiriladi', () => {
    const img = 'content/de/img/technical/hammer.webp'
    const ok = rowsToPacks(sheets([word({ image_file: 'technical/hammer.webp', image_source: 'ai', image_checked: 'ha' })]), de, { fileInfo: files({ [img]: 20_000 }) })
    expect(ok.issues).toEqual([])
    expect(ok.packs[0].words[0].image).toEqual({ src: img, source: 'ai', checked: true })
    const big = rowsToPacks(sheets([word({ image_file: 'technical/hammer.webp', image_source: 'ai', image_checked: 'ha' })]), de, { fileInfo: files({ [img]: 40_000 }) })
    expect(big.issues.map((i) => i.level)).toEqual(['warning'])
  })

  it('tasdiqlangan: tekshiruvchi va sana bilan', () => {
    expect(errors(sheets([word({ status: 'tasdiqlangan', verified_by: 'A. Karimova', verified_at: '2026-11-13' })]))).toEqual([])
  })

  it('qoralamada kirill/rus tarjima yoʻq — faqat ogohlantirish', () => {
    const r = rowsToPacks(sheets([word({ status: 'qoralama', uz_cyrl: '', ru: '' })]), de)
    expect(r.issues.map((i) => i.level)).toEqual(['warning'])
  })

  it('koreys: slug va oʻqilishi bilan, id ko- prefiksli', () => {
    const r = rowsToPacks(
      sheets([word({ article: '', plural: '', term: '출구', slug: 'chulgu', level: 'ko-T1', pron_uz: 'chul-gu', pron_cyrl: 'чул-гу', pron_ru: 'чул-гу' })], { situations: [sit({ level: 'ko-T1' })] }),
      ko
    )
    expect(r.issues).toEqual([])
    expect(r.packs[0].words[0].id).toBe('ko-technical-asboblar-chulgu')
  })

  it('soʻzi yoʻq soha ham paket sifatida qaytadi (skript boʻsh paketni yozmaydi)', () => {
    expect(rowsToPacks({ fields: [field(), field({ id: 'care', order: '2' })], situations: [], words: [] }, de).packs.map((p) => p.field)).toEqual(['technical', 'care'])
  })
})

describe('rowsToPacks — xatolar', () => {
  const cases: [string, Sheets, RegExp][] = [
    ['artikl term ichida', sheets([word({ article: '', term: 'der Hammer' })]), /artiklni "article" ustuniga/],
    ['notoʻgʻri artikl', sheets([word({ article: 'dem' })]), /faqat der, die yoki das/],
    ['koʻplik artiklsiz', sheets([word({ article: '' })]), /koʻplik yozilgan, lekin artikl yoʻq/],
    ['koʻplik shakli', sheets([word({ plural: 'Hämmer' })]), /"die \.\.\." shaklida/],
    ['artikldan keyin kichik harf', sheets([word({ term: 'hammer' })]), /bosh harf/],
    ['takror id', sheets([word(), word()]), /takrorlangan/],
    ['nomaʼlum daraja', sheets([word({ level: 'C1' })]), /daraja "C1"/],
    ['nomaʼlum vaziyat', sheets([word({ situation: 'yoq-vaziyat' })]), /"Vaziyatlar" varagʻida yoʻq/],
    ['nomaʼlum soha', sheets([], { fields: [field({ id: 'bau' })] }), /nomaʼlum soha "bau"/],
    ['vaziyat sohasi yoʻq', sheets([], { situations: [sit({ field: 'care' })] }), /soha "care"/],
    ['vaziyat id formati', sheets([], { situations: [sit({ id: 'Birinchi Kun' })] }), /vaziyat id/],
    ['tarjima yoʻq', sheets([word({ uz: '' })]), /tarjima \(uz\) boʻsh/],
    ['tekshiruvda kirill yoʻq', sheets([word({ uz_cyrl: '' })]), /kirill tarjimasi yoʻq/],
    ['notoʻgʻri holat', sheets([word({ status: 'tayyor' })]), /holat \(status\) "tayyor"/],
    ['tasdiqlangan, tekshiruvchisiz', sheets([word({ status: 'tasdiqlangan' })]), /verified_by/],
    ['tasdiqlangan, sana notoʻgʻri', sheets([word({ status: 'tasdiqlangan', verified_by: 'X', verified_at: '13.11.2026' })]), /YYYY-MM-DD/],
    ['safety notoʻgʻri', sheets([word({ safety: 'balki' })]), /"ha" yoki "yoʻq"/],
    ['rasm .png', sheets([word({ image_file: 'a.png', image_source: 'ai', image_checked: 'ha' })]), /faqat \.webp/],
    ['rasm manbai notoʻgʻri', sheets([word({ image_file: 'a.webp', image_source: 'google', image_checked: 'ha' })]), /ai, own yoki cc/],
    ['cc litsenziyasiz', sheets([word({ image_file: 'a.webp', image_source: 'cc', image_checked: 'ha' })]), /litsenziya/],
    ['tasdiqlangan, rasm koʻrilmagan', sheets([word({ status: 'tasdiqlangan', verified_by: 'X', verified_at: '2026-11-13', image_file: 'a.webp', image_source: 'ai', image_checked: 'yoʻq' })]), /image_checked = ha/],
    ['audio formati', sheets([word({ audio_file: 'a.wav' })]), /mp3, ogg yoki m4a/],
    ['kasb formati', sheets([word({ jobs: 'Elektroniker' })]), /kasb "Elektroniker"/],
    ['oʻqilishi qisman', sheets([word({ status: 'qoralama', pron_cyrl: '', pron_ru: '' })]), /uch tilda toʻliq/],
    ['tekshiruvda oʻqilishisiz', sheets([word({ pron_uz: '', pron_cyrl: '', pron_ru: '' })]), /qoralamadan boshqa holatda majburiy/],
    ['ikonka nomi', sheets([word({ icon: 'Hammer' })]), /Tabler nomi/],
    ['misol tarjimasiz', sheets([word({ example_term: 'Gib mir den Hammer.' })]), /misol: gap/],
    ['id juda uzun', sheets([word({ slug: 'a'.repeat(90) })]), /belgi \(≤ 96\)/]
  ]
  it.each(cases)('%s', (_, s, re) => {
    expect(errors(s).some((m) => re.test(m))).toBe(true)
  })

  it('rasm fayli topilmasa xato, 60 KB dan katta boʻlsa xato', () => {
    const s = sheets([word({ image_file: 'technical/hammer.webp', image_source: 'ai', image_checked: 'ha' })])
    expect(errors(s, de, { fileInfo: files({}) })).toEqual(['rasm fayli topilmadi: public/content/de/img/technical/hammer.webp'])
    expect(errors(s, de, { fileInfo: files({ 'content/de/img/technical/hammer.webp': 70_000 }) })[0]).toMatch(/60 KB/)
  })

  it('ilovadagi mavjud soʻz id bilan toʻqnashuv', () => {
    expect(errors(sheets([word()]), de, { existingWordIds: new Set(['technical-asboblar-hammer']) })[0]).toMatch(/mavjud soʻz/)
  })

  it('koreys: slugsiz va oʻqilishisiz — xato; artikl ishlatilmaydi', () => {
    expect(errors(sheets([word({ article: '', plural: '', term: '출구', level: 'ko-T1' })], { situations: [sit({ level: 'ko-T1' })] }), ko)[0]).toMatch(/slug majburiy/)
    const e = errors(sheets([word({ term: '출구', slug: 'chulgu', level: 'ko-T1' })], { situations: [sit({ level: 'ko-T1' })] }), ko)
    expect(e).toEqual(expect.arrayContaining(['bu kursda artikl ustuni ishlatilmaydi', 'bu kursda koʻplik ustuni ishlatilmaydi']))
    expect(errors(sheets([word({ article: '', plural: '', term: '출구', slug: 'chulgu', level: 'ko-T1', pron_uz: '', pron_cyrl: '', pron_ru: '' })], { situations: [sit({ level: 'ko-T1' })] }), ko)).toContain('oʻqilishi (pron_uz, pron_cyrl, pron_ru) bu kursda majburiy')
  })

  it('xato qayerda ekanini qator raqami bilan aytadi', () => {
    n = 3
    const s: Sheets = { fields: [field()], situations: [sit()], words: [] }
    s.words = [word({ level: 'C1' })]
    expect(rowsToPacks(s, de).issues[0].where).toBe('Sozlar, 5-qator')
  })
})

describe('yesNo', () => {
  it.each([
    ['ha', true], ['Ha', true], ['yoʻq', false], ["yo'q", false], ['yo‘q', false], ['', false], ['balki', undefined]
  ] as const)('%s', (v, want) => expect(yesNo(v)).toBe(want))
})
