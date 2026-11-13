/**
 * Edge Function `ai-ask`: kirgan foydalanuvchining savoliga faqat tasdiqlangan kontentdan javob.
 * Kalit FAQAT Supabase Secrets'da (OPENAI_API_KEY yoki AI_API_KEY). Brauzerga hech qachon chiqmaydi.
 * Oqim: CORS → token (Supabase Auth) → savolni tekshirish → kunlik limit (ai_take_quota) → parchalar → model → javob + manbalar.
 */
import knowledge from './knowledge.json' with { type: 'json' }
import { asLang, buildMessages, checkQuestion, DAILY_LIMIT, noInfo, parseAnswer, rank, type Chunk } from './core.ts'
import { chat, configFromEnv } from './provider.ts'

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

  // 1) Kim soʻrayapti: faqat kirgan foydalanuvchi
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'auth' }, 401)
  const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: ANON } })
  if (!u.ok) return json({ error: 'auth' }, 401)
  const user = await u.json()
  if (!user?.id) return json({ error: 'auth' }, 401)

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

  // 3) Kunlik limit (atomar; jadvalga faqat service_role yozadi)
  const quota = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ai_take_quota`, {
    method: 'POST',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_user: user.id, p_limit: DAILY_LIMIT })
  })
  if (!quota.ok) {
    console.error('quota', quota.status, await quota.text())
    return json({ error: 'config' }, 503)
  }
  const left = (await quota.json()) as number
  if (left < 0) return json({ error: 'limit', limit: DAILY_LIMIT }, 429)

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
