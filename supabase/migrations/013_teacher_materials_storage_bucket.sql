-- Ensure storage bucket exists
insert into storage.buckets (id, name, public)
values ('teacher_materials', 'teacher_materials', true)
on conflict (id) do update set public = true;

-- Enable RLS on storage.objects if not already enabled
alter table storage.objects enable row level security;

-- Drop existing policies if any
drop policy if exists "teacher_materials_select" on storage.objects;
drop policy if exists "teacher_materials_insert" on storage.objects;
drop policy if exists "teacher_materials_update" on storage.objects;
drop policy if exists "teacher_materials_delete" on storage.objects;

-- Select (Read) Policy
create policy "teacher_materials_select"
  on storage.objects for select
  using (
    bucket_id = 'teacher_materials'
    -- If public=true, anyone can read the URL, but for listing/querying objects we can allow authenticated users
    and auth.uid() is not null
  );

-- Insert Policy
create policy "teacher_materials_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'teacher_materials'
    and auth.uid() is not null
    and (
      public.is_admin_user() 
      or public.current_user_role() = 'teacher'
    )
  );

-- Update Policy
create policy "teacher_materials_update"
  on storage.objects for update
  using (
    bucket_id = 'teacher_materials'
    and auth.uid() is not null
    and (
      public.is_admin_user() 
      or public.current_user_role() = 'teacher'
    )
  );

-- Delete Policy
create policy "teacher_materials_delete"
  on storage.objects for delete
  using (
    bucket_id = 'teacher_materials'
    and auth.uid() is not null
    and (
      public.is_admin_user() 
      or public.current_user_role() = 'teacher'
    )
  );
