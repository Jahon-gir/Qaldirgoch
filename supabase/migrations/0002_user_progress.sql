-- Qaldirg'och 0002: yo'l xaritasi progressi (belgilangan vazifa va hujjatlar).
-- Supabase SQL Editor'da QO'LDA ishga tushiriladi (avtomatik emas). Qayta ishga tushirsa ham xato bermaydi.
-- Faqat element id va belgilangan vaqt saqlanadi; hujjat fayllari saqlanmaydi.

create table if not exists public.user_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null check (char_length(item_id) between 1 and 64),
  done_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.user_progress enable row level security;

-- Foydalanuvchi faqat o'z qatorlarini o'qiydi, yozadi va o'chiradi.
drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select_own" on public.user_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_progress_insert_own" on public.user_progress;
create policy "user_progress_insert_own" on public.user_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- upsert (on conflict do update) uchun kerak
drop policy if exists "user_progress_update_own" on public.user_progress;
create policy "user_progress_update_own" on public.user_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_progress_delete_own" on public.user_progress;
create policy "user_progress_delete_own" on public.user_progress
  for delete to authenticated
  using ((select auth.uid()) = user_id);
