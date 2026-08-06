-- Copy/paste bundle for the live Supabase SQL editor.
-- Includes the attendance hardening, exams/question bank/notifications,
-- and exam attempts/results pieces.

create extension if not exists pgcrypto;

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
  permissions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
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
alter table public.users add column if not exists permissions jsonb not null default '[]'::jsonb;
alter table public.users add column if not exists active boolean not null default true;
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();

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

create table if not exists public.attendance_tokens (
  id uuid primary key default gen_random_uuid(),
  student_phone text not null,
  token_hash text not null unique,
  pin_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_attendance_tokens_student_phone on public.attendance_tokens (student_phone);
create index if not exists idx_attendance_tokens_expires_at on public.attendance_tokens (expires_at);

drop policy if exists "users_select_self_or_admin" on public.users;
drop policy if exists "users_insert_self_or_admin" on public.users;
drop policy if exists "users_update_self_or_admin" on public.users;
drop policy if exists "users_delete_self_or_admin" on public.users;
alter table public.users enable row level security;
create policy "users_select_self_or_admin"
  on public.users
  for select
  using (auth.uid() is not null and (auth_user_id = auth.uid() or public.is_admin_user()));
create policy "users_insert_self_or_admin"
  on public.users
  for insert
  with check (auth.uid() is not null and (auth_user_id = auth.uid() or public.is_admin_user()));
create policy "users_update_self_or_admin"
  on public.users
  for update
  using (auth.uid() is not null and (auth_user_id = auth.uid() or public.is_admin_user()))
  with check (auth.uid() is not null and (auth_user_id = auth.uid() or public.is_admin_user()));
create policy "users_delete_self_or_admin"
  on public.users
  for delete
  using (auth.uid() is not null and (auth_user_id = auth.uid() or public.current_user_role() = 'master_admin'));

drop policy if exists "wallets_select_admin_or_owner" on public.wallets;
drop policy if exists "wallets_insert_admin_only" on public.wallets;
drop policy if exists "wallets_update_admin_only" on public.wallets;
drop policy if exists "wallets_delete_admin_only" on public.wallets;
alter table public.wallets enable row level security;
create policy "wallets_select_admin_or_owner"
  on public.wallets
  for select
  using (
    public.is_admin_user()
    or (auth.uid() is not null and exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.phone = student_phone))
  );
create policy "wallets_insert_admin_only"
  on public.wallets
  for insert
  with check (public.current_user_role() = 'master_admin');
create policy "wallets_update_admin_only"
  on public.wallets
  for update
  using (public.current_user_role() = 'master_admin')
  with check (public.current_user_role() = 'master_admin');
create policy "wallets_delete_admin_only"
  on public.wallets
  for delete
  using (public.current_user_role() = 'master_admin');

drop policy if exists "attendance_select_admin_or_owner" on public.attendance;
drop policy if exists "attendance_insert_admin_only" on public.attendance;
alter table public.attendance enable row level security;
create policy "attendance_select_admin_or_owner"
  on public.attendance
  for select
  using (
    public.is_admin_user()
    or (auth.uid() is not null and exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.phone = student_phone))
  );

drop policy if exists "system_settings_public_select" on public.system_settings;
drop policy if exists "system_settings_admin_write" on public.system_settings;
alter table public.system_settings enable row level security;
create policy "system_settings_public_select"
  on public.system_settings
  for select
  using (true);
create policy "system_settings_admin_write"
  on public.system_settings
  for insert
  with check (public.current_user_role() = 'master_admin');
create policy "system_settings_admin_update"
  on public.system_settings
  for update
  using (public.current_user_role() = 'master_admin')
  with check (public.current_user_role() = 'master_admin');
create policy "system_settings_admin_delete"
  on public.system_settings
  for delete
  using (public.current_user_role() = 'master_admin');

alter table public.attendance_tokens enable row level security;

drop function if exists public.issue_attendance_token(text, integer);

create or replace function public.issue_attendance_token(
  p_student_phone text,
  p_valid_for_minutes integer default 10
)
returns table (
  student_phone text,
  token text,
  pin_code text,
  expires_at timestamptz
)
as $$
declare
  v_phone text := nullif(btrim(p_student_phone), '');
  v_valid_minutes integer := greatest(1, least(coalesce(p_valid_for_minutes, 10), 60));
  v_token text;
  v_pin text;
  v_expires_at timestamptz;
begin
  if not public.is_admin_user() then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if v_phone is null then
    raise exception 'STUDENT_PHONE_REQUIRED';
  end if;

  if not exists (select 1 from public.users u where u.phone = v_phone and u.role = 'student') then
    raise exception 'STUDENT_NOT_FOUND';
  end if;

  v_token := encode(gen_random_bytes(24), 'hex');
  v_pin := lpad((floor(random() * 1000000))::int::text, 6, '0');
  v_expires_at := now() + make_interval(mins => v_valid_minutes);

  insert into public.attendance_tokens (student_phone, token_hash, pin_hash, expires_at)
  values (v_phone, encode(digest(v_token, 'sha256'), 'hex'), encode(digest(v_pin, 'sha256'), 'hex'), v_expires_at);

  return query select v_phone, v_token, v_pin, v_expires_at;
end;
$$ language plpgsql security definer set search_path = public;

drop function if exists public.record_attendance(text, text, text, text, text, text, text, text);

create or replace function public.record_attendance(
  student_name text,
  student_phone text,
  stage text,
  grade text,
  track text,
  address text,
  code text,
  qr_value text
) returns setof public.attendance as $$
declare
  v_token text := nullif(btrim(coalesce(qr_value, '')), '');
  v_pin text := nullif(btrim(coalesce(code, '')), '');
  v_token_row public.attendance_tokens%rowtype;
  v_student_phone text := nullif(btrim(coalesce(student_phone, '')), '');
  v_balance numeric;
begin
  if v_token is null or v_pin is null or v_student_phone is null then
    raise exception 'TOKEN_AND_PHONE_REQUIRED';
  end if;

  select * into v_token_row
  from public.attendance_tokens t
  where t.token_hash = encode(digest(v_token, 'sha256'), 'hex')
  for update;

  if not found then
    raise exception 'INVALID_ATTENDANCE_TOKEN';
  end if;

  if v_token_row.student_phone <> v_student_phone then
    raise exception 'TOKEN_PHONE_MISMATCH';
  end if;

  if v_token_row.consumed_at is not null then
    raise exception 'ATTENDANCE_TOKEN_USED';
  end if;

  if v_token_row.expires_at < now() then
    raise exception 'ATTENDANCE_TOKEN_EXPIRED';
  end if;

  if not exists (select 1 from public.users u where u.phone = v_student_phone and u.role = 'student') then
    raise exception 'STUDENT_NOT_FOUND';
  end if;

  select coalesce(sum(amount), 0) into v_balance
  from public.wallets w
  where w.student_phone = v_student_phone;

  if v_balance < 0 then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  update public.attendance_tokens
  set consumed_at = now()
  where id = v_token_row.id;

  return query
  insert into public.attendance (
    student_name,
    student_phone,
    stage,
    grade,
    track,
    address,
    code,
    qr_value,
    created_at
  )
  values (
    student_name,
    v_student_phone,
    stage,
    grade,
    track,
    address,
    v_pin,
    v_token,
    now()
  )
  returning *;
end;
$$ language plpgsql security definer set search_path = public;

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
  using (published_at is not null or public.is_admin_user() or (auth.uid() is not null and created_by = auth.uid()));
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
    or exists (select 1 from public.exams e where e.id = exam_id and (e.created_by = auth.uid() or public.is_admin_user()))
  );
create policy "exam_questions_write_admin_or_owner"
  on public.exam_questions
  for all
  using (
    public.is_admin_user()
    or exists (select 1 from public.exams e where e.id = exam_id and e.created_by = auth.uid())
  )
  with check (
    public.is_admin_user()
    or exists (select 1 from public.exams e where e.id = exam_id and e.created_by = auth.uid())
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

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_user_id uuid references auth.users(id) on delete set null,
  student_name text not null,
  student_phone text not null,
  answers jsonb not null default '{}'::jsonb,
  total_questions integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  score integer not null default 0,
  percentage numeric(5,2) not null default 0,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_exam_attempts_exam_id on public.exam_attempts (exam_id);
create index if not exists idx_exam_attempts_student_phone on public.exam_attempts (student_phone);
create index if not exists idx_exam_attempts_student_user_id on public.exam_attempts (student_user_id);

alter table public.exam_attempts enable row level security;

drop function if exists public.record_exam_attempt(uuid, jsonb);

drop policy if exists "exam_attempts_select_owner_or_admin" on public.exam_attempts;
drop policy if exists "exam_attempts_insert_owner_or_admin" on public.exam_attempts;
drop policy if exists "exam_attempts_update_admin_only" on public.exam_attempts;
drop policy if exists "exam_attempts_delete_admin_only" on public.exam_attempts;

create policy "exam_attempts_select_owner_or_admin"
  on public.exam_attempts
  for select
  using (public.is_admin_user() or (auth.uid() is not null and student_user_id = auth.uid()));
create policy "exam_attempts_insert_owner_or_admin"
  on public.exam_attempts
  for insert
  with check (public.is_admin_user() or (auth.uid() is not null and student_user_id = auth.uid()));
create policy "exam_attempts_update_admin_only"
  on public.exam_attempts
  for update
  using (public.is_admin_user())
  with check (public.is_admin_user());
create policy "exam_attempts_delete_admin_only"
  on public.exam_attempts
  for delete
  using (public.is_admin_user());

create or replace function public.record_exam_attempt(
  p_exam_id uuid,
  p_answers jsonb
)
returns public.exam_attempts
as $$
declare
  v_profile record;
  v_exam record;
  v_question record;
  v_answers jsonb := coalesce(p_answers, '{}'::jsonb);
  v_total integer := 0;
  v_correct integer := 0;
  v_wrong integer := 0;
  v_score integer := 0;
  v_percentage numeric(5,2) := 0;
  v_answer_raw text;
  v_answer_index integer;
  v_attempt public.exam_attempts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if jsonb_typeof(v_answers) <> 'object' then
    raise exception 'INVALID_ANSWERS_PAYLOAD';
  end if;

  select u.id, u.name, u.phone, u.role
  into v_profile
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1;

  if not found or v_profile.role <> 'student' then
    raise exception 'STUDENT_PROFILE_REQUIRED';
  end if;

  select e.*
  into v_exam
  from public.exams e
  where e.id = p_exam_id
  limit 1;

  if not found then
    raise exception 'EXAM_NOT_FOUND';
  end if;

  if v_exam.published_at is null and not public.is_admin_user() then
    raise exception 'EXAM_NOT_PUBLISHED';
  end if;

  for v_question in
    select q.id, q.correct_answer
    from public.exam_questions q
    where q.exam_id = p_exam_id
    order by q.question_order
  loop
    v_total := v_total + 1;
    v_answer_raw := nullif(btrim(v_answers ->> v_question.id::text), '');

    if v_answer_raw is not null and v_answer_raw ~ '^-?[0-9]+$' then
      v_answer_index := v_answer_raw::integer;

      if v_answer_index = v_question.correct_answer then
        v_correct := v_correct + 1;
      else
        v_wrong := v_wrong + 1;
      end if;
    else
      v_wrong := v_wrong + 1;
    end if;
  end loop;

  if v_total > 0 then
    v_score := round((v_correct * 100.0) / v_total)::integer;
    v_percentage := round(((v_correct * 100.0) / v_total)::numeric, 2);
  end if;

  insert into public.exam_attempts (
    exam_id,
    student_user_id,
    student_name,
    student_phone,
    answers,
    total_questions,
    correct_count,
    wrong_count,
    score,
    percentage,
    submitted_at
  ) values (
    p_exam_id,
    v_profile.id,
    v_profile.name,
    v_profile.phone,
    v_answers,
    v_total,
    v_correct,
    v_wrong,
    v_score,
    v_percentage,
    now()
  )
  returning * into v_attempt;

  return v_attempt;
end;
$$ language plpgsql security definer set search_path = public;
