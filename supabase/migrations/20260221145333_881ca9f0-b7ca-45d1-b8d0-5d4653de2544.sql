-- Add fallback_plan column to track original plan (e.g., lifetime) when upgrading
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS fallback_plan text DEFAULT NULL;

-- Set fallback_plan for existing lifetime users who might upgrade
-- (no action needed now, will be set during upgrade)
