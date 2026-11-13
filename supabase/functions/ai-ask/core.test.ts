import { describe, expect, it } from 'vitest'
import { buildKnowledge } from '../../../scripts/build-ai-knowledge'
import knowledge from './knowledge.json'
import { buildMessages, checkQuestion, countriesOf, parseAnswer, rank, rankScored, sanitize, type Chunk } from './core'
import { chat, configFromEnv } from './provider'

const KB = knowledge as Chunk[]

describe('bilim bazasi', () => {
  it('knowledge.json ilova kontenti bilan bir xil (oʻzgarsa: npm run ai:knowledge)', () => {
    expect(KB).toEqual(JSON.parse(JSON.stringify(buildKnowledge())))
  })
  it('har parchada manba (URL + sana) bor, toʻldirilmagan {oʻrin} yoʻq', () => {
    for (const c of KB) {
      expect(c.sources.length, c.id).toBeGreaterThan(0)
      for (const s of c.sources) {
        expect(s.url).toMatch(/^https:\/\//)
        expect(s.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
      expect(c.uz).not.toMatch(/\{\w+\}/)
    }
  })
})

describe('savol', () => {
  it('boʻsh va uzun savol rad etiladi, boʻshliqlar siqiladi', () => {
    expect(checkQuestion('  ')).toEqual({ ok: false, code: 'empty' })
    expect(checkQuestion(42)).toEqual({ ok: false, code: 'empty' })
    expect(checkQuestion('a'.repeat(501))).toEqual({ ok: false, code: 'long' })
    expect(checkQuestion(' Ausbildung   nima? ')).toEqual({ ok: true, q: 'Ausbildung nima?' })
  })
})

describe('qidiruv', () => {
  const top = (q: string) => rank(q, KB, 3).map((c) => c.id)
  it('mos parcha birinchi oʻrinlarda', () => {
    expect(top('Ausbildung uchun qancha pul kerak?')).toContain('ausbildung-yol')
    expect(top('Agentlik litsenziyasini qanday tekshiraman?')[0]).toBe('xavfsizlik-agentlik')
    expect(top('Агентликни қандай текширaman')[0]).toBe('xavfsizlik-agentlik')
    expect(top('Chancenkarte nima?')[0]).toBe('yol-de-chancenkarte')
  })
})

describe('javob', () => {
  const chunks = KB.slice(0, 3)
  const all = new Set(chunks.map((c) => c.id))
  it('fact: manbalar parchadan olinadi', () => {
    const r = parseAnswer(JSON.stringify({ type: 'fact', answer: 'Javob', sources: [chunks[0].id] }), chunks, 'uz', all)
    expect(r).toEqual({ answer: 'Javob', found: true, kind: 'fact', sources: chunks[0].sources })
  })
  it('chat ("sen kimsan"): manbasiz, belgisiz', () => {
    const r = parseAnswer(JSON.stringify({ type: 'chat', answer: "Men Migra maslahatchisiman, bo'yicha", sources: [chunks[0].id] }), chunks, 'uz', all)
    expect(r).toEqual({ answer: 'Men Migra maslahatchisiman, boʻyicha', found: false, kind: 'chat', sources: [] })
  })
  it('savolga mos kelmagan parcha manba boʻla olmaydi → no_info', () => {
    const r = parseAnswer(JSON.stringify({ type: 'fact', answer: 'X', sources: [chunks[0].id] }), chunks, 'uz', new Set())
    expect(r.kind).toBe('no_info')
    expect(r.sources).toEqual([])
    expect(r.answer).toMatch(/^Bu savol boʻyicha menda/)
  })
  it('notoʻgʻri id yoki JSON emas — no_info, standart matn', () => {
    expect(parseAnswer(JSON.stringify({ type: 'fact', answer: 'X', sources: ['boshqa'] }), chunks, 'uz', all).kind).toBe('no_info')
    expect(parseAnswer('json emas', chunks, 'ru').answer).toMatch(/нет проверенной/)
  })
  it('HTML tozalanadi', () => {
    expect(sanitize('<img src=x onerror=alert(1)>Salom <b>dunyo</b>')).toBe('Salom dunyo')
    const r = parseAnswer(JSON.stringify({ type: 'chat', answer: '<script>alert(1)</script>ok', sources: [] }), chunks, 'uz')
    expect(r.answer).toBe('alert(1)ok')
  })
  it('tizim xabari: qoidalar, til, misollar va parchalar; "qilsin" yoʻq', () => {
    const [sys, user] = buildMessages('Savol?', chunks, 'uz-Cyrl')
    expect(sys.content).toContain('Noqonuniy')
    expect(sys.content).toContain('kirill')
    expect(sys.content).toContain('"type":"chat"')
    expect(sys.content).toContain(`[${chunks[0].id}]`)
    expect(sys.content).not.toMatch(/qilsin/)
    expect(user).toEqual({ role: 'user', content: 'Savol?' })
  })
  it('kichik suhbatda hech bir parcha ball olmaydi', () => {
    expect(rankScored('Sen kimsan', KB).every((x) => x.score === 0)).toBe(true)
    expect(rankScored('Ausbildung uchun qancha pul kerak?', KB)[0].score).toBeGreaterThan(0)
  })
})

describe('davlatlar', () => {
  it('roʻyxat kontentdan olinadi; tanishtiruv bitta davlatga bogʻlanmaydi', () => {
    expect(countriesOf(KB)).toEqual(['Germaniya'])
    expect(countriesOf(KB, 'ru')).toEqual(['Германия'])
    const [sys] = buildMessages('Salom', KB.slice(0, 1), 'uz', ['Germaniya', 'Janubiy Koreya'])
    expect(sys.content).toContain('davlat(lar): Germaniya, Janubiy Koreya')
    expect(sys.content).toContain('Chet elda qonuniy ishlash')
    expect(sys.content).not.toMatch(/faqat Germaniyada/)
  })
})

describe('provayder', () => {
  it('OpenAI kalitsiz ishlamaydi; oʻz serverimizda kalit ixtiyoriy', () => {
    expect(configFromEnv(() => undefined)).toBeNull()
    const env: Record<string, string> = { OPENAI_API_KEY: 'k' }
    expect(configFromEnv((k) => env[k])).toEqual({ baseUrl: 'https://api.openai.com/v1', apiKey: 'k', model: 'gpt-4.1' })
    const uni: Record<string, string> = { AI_BASE_URL: 'http://10.0.0.5:8000/v1/', AI_MODEL: 'qwen' }
    expect(configFromEnv((k) => uni[k])).toEqual({ baseUrl: 'http://10.0.0.5:8000/v1', apiKey: '', model: 'qwen' })
  })
  it('chat/completions ga JSON soʻrov yuboradi', async () => {
    let url = ''
    let body: { model?: string; response_format?: unknown } = {}
    const f = (async (u: string, init: RequestInit) => {
      url = u
      body = JSON.parse(String(init.body))
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"answer":"a"}' } }] }))
    }) as unknown as typeof fetch
    const text = await chat({ baseUrl: 'https://x/v1', apiKey: 'k', model: 'm' }, [{ role: 'user', content: 'q' }], f)
    expect(text).toBe('{"answer":"a"}')
    expect(url).toBe('https://x/v1/chat/completions')
    expect(body.model).toBe('m')
    expect(body.response_format).toEqual({ type: 'json_object' })
  })
})

describe('zaxira limit (xotirada)', () => {
  it('kalit va jami limit, kun almashganda tozalanadi', async () => {
    const { memoryTake } = await import('./limit')
    const d1 = new Date('2026-11-13T06:00:00Z')
    expect(memoryTake('a', 2, 3, d1)).toBe(1)
    expect(memoryTake('a', 2, 3, d1)).toBe(0)
    expect(memoryTake('a', 2, 3, d1)).toBe(-1)
    expect(memoryTake('b', 2, 3, d1)).toBe(1)
    expect(memoryTake('c', 2, 3, d1)).toBe(-1) // jami 3 tugadi
    expect(memoryTake('a', 2, 3, new Date('2026-11-14T06:00:00Z'))).toBe(1)
  })
})
