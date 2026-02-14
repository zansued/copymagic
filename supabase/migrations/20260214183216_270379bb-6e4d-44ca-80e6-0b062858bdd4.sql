
-- Add projects_limit column to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS projects_limit integer NOT NULL DEFAULT 1;

-- Add agents_access column: 'basic' (3 agents) or 'full' (all agents)
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS agents_access text NOT NULL DEFAULT 'basic';

-- Update existing subscriptions based on plan
UPDATE public.subscriptions SET projects_limit = 1, agents_access = 'basic' WHERE plan = 'free';
UPDATE public.subscriptions SET projects_limit = 10, agents_access = 'full' WHERE plan = 'pro';
UPDATE public.subscriptions SET projects_limit = 999999, agents_access = 'full' WHERE plan IN ('agency', 'lifetime');

-- Create lifetime_slots table to track available slots
CREATE TABLE IF NOT EXISTS public.lifetime_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_slots integer NOT NULL DEFAULT 15,
  slots_sold integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert initial config
INSERT INTO public.lifetime_slots (total_slots, slots_sold) VALUES (15, 0);

-- Enable RLS
ALTER TABLE public.lifetime_slots ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read slots (public info for pricing page)
CREATE POLICY "Anyone can view lifetime slots" ON public.lifetime_slots FOR SELECT USING (true);

-- Only service_role can update slots
-- (no INSERT/UPDATE/DELETE policies for regular users)

-- Update check_subscription_update trigger to also protect new columns
CREATE OR REPLACE FUNCTION public.check_subscription_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.generations_limit IS DISTINCT FROM OLD.generations_limit
    OR NEW.brand_profiles_limit IS DISTINCT FROM OLD.brand_profiles_limit
    OR NEW.projects_limit IS DISTINCT FROM OLD.projects_limit
    OR NEW.agents_access IS DISTINCT FROM OLD.agents_access
    OR NEW.mp_subscription_id IS DISTINCT FROM OLD.mp_subscription_id
    OR NEW.mp_payer_email IS DISTINCT FROM OLD.mp_payer_email
    OR NEW.current_period_start IS DISTINCT FROM OLD.current_period_start
    OR NEW.current_period_end IS DISTINCT FROM OLD.current_period_end
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
      RETURN NEW;
    END IF;
    IF public.has_role(auth.uid(), 'admin') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Users can only update generations_used';
  END IF;
  
  IF NEW.generations_used < OLD.generations_used THEN
    IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
      RETURN NEW;
    END IF;
    IF public.has_role(auth.uid(), 'admin') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'generations_used can only be incremented';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update admin function to include new columns
CREATE OR REPLACE FUNCTION public.admin_update_user_plan(_target_user_id uuid, _plan text, _generations_limit integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _projects_limit integer;
  _brand_profiles_limit integer;
  _agents_access text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Set limits based on plan
  IF _plan = 'free' THEN
    _projects_limit := 1;
    _brand_profiles_limit := 1;
    _agents_access := 'basic';
  ELSIF _plan = 'pro' THEN
    _projects_limit := 10;
    _brand_profiles_limit := 5;
    _agents_access := 'full';
  ELSIF _plan IN ('agency', 'lifetime') THEN
    _projects_limit := 999999;
    _brand_profiles_limit := 999;
    _agents_access := 'full';
  ELSE
    _projects_limit := 1;
    _brand_profiles_limit := 1;
    _agents_access := 'basic';
  END IF;

  INSERT INTO subscriptions (user_id, plan, generations_limit, generations_used, status, projects_limit, brand_profiles_limit, agents_access)
  VALUES (_target_user_id, _plan, _generations_limit, 0, 'active', _projects_limit, _brand_profiles_limit, _agents_access)
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan = _plan,
    generations_limit = _generations_limit,
    generations_used = 0,
    projects_limit = _projects_limit,
    brand_profiles_limit = _brand_profiles_limit,
    agents_access = _agents_access,
    current_period_start = now(),
    current_period_end = CASE WHEN _plan = 'lifetime' THEN NULL ELSE now() + interval '30 days' END,
    updated_at = now();
END;
$$;
