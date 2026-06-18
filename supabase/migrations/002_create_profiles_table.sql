-- Migration: create `profiles` table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE,
  name text,
  role text,
  stage text,
  grade text,
  track text,
  created_at timestamptz DEFAULT now()
);
