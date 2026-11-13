/**
 * Model provayderi — BITTA joy. Hozir OpenAI; keyin universitet serveridagi ochiq model
 * (OpenAI'ga mos API: vLLM, Ollama va h.k.) — faqat Secrets oʻzgaradi, kod emas:
 *   AI_BASE_URL  (standart https://api.openai.com/v1)
 *   AI_API_KEY   yoki OPENAI_API_KEY
 *   AI_MODEL     (standart gpt-4.1 — oʻzbek tilida mini'dan ancha yaxshi)
 */
import type { Msg } from './core.ts'

export type ChatConfig = { baseUrl: string; apiKey: string; model: string }

export function configFromEnv(get: (k: string) => string | undefined): ChatConfig | null {
  const apiKey = get('AI_API_KEY') || get('OPENAI_API_KEY') || ''
  const baseUrl = (get('AI_BASE_URL') || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const model = get('AI_MODEL') || 'gpt-4.1'
  // Oʻz serverimizdagi modelga kalit shart boʻlmasligi mumkin; OpenAI'ga esa shart
  if (!apiKey && baseUrl.includes('api.openai.com')) return null
  return { baseUrl, apiKey, model }
}

/** Chat Completions (OpenAI'ga mos) — JSON javob soʻraladi. Matn qaytaradi. */
export async function chat(cfg: ChatConfig, messages: Msg[], fetchFn: typeof fetch = fetch): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 25_000)
  try {
    const res = await fetchFn(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cfg.apiKey && { Authorization: `Bearer ${cfg.apiKey}` }) },
      // Reasoning modellari (gpt-5*, o*) temperature qabul qilmaydi
      body: JSON.stringify({ model: cfg.model, messages, response_format: { type: 'json_object' }, max_completion_tokens: 700, ...(!/^(gpt-5|o\d)/.test(cfg.model) && { temperature: 0.2 }) }),
      signal: ctrl.signal
    })
    if (!res.ok) throw new Error(`provider ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const j = await res.json()
    const text = j?.choices?.[0]?.message?.content
    if (typeof text !== 'string') throw new Error('provider: boʻsh javob')
    return text
  } finally {
    clearTimeout(timer)
  }
}
