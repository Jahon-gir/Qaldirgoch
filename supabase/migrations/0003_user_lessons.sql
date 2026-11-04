-- Qaldirg'och 0003: til darslari natijalari (har dars uchun eng yuqori ball).
-- Supabase SQL Editor'da QO'LDA ishga tushiriladi (avtomatik emas). Qayta ishga tushirsa ham xato bermaydi.
-- Faqat dars id, ball va tugatilgan vaqt saqlanadi.

create table if not exists public.user_lessons (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) between 1 and 64),
  score int not null check (score >= 0),
  total int not null check (total > 0),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id),
  check (score <= total)
);

alter table public.user_lessons enable row level security;

-- Foydalanuvchi faqat o'z qatorlarini o'qiydi va yozadi.
drop policy if exists "user_lessons_select_own" on public.user_lessons;
create policy "user_lessons_select_own" on public.user_lessons
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_lessons_insert_own" on public.user_lessons;
create policy "user_lessons_insert_own" on public.user_lessons
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- upsert (on conflict do update) uchun kerak: yuqoriroq ball bilan yangilash
drop policy if exists "user_lessons_update_own" on public.user_lessons;
create policy "user_lessons_update_own" on public.user_lessons
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
