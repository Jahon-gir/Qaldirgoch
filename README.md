# Qaldirg'och

Chet elda qonuniy ishlash uchun yo'l ko'rsatuvchi ilova: Germaniya (Ausbildung) yo'l xaritasi,
kasbiy nemis tili va firibgarlikdan himoya.

- Loyiha qoidalari: CLAUDE.md
- Texnik topshiriq: docs/TZ.md

Holat: 0.5.0 — Ausbildung yo'l xaritasi (10 bosqich) va nemis tili kursi (A1, 1-modul: 6 dars; kontent tekshiruvda).

## Lokal ishlab chiqish

```bash
npm ci
cp .env.example .env.local   # va qiymatlarni to'ldiring
npm run dev                  # http://localhost:5173/
npm test
```

`.env.local` ichida faqat ommaviy kalitlar bo'ladi (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
`service_role` kalitni hech qayerga yozmang. Env bo'lmasa ilova mehmon rejimida ishlaydi, kirish tugmasi o'rniga xabar chiqadi.

## Supabase

1. `supabase/migrations/0001_profiles.sql`, `0002_user_progress.sql` va `0003_user_lessons.sql` ni (shu tartibda) Supabase → SQL Editor'da qo'lda ishga tushiring.
2. Authentication → Providers → Google ni yoqing (Google Cloud'dagi OAuth client ID va secret).
3. Authentication → URL Configuration → Redirect URLs ga qo'shing:
   `https://jahon-gir.github.io/Qaldirgoch/` va `http://localhost:5173/`.
4. GitHub → Settings → Secrets and variables → Actions → **Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
