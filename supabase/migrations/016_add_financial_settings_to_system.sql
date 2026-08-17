-- Migration 016: Add financial control fields to system_settings
-- teacher_ratio: percentage of lesson price given to the teacher (0-100)
-- lesson_price: default price per lesson in EGP
-- auto_settlement: threshold amount (EGP) to trigger automatic settlement

alter table public.system_settings
  add column if not exists teacher_ratio numeric not null default 60,
  add column if not exists lesson_price  numeric not null default 250,
  add column if not exists auto_settlement numeric not null default 80;
