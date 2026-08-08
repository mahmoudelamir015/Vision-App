-- Secure attendance tokens, stricter RLS, and DB-backed QR issuance.

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

create table if not exists public.attendance_tokens (
  id uuid primary key default gen_random_uuid(),
  student_phone text,
  shared boolean not null default false,
  token_hash text not null unique,
  pin_hash text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  use_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_attendance_tokens_student_phone on public.attendance_tokens (student_phone);
create index if not exists idx_attendance_tokens_expires_at on public.attendance_tokens (expires_at);
create index if not exists idx_attendance_tokens_shared on public.attendance_tokens (shared);

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

drop policy if exists "users_select_self_or_admin" on public.users;
drop policy if exists "users_insert_self_or_admin" on public.users;
drop policy if exists "users_update_self_or_admin" on public.users;
drop policy if exists "users_delete_self_or_admin" on public.users;

alter table public.users enable row level security;

create policy "users_select_self_or_admin"
  on public.users
  for select
  using (
    auth.uid() is not null and (
      auth_user_id = auth.uid() or public.is_admin_user()
    )
  );

create policy "users_insert_self_or_admin"
  on public.users
  for insert
  with check (
    auth.uid() is not null and (
      auth_user_id = auth.uid() or public.is_admin_user()
    )
  );

create policy "users_update_self_or_admin"
  on public.users
  for update
  using (
    auth.uid() is not null and (
      auth_user_id = auth.uid() or public.is_admin_user()
    )
  )
  with check (
    auth.uid() is not null and (
      auth_user_id = auth.uid() or public.is_admin_user()
    )
  );

create policy "users_delete_self_or_admin"
  on public.users
  for delete
  using (
    auth.uid() is not null and (
      auth_user_id = auth.uid() or public.current_user_role() = 'master_admin'
    )
  );

drop policy if exists "wallets_select_admin_or_owner" on public.wallets;
drop policy if exists "wallets_insert_admin_only" on public.wallets;
drop policy if exists "wallets_update_admin_only" on public.wallets;
drop policy if exists "wallets_delete_admin_only" on public.wallets;

alter table public.wallets enable row level security;

create policy "wallets_select_admin_or_owner"
  on public.wallets
  for select
  using (
    public.is_admin_user() or (
      auth.uid() is not null and exists (
        select 1
        from public.users u
        where u.auth_user_id = auth.uid()
          and u.phone = student_phone
      )
    )
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
    public.is_admin_user() or (
      auth.uid() is not null and exists (
        select 1
        from public.users u
        where u.auth_user_id = auth.uid()
          and u.phone = student_phone
      )
    )
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
drop function if exists public.issue_shared_attendance_token(integer);

create or replace function public.issue_shared_attendance_token(
  p_valid_for_seconds integer default 60
)
returns table (
  token text,
  expires_at timestamptz
)
as $$
declare
  v_valid_seconds integer := greatest(5, least(coalesce(p_valid_for_seconds, 60), 1800));
  v_token text;
  v_expires_at timestamptz;
begin
  if not public.is_admin_user() then
    raise exception 'NOT_AUTHORIZED';
  end if;

  v_token := encode(gen_random_bytes(24), 'hex');
  v_expires_at := now() + make_interval(secs => v_valid_seconds);

  insert into public.attendance_tokens (
    shared,
    token_hash,
    pin_hash,
    expires_at,
    use_count
  ) values (
    true,
    encode(digest(v_token, 'sha256'), 'hex'),
    null,
    v_expires_at,
    0
  );

  return query
  select v_token, v_expires_at;
end;
$$ language plpgsql security definer set search_path = public;

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

  if not exists (
    select 1
    from public.users u
    where u.phone = v_phone
      and u.role = 'student'
  ) then
    raise exception 'STUDENT_NOT_FOUND';
  end if;

  v_token := encode(gen_random_bytes(24), 'hex');
  v_pin := lpad((floor(random() * 1000000))::int::text, 6, '0');
  v_expires_at := now() + make_interval(mins => v_valid_minutes);

  insert into public.attendance_tokens (
    student_phone,
    token_hash,
    pin_hash,
    expires_at
  ) values (
    v_phone,
    encode(digest(v_token, 'sha256'), 'hex'),
    encode(digest(v_pin, 'sha256'), 'hex'),
    v_expires_at
  );

  return query
  select v_phone, v_token, v_pin, v_expires_at;
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
  if v_token is null then
    raise exception 'TOKEN_REQUIRED';
  end if;

  select *
  into v_token_row
  from public.attendance_tokens t
  where t.token_hash = encode(digest(v_token, 'sha256'), 'hex')
  for update;

  if not found then
    raise exception 'INVALID_ATTENDANCE_TOKEN';
  end if;

  if v_token_row.shared then
    if v_token_row.expires_at < now() then
      raise exception 'ATTENDANCE_TOKEN_EXPIRED';
    end if;
  else
    if v_pin is null or v_student_phone is null then
      raise exception 'TOKEN_AND_PHONE_REQUIRED';
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
  end if;

  if not exists (
    select 1
    from public.users u
    where u.phone = v_student_phone
      and u.role = 'student'
  ) then
    raise exception 'STUDENT_NOT_FOUND';
  end if;

  select coalesce(sum(amount), 0)
  into v_balance
  from public.wallets w
  where w.student_phone = v_student_phone;

  if v_balance < 0 then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  if v_token_row.shared then
    update public.attendance_tokens
    set use_count = v_token_row.use_count + 1
    where id = v_token_row.id;
  else
    update public.attendance_tokens
    set consumed_at = now()
    where id = v_token_row.id;
  end if;

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
