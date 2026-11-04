-- Qaldirg'och 0001: foydalanuvchi profili.
-- Supabase SQL Editor'da qo'lda ishga tushiriladi. Qayta ishga tushirsa ham xato bermaydi.

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  -- Profil javoblari (ilovadagi Profile shakli). Sxema versiyasi data.schemaVersion ichida.
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Foydalanuvchi faqat o'z qatorini ko'radi va yozadi. Delete siyosati yo'q: qator faqat akkaunt o'chganda (cascade) yo'qoladi.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
