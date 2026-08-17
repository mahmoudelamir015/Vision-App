-- =========================================================================
-- Migration 017: Master Financial & System Fixes Bundle for Royacenter
-- Run this script once in Supabase SQL Editor to apply all final schema changes.
-- =========================================================================

-- 1) Financial Control Columns in system_settings
ALTER TABLE IF EXISTS public.system_settings
  ADD COLUMN IF NOT EXISTS wallet_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS registration_open BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_results BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS teacher_ratio NUMERIC NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS lesson_price NUMERIC NOT NULL DEFAULT 250,
  ADD COLUMN IF NOT EXISTS auto_settlement NUMERIC NOT NULL DEFAULT 80;

-- 2) Users Table - Permissions & Staff Gate Roles
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3) Wallets Table Structure
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner TEXT NOT NULL DEFAULT 'معاملة مالية',
  account_type TEXT NOT NULL DEFAULT 'student',
  amount NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  student_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) Financial Transactions & Settlements Tables
CREATE TABLE IF NOT EXISTS public.wallet_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  reason TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  settlement_id UUID REFERENCES public.settlements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) RLS Policies & Triggers
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_balances_admin_all" ON public.wallet_balances;
CREATE POLICY "wallet_balances_admin_all" ON public.wallet_balances FOR ALL USING (public.is_admin_user());

DROP POLICY IF EXISTS "transactions_admin_all" ON public.transactions;
CREATE POLICY "transactions_admin_all" ON public.transactions FOR ALL USING (public.is_admin_user());

DROP POLICY IF EXISTS "settlements_admin_all" ON public.settlements;
CREATE POLICY "settlements_admin_all" ON public.settlements FOR ALL USING (public.is_admin_user());

DROP POLICY IF EXISTS "wallets_all_access" ON public.wallets;
CREATE POLICY "wallets_all_access" ON public.wallets FOR ALL USING (public.is_admin_user() OR auth.uid() IS NOT NULL);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Done!
