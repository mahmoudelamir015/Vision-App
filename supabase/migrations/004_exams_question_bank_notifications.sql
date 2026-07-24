-- Real tables for exams, question bank, and notifications.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  role text,
  auth_user_id uuid,
  stage text,
  grade text,
  track text,
  school_name text,
  parent_phone text,
  subjects jsonb not null default '[]'::jsonb,
  student_code text,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists name text;
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists role text;
alter table public.users add column if not exists auth_user_id uuid;
alter table public.users add column if not exists stage text;
alter table public.users add column if not exists grade text;
alter table public.users add column if not exists track text;
alter table public.users add column if not exists school_name text;
alter table public.users add column if not exists parent_phone text;
alter table public.users add column if not exists subjects jsonb not null default '[]'::jsonb;
alter table public.users add column if not exists student_code text;
alter table public.users add column if not exists extra jsonb not null default '{}'::jsonb;
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();

create or replace function public.current_user_role()
returns text
as $$
  select u.role
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1;
$$ language sql stable security definer set search_path = public;

create or replace function public.is_admin_user()
returns boolean
as $$
  select coalesce(public.current_user_role() in ('master_admin', 'staff'), false);
$$ language sql stable security definer set search_path = public;

create or replace function public.touch_updated_at()
returns trigger
as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  owner text,
  account_type text,
  amount numeric not null default 0,
  reason text,
  student_phone text,
  created_at timestamptz not null default now()
);

alter table public.wallets add column if not exists owner text;
alter table public.wallets add column if not exists account_type text;
alter table public.wallets add column if not exists amount numeric not null default 0;
alter table public.wallets add column if not exists reason text;
alter table public.wallets add column if not exists student_phone text;
alter table public.wallets add column if not exists created_at timestamptz not null default now();

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  student_phone text,
  stage text,
  grade text,
  track text,
  address text,
  code text,
  qr_value text,
  created_at timestamptz not null default now()
);

alter table public.attendance add column if not exists student_name text;
alter table public.attendance add column if not exists student_phone text;
alter table public.attendance add column if not exists stage text;
alter table public.attendance add column if not exists grade text;
alter table public.attendance add column if not exists track text;
alter table public.attendance add column if not exists address text;
alter table public.attendance add column if not exists code text;
alter table public.attendance add column if not exists qr_value text;
alter table public.attendance add column if not exists created_at timestamptz not null default now();

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  wallet_enabled boolean not null default true,
  registration_open boolean not null default false,
  show_results boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.system_settings add column if not exists wallet_enabled boolean not null default true;
alter table public.system_settings add column if not exists registration_open boolean not null default false;
alter table public.system_settings add column if not exists show_results boolean not null default true;
alter table public.system_settings add column if not exists created_at timestamptz not null default now();
alter table public.system_settings add column if not exists updated_at timestamptz not null default now();

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  stage text,
  grade text,
  track text,
  pricing_mode text not null default 'free' check (pricing_mode in ('free', 'paid')),
  duration_minutes integer not null default 0,
  shuffle_questions boolean not null default false,
  published_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_order integer not null,
  title text not null,
  type text not null check (type in ('mcq', 'true_false')),
  text text not null,
  image_url text,
  options jsonb not null default '[]'::jsonb,
  correct_answer integer not null default 0,
  explanation text,
  stage text,
  grade text,
  track text,
  subject text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_exam_questions_exam_order on public.exam_questions (exam_id, question_order);

create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('mcq', 'true_false')),
  text text not null,
  image_url text,
  options jsonb not null default '[]'::jsonb,
  correct_answer integer not null default 0,
  explanation text,
  stage text,
  grade text,
  track text,
  subject text,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience_role text,
  stage text,
  grade text,
  track text,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists touch_exams_updated_at on public.exams;
create trigger touch_exams_updated_at
before update on public.exams
for each row execute function public.touch_updated_at();

drop trigger if exists touch_question_bank_updated_at on public.question_bank;
create trigger touch_question_bank_updated_at
before update on public.question_bank
for each row execute function public.touch_updated_at();

drop trigger if exists touch_notifications_updated_at on public.notifications;
create trigger touch_notifications_updated_at
before update on public.notifications
for each row execute function public.touch_updated_at();

alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.question_bank enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "exams_select_published_or_owner" on public.exams;
drop policy if exists "exams_write_admin_or_owner" on public.exams;
create policy "exams_select_published_or_owner"
  on public.exams
  for select
  using (
    published_at is not null
    or public.is_admin_user()
    or (auth.uid() is not null and created_by = auth.uid())
  );
create policy "exams_write_admin_or_owner"
  on public.exams
  for all
  using (public.is_admin_user() or (auth.uid() is not null and created_by = auth.uid()))
  with check (public.is_admin_user() or (auth.uid() is not null and created_by = auth.uid()));

drop policy if exists "exam_questions_select_published_or_admin" on public.exam_questions;
drop policy if exists "exam_questions_write_admin_or_owner" on public.exam_questions;
create policy "exam_questions_select_published_or_admin"
  on public.exam_questions
  for select
  using (
    published = true
    or public.is_admin_user()
    or exists (
      select 1
      from public.exams e
      where e.id = exam_id
        and (e.created_by = auth.uid() or public.is_admin_user())
    )
  );
create policy "exam_questions_write_admin_or_owner"
  on public.exam_questions
  for all
  using (
    public.is_admin_user()
    or exists (
      select 1
      from public.exams e
      where e.id = exam_id
        and e.created_by = auth.uid()
    )
  )
  with check (
    public.is_admin_user()
    or exists (
      select 1
      from public.exams e
      where e.id = exam_id
        and e.created_by = auth.uid()
    )
  );

drop policy if exists "question_bank_select_published_or_admin" on public.question_bank;
drop policy if exists "question_bank_write_admin_or_owner" on public.question_bank;
create policy "question_bank_select_published_or_admin"
  on public.question_bank
  for select
  using (published = true or public.is_admin_user() or created_by = auth.uid());
create policy "question_bank_write_admin_or_owner"
  on public.question_bank
  for all
  using (public.is_admin_user() or created_by = auth.uid())
  with check (public.is_admin_user() or created_by = auth.uid());

drop policy if exists "notifications_select_published" on public.notifications;
drop policy if exists "notifications_write_admin_only" on public.notifications;
create policy "notifications_select_published"
  on public.notifications
  for select
  using (published = true or public.is_admin_user());
create policy "notifications_write_admin_only"
  on public.notifications
  for all
  using (public.is_admin_user())
  with check (public.is_admin_user());
