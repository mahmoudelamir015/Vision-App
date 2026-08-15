-- Add subject tagging to teacher_materials for access control

-- 1. Add subject column to teacher_materials
alter table public.teacher_materials add column if not exists subject text;
create index if not exists idx_teacher_materials_subject on public.teacher_materials (subject);

-- 2. Update teacher_materials RLS: students can only see materials whose subject is in their allowed subjects
-- The students' allowed subjects are stored in public.users.subjects (jsonb array)
-- Policy: published AND (no subject set OR student's subjects array contains the material's subject)

drop policy if exists "teacher_materials_select_published_or_owner" on public.teacher_materials;
create policy "teacher_materials_select_published_or_owner"
  on public.teacher_materials
  for select
  using (
    public.is_admin_user()
    or (auth.uid() is not null and teacher_user_id = auth.uid())
    or (
      published = true
      and (
        subject is null
        or subject = ''
        or exists (
          select 1
          from public.users u
          where u.auth_user_id = auth.uid()
            and (
              u.subjects @> to_jsonb(subject)
              or u.subjects = '[]'::jsonb
              or u.subjects is null
            )
        )
      )
    )
  );
