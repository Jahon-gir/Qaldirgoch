/**
 * Edge Function `ai-ask`: kirgan foydalanuvchining savoliga faqat tasdiqlangan kontentdan javob.
 * Kalit FAQAT Supabase Secrets'da (OPENAI_API_KEY yoki AI_API_KEY). Brauzerga hech qachon chiqmaydi.
 * Oqim: CORS → token (Supabase Auth) → savolni tekshirish → kunlik limit (ai_take_quota) → parchalar → model → javob + manbalar.
 */
import knowledge from './knowledge.json' with { type: 'json' }
import { asLang, buildMessages, checkQuestion, DAILY_LIMIT, GUEST_LIMIT, GUEST_TOTAL, noInfo, parseAnswer, rank, type Chunk } from './core.ts'
import { chat, configFromEnv } from './provider.ts'
import { memoryTake } from './limit.ts'

const KB = knowledge as Chunk[]
const env = (k: string) => Deno.env.get(k)
const SUPABASE_URL = env('SUPABASE_URL')!
const ANON = env('SUPABASE_ANON_KEY')!
const SERVICE = env('SUPABASE_SERVICE_ROLE_KEY')!
const ALLOWED = (env('AI_ALLOWED_ORIGINS') || 'https://jahon-gir.github.io,http://localhost:5173,http://localhost:4173').split(',')

function cors(origin: string | null): Record<string, string> {
  const ok = origin && ALLOWED.includes(origin) ? origin : ALLOWED[0]
  return {
    'Access-Control-Allow-Origin': ok,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin'
  }
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get('Origin'))
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...h, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  // 1) Kim soʻrayapti: kirgan foydalanuvchi yoki mehmon (IP xeshi boʻyicha, IP oʻzi saqlanmaydi)
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  let userId: string | null = null
  if (token && token !== ANON) {
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: ANON } }).catch(() => null)
    if (u?.ok) userId = (await u.json())?.id ?? null
  }
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'nomaʼlum'
  const guestKey = userId ? null : await sha256(`${ip}|${(SERVICE || '').slice(-16)}`)

  // 2) Savol
  let body: { question?: unknown; lang?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'empty' }, 400)
  }
  const lang = asLang(body.lang)
  const q = checkQuestion(body.question)
  if (!q.ok) return json({ error: q.code }, 400)

  const cfg = configFromEnv(env)
  if (!cfg) return json({ error: 'config' }, 503)

  // 3) Kunlik limit. Jadval (migratsiya 0006/0007) boʻlmasa yoki xato boʻlsa — xotiradagi limit (taqdimotda toʻxtamasin)
  const left = await takeQuota(userId, guestKey ?? '')
  if (left < 0) return json({ error: 'limit', limit: userId ? DAILY_LIMIT : GUEST_LIMIT }, 429)

  // 4) Parchalar → model → javob
  const chunks = rank(q.q, KB)
  if (!chunks.length) return json({ ...noInfo(lang), left })
  try {
    const raw = await chat(cfg, buildMessages(q.q, chunks, lang))
    return json({ ...parseAnswer(raw, chunks, lang), left })
  } catch (e) {
    console.error('ai', String(e))
    return json({ error: 'ai' }, 502)
  }
})

async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function takeQuota(userId: string | null, guestKey: string): Promise<number> {
  const [fn, body, limit] = userId
    ? ['ai_take_quota', { p_user: userId, p_limit: DAILY_LIMIT }, DAILY_LIMIT]
    : ['ai_take_guest_quota', { p_who: guestKey, p_limit: GUEST_LIMIT, p_total: GUEST_TOTAL }, GUEST_LIMIT]
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (r.ok) return (await r.json()) as number
    console.error('quota', fn, r.status, (await r.text()).slice(0, 200))
  } catch (e) {
    console.error('quota', String(e))
  }
  return memoryTake(userId ?? guestKey, limit, GUEST_TOTAL)
}
