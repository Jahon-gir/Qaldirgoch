-- Qaldirg'och 0004: so'zlarni takrorlash (spaced repetition) va kunlik faollik.
-- Supabase SQL Editor'da QO'LDA ishga tushiriladi (avtomatik emas). Qayta ishga tushirsa ham xato bermaydi.
-- Faqat so'z id, takrorlash jadvali va kunlik mashqlar soni saqlanadi (shaxsiy ma'lumot yo'q).

create table if not exists public.user_words (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id text not null check (char_length(word_id) between 1 and 96),
  keyingi_takror date not null,
  interval int not null check (interval between 1 and 365),
  xatolar int not null default 0 check (xatolar >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

create table if not exists public.user_daily_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  sana date not null,
  mashqlar_soni int not null default 0 check (mashqlar_soni between 0 and 100000),
  kechirim boolean not null default false,
  primary key (user_id, sana)
);

alter table public.user_words enable row level security;
alter table public.user_daily_activity enable row level security;

-- Foydalanuvchi faqat o'z qatorlarini o'qiydi va yozadi (upsert uchun insert + update).
drop policy if exists "user_words_select_own" on public.user_words;
create policy "user_words_select_own" on public.user_words
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_words_insert_own" on public.user_words;
create policy "user_words_insert_own" on public.user_words
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_words_update_own" on public.user_words;
create policy "user_words_update_own" on public.user_words
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_daily_activity_select_own" on public.user_daily_activity;
create policy "user_daily_activity_select_own" on public.user_daily_activity
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_daily_activity_insert_own" on public.user_daily_activity;
create policy "user_daily_activity_insert_own" on public.user_daily_activity
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_daily_activity_update_own" on public.user_daily_activity;
create policy "user_daily_activity_update_own" on public.user_daily_activity
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
