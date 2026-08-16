-- Migration 015: Add resolved_at and resolved_by to change_requests table
ALTER TABLE IF EXISTS change_requests ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS change_requests ADD COLUMN IF NOT EXISTS resolved_by UUID;

NOTIFY pgrst, 'reload schema';
