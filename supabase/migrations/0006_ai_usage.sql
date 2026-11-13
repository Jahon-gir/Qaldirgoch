-- 0006: AI maslahatchi — kunlik savol limiti (0.18.0, Edge Function ai-ask).
-- Jadvalga klient (anon, authenticated) tegmaydi: RLS yoqilgan, siyosat yoʻq. Faqat Edge Function (service_role) chaqiradi.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Tashkent')::date,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;

-- Bitta savolni hisoblaydi. Qolgan savollar sonini qaytaradi; limit tugagan boʻlsa -1 (hisob oshmaydi).
create or replace function public.ai_take_quota(p_user uuid, p_limit int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (now() at time zone 'Asia/Tashkent')::date;
  c int;
begin
  insert into public.ai_usage (user_id, day, count) values (p_user, d, 0)
  on conflict (user_id, day) do nothing;
  update public.ai_usage set count = count + 1
   where user_id = p_user and day = d and count < p_limit
  returning count into c;
  if c is null then return -1; end if;
  return p_limit - c;
end;
$$;
revoke all on function public.ai_take_quota(uuid, int) from public, anon, authenticated;
grant execute on function public.ai_take_quota(uuid, int) to service_role;
