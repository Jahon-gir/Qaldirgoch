-- Qaldirg'och 0005: xususiy bandlik agentliklari reestri (Migratsiya agentligi reestri nusxasi).
-- Supabase SQL Editor'da QO'LDA ishga tushiriladi (avtomatik emas). Qayta ishga tushirsa ham xato bermaydi.
-- Ommaviy ma'lumot: o'qish hamma uchun ochiq (mehmon ham), yozish siyosati YO'Q — qatorlar faqat SQL Editor/seed orqali o'zgaradi.
-- Rahbar ismi, STIR va reestrdagi "reyting" saqlanmaydi. Litsenziya muddatsiz, shuning uchun "muddati" ustuni yo'q.
-- Seed: supabase/seed/agencies.sql (scripts/import-agencies.mjs hosil qiladi) — shundan KEYIN ishga tushiriladi.

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  nomi text not null check (char_length(nomi) between 1 and 300),
  nomi_norm text not null,
  litsenziya_raqami text not null check (litsenziya_raqami ~ '^[0-9]+$'),
  litsenziya_sanasi date,
  manzil text,
  telefonlar text[] not null default '{}',
  telefonlar_norm text[] not null default '{}',
  email text,
  manba_url text not null,
  reestr_yangilangan date not null,
  tekshirilgan date not null
);

-- Seed shu kalit bo'yicha yangilaydi (on conflict)
create unique index if not exists agencies_litsenziya_raqami_key on public.agencies (litsenziya_raqami);

alter table public.agencies enable row level security;

drop policy if exists "agencies_select_public" on public.agencies;
create policy "agencies_select_public" on public.agencies
  for select to anon, authenticated
  using (true);
-- insert / update / delete siyosati ataylab yo'q: klient jadvalni o'zgartira olmaydi.
