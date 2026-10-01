-- دنتینو — اسکیمای Supabase
-- این فایل را یک بار در Supabase → SQL Editor اجرا کنید.

create table if not exists public.records (
  coll        text        not null,
  id          text        not null,
  data        jsonb       not null default '{}'::jsonb,
  deleted     boolean     not null default false,
  updated_at  timestamptz not null default now(),
  updated_by  text,
  primary key (coll, id)
);

create index if not exists records_updated_at_idx on public.records (updated_at);

-- زمان تغییر همیشه سمت سرور ثبت می‌شود (برای همگام‌سازی افزایشی)
create or replace function public.records_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end $$;

drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
for each row execute function public.records_touch();

-- امنیت: فقط کاربرانی که در لیست کارکنان مطب (staff) هستند به داده دسترسی دارند.
-- (اولین کاربری که وارد شود، وقتی هنوز هیچ کارمندی ثبت نشده، به‌عنوان مدیر ثبت می‌شود.)
-- بنابراین حتی اگر کسی خودش در Supabase حساب بسازد، بدون تأیید مدیر هیچ داده‌ای نمی‌بیند.
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    exists (select 1 from public.records r
            where r.coll = 'staff' and not r.deleted
              and r.id = split_part(auth.jwt() ->> 'email', '@', 1))
    or not exists (select 1 from public.records r where r.coll = 'staff' and not r.deleted)
  );
$$;

alter table public.records enable row level security;

drop policy if exists "staff read"   on public.records;
drop policy if exists "staff insert" on public.records;
drop policy if exists "staff update" on public.records;

create policy "staff read"   on public.records for select to authenticated using (public.is_staff());
create policy "staff insert" on public.records for insert to authenticated with check (public.is_staff());
create policy "staff update" on public.records for update to authenticated using (public.is_staff()) with check (public.is_staff());
-- حذف فیزیکی مجاز نیست؛ حذف‌ها به صورت deleted=true ثبت می‌شوند (قابل بازیابی)

-- همگام‌سازی لحظه‌ای بین دستگاه‌ها
do $$ begin
  alter publication supabase_realtime add table public.records;
exception when duplicate_object then null; end $$;
