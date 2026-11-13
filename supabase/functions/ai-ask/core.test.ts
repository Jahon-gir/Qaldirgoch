import { describe, expect, it } from 'vitest'
import { buildKnowledge } from '../../../scripts/build-ai-knowledge'
import knowledge from './knowledge.json'
import { buildMessages, checkQuestion, parseAnswer, rank, sanitize, type Chunk } from './core'
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
  it('manbali javob: manbalar parchadan olinadi', () => {
    const r = parseAnswer(JSON.stringify({ answer: 'Javob', found: true, sources: [chunks[0].id] }), chunks, 'uz')
    expect(r.found).toBe(true)
    expect(r.sources).toEqual(chunks[0].sources)
  })
  it('manbasiz yoki notoʻgʻri id — found=false, manba yoʻq', () => {
    expect(parseAnswer(JSON.stringify({ answer: 'X', found: true, sources: ['boshqa'] }), chunks, 'uz')).toEqual({ answer: 'X', found: false, sources: [] })
    expect(parseAnswer('json emas', chunks, 'ru').answer).toMatch(/нет проверенной/)
  })
  it('HTML tozalanadi', () => {
    expect(sanitize('<img src=x onerror=alert(1)>Salom <b>dunyo</b>')).toBe('Salom dunyo')
    const r = parseAnswer(JSON.stringify({ answer: '<script>alert(1)</script>ok', found: false, sources: [] }), chunks, 'uz')
    expect(r.answer).toBe('alert(1)ok')
  })
  it('tizim xabarida qoidalar, til va parchalar bor', () => {
    const [sys, user] = buildMessages('Savol?', chunks, 'uz-Cyrl')
    expect(sys.content).toContain('Noqonuniy')
    expect(sys.content).toContain('kirill')
    expect(sys.content).toContain(`[${chunks[0].id}]`)
    expect(user).toEqual({ role: 'user', content: 'Savol?' })
  })
})

describe('provayder', () => {
  it('OpenAI kalitsiz ishlamaydi; oʻz serverimizda kalit ixtiyoriy', () => {
    expect(configFromEnv(() => undefined)).toBeNull()
    const env: Record<string, string> = { OPENAI_API_KEY: 'k' }
    expect(configFromEnv((k) => env[k])).toEqual({ baseUrl: 'https://api.openai.com/v1', apiKey: 'k', model: 'gpt-4.1-mini' })
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
