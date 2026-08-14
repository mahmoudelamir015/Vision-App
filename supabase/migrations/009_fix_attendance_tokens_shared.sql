alter table public.attendance_tokens
  add column if not exists shared boolean not null default false;

create index if not exists idx_attendance_tokens_shared on public.attendance_tokens (shared);
