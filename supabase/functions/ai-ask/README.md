# ai-ask — AI maslahatchi (0.18.0)

Savol → bilim bazasidan mos parchalar (`knowledge.json`, faqat manbali tasdiqlangan matn) → model → javob + manba va sana.

- `core.ts` — savolni tekshirish, kalit soʻz qidiruvi, tizim xabari, javobni tozalash (vitest bilan sinalgan).
- `provider.ts` — model provayderi (bitta joy). Secrets: `OPENAI_API_KEY` (yoki `AI_API_KEY`), ixtiyoriy `AI_MODEL` (standart `gpt-4.1-mini`), `AI_BASE_URL` (universitet serveri: OpenAI'ga mos manzil, masalan `http://<server>/v1`).
- `index.ts` — Deno handler. Kirish shart emas (0.18.1): kirgan foydalanuvchiga kuniga 20 savol (`ai_take_quota`, 0006), mehmonga bitta IP'dan 10 va hamma mehmonlarga jami 300 (`ai_take_guest_quota`, 0007; IP xeshi, IP saqlanmaydi). Jadval boʻlmasa — xotiradagi zaxira limit (`limit.ts`).
- Kontent oʻzgarsa: `npm run ai:knowledge` (test farqni ushlaydi).

## Bir martalik sozlash (qoʻlda)
1. Supabase → SQL Editor: `0006_ai_usage.sql` va `0007_ai_guest_usage.sql` (tavsiya; ishga tushirilmasa ham AI ishlaydi, faqat limit xotirada).
2. Supabase → Edge Functions → Secrets: `OPENAI_API_KEY`. Kalit hech qayerga (chat, kod, GitHub) yozilmaydi.
3. Joylash: GitHub → Settings → Secrets and variables → Actions → `SUPABASE_ACCESS_TOKEN` (supabase.com/dashboard/account/tokens), keyin Actions → "AI funksiyasini joylash" → Run workflow. Yoki: `supabase functions deploy ai-ask --no-verify-jwt`.
4. OpenAI kabinetida oylik pul limiti.
