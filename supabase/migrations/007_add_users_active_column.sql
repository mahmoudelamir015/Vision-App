alter table if exists public.users add column if not exists active boolean not null default true;
