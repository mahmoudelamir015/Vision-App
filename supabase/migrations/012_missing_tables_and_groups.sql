-- Migration 012: Change Requests table + Teacher Student Groups
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. change_requests table (if not exists)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.change_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,  -- auth.users.id
  user_type         text NOT NULL,  -- 'student' | 'teacher' | 'parent'
  requested_field   text NOT NULL,  -- field name to change
  new_value         text NOT NULL,  -- proposed new value
  reason            text NOT NULL,  -- reason for the request
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_reason      text,           -- rejection reason from admin
  resolved_by       uuid,           -- admin user id who resolved
  resolved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own requests" ON public.change_requests;
CREATE POLICY "Users can insert own requests"
  ON public.change_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own requests" ON public.change_requests;
CREATE POLICY "Users can view own requests"
  ON public.change_requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin_user()
  );

DROP POLICY IF EXISTS "Admins can update requests" ON public.change_requests;
CREATE POLICY "Admins can update requests"
  ON public.change_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ==========================================
-- 2. teacher_student_groups table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.teacher_student_groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject       text NOT NULL DEFAULT '',      -- e.g. 'الفيزياء'
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, student_id, subject)
);

ALTER TABLE public.teacher_student_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view their groups" ON public.teacher_student_groups;
CREATE POLICY "Teachers can view their groups"
  ON public.teacher_student_groups FOR SELECT
  TO authenticated
  USING (
    teacher_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR public.is_admin_user()
  );

DROP POLICY IF EXISTS "Admins can manage groups" ON public.teacher_student_groups;
CREATE POLICY "Admins can manage groups"
  ON public.teacher_student_groups FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ==========================================
-- 3. notifications table (if not exists)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  body            text NOT NULL,
  audience_role   text,          -- null = all, or 'student','teacher','parent'
  stage           text,
  grade           text,
  track           text,
  student_code    text,          -- for targeted single-student notifications
  published       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated can read published notifications" ON public.notifications;
CREATE POLICY "All authenticated can read published notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (published = true);

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ==========================================
-- 4. Add student_phone to users for parent linking
-- ==========================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS student_phone text;

-- Index for parent lookup by student phone
CREATE INDEX IF NOT EXISTS users_student_phone_idx ON public.users(student_phone);

-- Grant service role full access
GRANT ALL ON public.change_requests TO service_role;
GRANT ALL ON public.teacher_student_groups TO service_role;
GRANT ALL ON public.notifications TO service_role;
