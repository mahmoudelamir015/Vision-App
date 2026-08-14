-- Restrict destructive actions to master_admin only.

drop policy if exists "users_delete_self_or_admin" on public.users;

create policy "users_delete_master_admin_only"
  on public.users
  for delete
  using (public.current_user_role() = 'master_admin');

drop policy if exists "exams_write_admin_or_owner" on public.exams;

create policy "exams_insert_admin_or_owner"
  on public.exams
  for insert
  with check (
    public.is_admin_user()
    or (auth.uid() is not null and created_by = auth.uid())
  );

create policy "exams_update_admin_or_owner"
  on public.exams
  for update
  using (
    public.is_admin_user()
    or (auth.uid() is not null and created_by = auth.uid())
  )
  with check (
    public.is_admin_user()
    or (auth.uid() is not null and created_by = auth.uid())
  );

create policy "exams_delete_master_admin_only"
  on public.exams
  for delete
  using (public.current_user_role() = 'master_admin');

drop policy if exists "exam_questions_write_admin_or_owner" on public.exam_questions;

create policy "exam_questions_insert_admin_or_owner"
  on public.exam_questions
  for insert
  with check (
    public.is_admin_user()
    or exists (
      select 1
      from public.exams e
      where e.id = exam_id
        and e.created_by = auth.uid()
    )
  );

create policy "exam_questions_update_admin_or_owner"
  on public.exam_questions
  for update
  using (
    public.is_admin_user()
    or exists (
      select 1
      from public.exams e
      where e.id = exam_id
        and e.created_by = auth.uid()
    )
  )
  with check (
    public.is_admin_user()
    or exists (
      select 1
      from public.exams e
      where e.id = exam_id
        and e.created_by = auth.uid()
    )
  );

create policy "exam_questions_delete_master_admin_only"
  on public.exam_questions
  for delete
  using (public.current_user_role() = 'master_admin');

drop policy if exists "question_bank_write_admin_or_owner" on public.question_bank;

create policy "question_bank_insert_admin_or_owner"
  on public.question_bank
  for insert
  with check (
    public.is_admin_user()
    or created_by = auth.uid()
  );

create policy "question_bank_update_admin_or_owner"
  on public.question_bank
  for update
  using (
    public.is_admin_user()
    or created_by = auth.uid()
  )
  with check (
    public.is_admin_user()
    or created_by = auth.uid()
  );

create policy "question_bank_delete_master_admin_only"
  on public.question_bank
  for delete
  using (public.current_user_role() = 'master_admin');

NOTIFY pgrst, 'reload schema';
