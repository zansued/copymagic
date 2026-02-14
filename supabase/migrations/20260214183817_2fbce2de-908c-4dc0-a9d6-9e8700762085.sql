
-- Add session token to subscriptions (reuse existing table to avoid new table)
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS active_session_token text DEFAULT NULL;

-- Allow users to update their own session token
-- (already covered by existing UPDATE policy + trigger allows only generations_used changes)
-- We need to update the trigger to also allow session_token changes

CREATE OR REPLACE FUNCTION public.check_subscription_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow session_token updates by the user themselves
  IF NEW.active_session_token IS DISTINCT FROM OLD.active_session_token
    AND NEW.plan IS NOT DISTINCT FROM OLD.plan
    AND NEW.status IS NOT DISTINCT FROM OLD.status
    AND NEW.generations_limit IS NOT DISTINCT FROM OLD.generations_limit
    AND NEW.brand_profiles_limit IS NOT DISTINCT FROM OLD.brand_profiles_limit
    AND NEW.projects_limit IS NOT DISTINCT FROM OLD.projects_limit
    AND NEW.agents_access IS NOT DISTINCT FROM OLD.agents_access
    AND NEW.mp_subscription_id IS NOT DISTINCT FROM OLD.mp_subscription_id
    AND NEW.mp_payer_email IS NOT DISTINCT FROM OLD.mp_payer_email
    AND NEW.current_period_start IS NOT DISTINCT FROM OLD.current_period_start
    AND NEW.current_period_end IS NOT DISTINCT FROM OLD.current_period_end
    AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id
    AND NEW.generations_used IS NOT DISTINCT FROM OLD.generations_used
  THEN
    RETURN NEW;
  END IF;

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
    RAISE EXCEPTION 'Users can only update generations_used or session_token';
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
