-- Exam attempts and results storage.

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
  using (
    public.is_admin_user()
    or (auth.uid() is not null and student_user_id = auth.uid())
  );

create policy "exam_attempts_insert_owner_or_admin"
  on public.exam_attempts
  for insert
  with check (
    public.is_admin_user()
    or (auth.uid() is not null and student_user_id = auth.uid())
  );

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
