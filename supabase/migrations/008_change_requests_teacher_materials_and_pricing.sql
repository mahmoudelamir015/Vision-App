-- Change requests, teacher materials, and pricing support.

create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_type text not null check (user_type in ('student', 'parent', 'teacher')),
  requested_field text not null,
  new_value text not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_reason text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_change_requests_user_id on public.change_requests (user_id);
create index if not exists idx_change_requests_status on public.change_requests (status);
create index if not exists idx_change_requests_user_type on public.change_requests (user_type);

create table if not exists public.teacher_student_groups (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references auth.users(id) on delete cascade,
  student_user_id uuid not null references auth.users(id) on delete cascade,
  grade text,
  group_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_user_id, student_user_id)
);

create index if not exists idx_teacher_student_groups_teacher on public.teacher_student_groups (teacher_user_id);
create index if not exists idx_teacher_student_groups_student on public.teacher_student_groups (student_user_id);

create table if not exists public.teacher_materials (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  file_url text not null,
  file_name text,
  file_type text,
  price numeric not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_teacher_materials_teacher on public.teacher_materials (teacher_user_id);
create index if not exists idx_teacher_materials_published on public.teacher_materials (published);

alter table public.exams add column if not exists price numeric not null default 0;
alter table public.question_bank add column if not exists price numeric not null default 0;

drop trigger if exists touch_change_requests_updated_at on public.change_requests;
drop trigger if exists touch_teacher_student_groups_updated_at on public.teacher_student_groups;
drop trigger if exists touch_teacher_materials_updated_at on public.teacher_materials;

create trigger touch_change_requests_updated_at
before update on public.change_requests
for each row execute function public.touch_updated_at();

create trigger touch_teacher_student_groups_updated_at
before update on public.teacher_student_groups
for each row execute function public.touch_updated_at();

create trigger touch_teacher_materials_updated_at
before update on public.teacher_materials
for each row execute function public.touch_updated_at();

alter table public.change_requests enable row level security;
alter table public.teacher_student_groups enable row level security;
alter table public.teacher_materials enable row level security;

drop policy if exists "change_requests_select_owner_or_admin" on public.change_requests;
drop policy if exists "change_requests_insert_owner_only" on public.change_requests;
drop policy if exists "change_requests_update_admin_only" on public.change_requests;
create policy "change_requests_select_owner_or_admin"
  on public.change_requests
  for select
  using (
    public.is_admin_user()
    or (auth.uid() is not null and user_id = auth.uid())
  );
create policy "change_requests_insert_owner_only"
  on public.change_requests
  for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );
create policy "change_requests_update_admin_only"
  on public.change_requests
  for update
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "teacher_student_groups_select_teacher_or_admin" on public.teacher_student_groups;
drop policy if exists "teacher_student_groups_write_teacher_or_admin" on public.teacher_student_groups;
create policy "teacher_student_groups_select_teacher_or_admin"
  on public.teacher_student_groups
  for select
  using (
    public.is_admin_user()
    or (auth.uid() is not null and teacher_user_id = auth.uid())
  );
create policy "teacher_student_groups_write_teacher_or_admin"
  on public.teacher_student_groups
  for all
  using (
    public.is_admin_user()
    or (auth.uid() is not null and teacher_user_id = auth.uid())
  )
  with check (
    public.is_admin_user()
    or (auth.uid() is not null and teacher_user_id = auth.uid())
  );

drop policy if exists "teacher_materials_select_published_or_owner" on public.teacher_materials;
drop policy if exists "teacher_materials_write_teacher_or_admin" on public.teacher_materials;
create policy "teacher_materials_select_published_or_owner"
  on public.teacher_materials
  for select
  using (
    published = true
    or public.is_admin_user()
    or (auth.uid() is not null and teacher_user_id = auth.uid())
  );
create policy "teacher_materials_write_teacher_or_admin"
  on public.teacher_materials
  for all
  using (
    public.is_admin_user()
    or public.current_user_role() = 'teacher'
    or (auth.uid() is not null and teacher_user_id = auth.uid())
  )
  with check (
    public.is_admin_user()
    or public.current_user_role() = 'teacher'
    or (auth.uid() is not null and teacher_user_id = auth.uid())
  );

drop policy if exists "exams_select_published_or_owner" on public.exams;
drop policy if exists "exams_write_admin_or_owner" on public.exams;
create policy "exams_select_published_or_owner"
  on public.exams
  for select
  using (
    published_at is not null
    or public.is_admin_user()
    or public.current_user_role() = 'teacher'
    or (auth.uid() is not null and created_by = auth.uid())
  );
create policy "exams_write_admin_or_owner"
  on public.exams
  for all
  using (
    public.is_admin_user()
    or public.current_user_role() = 'teacher'
    or (auth.uid() is not null and created_by = auth.uid())
  )
  with check (
    public.is_admin_user()
    or public.current_user_role() = 'teacher'
    or (auth.uid() is not null and created_by = auth.uid())
  );

drop policy if exists "question_bank_select_published_or_admin" on public.question_bank;
drop policy if exists "question_bank_write_admin_or_owner" on public.question_bank;
create policy "question_bank_select_published_or_admin"
  on public.question_bank
  for select
  using (
    published = true
    or public.is_admin_user()
    or public.current_user_role() = 'teacher'
    or created_by = auth.uid()
  );
create policy "question_bank_write_admin_or_owner"
  on public.question_bank
  for all
  using (
    public.is_admin_user()
    or public.current_user_role() = 'teacher'
    or created_by = auth.uid()
  )
  with check (
    public.is_admin_user()
    or public.current_user_role() = 'teacher'
    or created_by = auth.uid()
  );
