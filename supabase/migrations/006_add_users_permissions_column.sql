alter table if exists public.users add column if not exists permissions jsonb not null default '[]'::jsonb;
