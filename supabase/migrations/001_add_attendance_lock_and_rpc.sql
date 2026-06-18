-- SQL migration: add server-side attendance auto-locking trigger and RPC
-- Usage: run this in your Supabase SQL editor or psql against the project DB.

-- 1) Trigger function to block attendance insert when student's wallet balance < 0
CREATE OR REPLACE FUNCTION public.check_attendance_wallet_balance()
RETURNS trigger AS $$
DECLARE
  bal numeric;
BEGIN
  IF NEW.student_phone IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO bal FROM public.wallets WHERE student_phone = NEW.student_phone;

  IF bal < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create / replace trigger
DROP TRIGGER IF EXISTS trg_check_wallet_before_attendance ON public.attendance;
CREATE TRIGGER trg_check_wallet_before_attendance
BEFORE INSERT ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.check_attendance_wallet_balance();


-- 2) RPC function `record_attendance` that performs the same check and inserts atomically
-- This is safer to call from clients (it will error if balance insufficient).
CREATE OR REPLACE FUNCTION public.record_attendance(
  student_name text,
  student_phone text,
  stage text,
  grade text,
  track text,
  address text,
  code text,
  qr_value text
) RETURNS SETOF public.attendance AS $$
DECLARE
  bal numeric;
BEGIN
  IF student_phone IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO bal FROM public.wallets WHERE student_phone = student_phone;
    IF bal < 0 THEN
      RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
    END IF;
  END IF;

  RETURN QUERY
  INSERT INTO public.attendance(student_name, student_phone, stage, grade, track, address, code, qr_value, created_at)
  VALUES (student_name, student_phone, stage, grade, track, address, code, qr_value, now())
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
