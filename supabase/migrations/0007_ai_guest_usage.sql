-- 0007: AI maslahatchi — mehmonlar (kirmaganlar) uchun kunlik limit (0.18.1).
-- `who` — IP xeshi (IP oʻzi saqlanmaydi). RLS yoqilgan, siyosat yoʻq: faqat Edge Function (service_role).
create table if not exists public.ai_guest_usage (
  who text not null,
  day date not null default (now() at time zone 'Asia/Tashkent')::date,
  count int not null default 0,
  primary key (who, day)
);
alter table public.ai_guest_usage enable row level security;

-- Qolgan savollar soni; bitta mehmon limiti (p_limit) yoki barcha mehmonlar kunlik jami (p_total) tugasa -1.
create or replace function public.ai_take_guest_quota(p_who text, p_limit int, p_total int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (now() at time zone 'Asia/Tashkent')::date;
  c int;
begin
  if (select coalesce(sum(count), 0) from public.ai_guest_usage where day = d) >= p_total then return -1; end if;
  insert into public.ai_guest_usage (who, day, count) values (p_who, d, 0)
  on conflict (who, day) do nothing;
  update public.ai_guest_usage set count = count + 1
   where who = p_who and day = d and count < p_limit
  returning count into c;
  if c is null then return -1; end if;
  return p_limit - c;
end;
$$;
revoke all on function public.ai_take_guest_quota(text, int, int) from public, anon, authenticated;
grant execute on function public.ai_take_guest_quota(text, int, int) to service_role;
