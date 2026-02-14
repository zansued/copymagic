
-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Users can update own subscription usage" ON public.subscriptions;

-- Create a restricted policy that only allows incrementing generations_used
-- Uses a trigger to enforce that no other columns are changed
CREATE OR REPLACE FUNCTION public.check_subscription_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow changes to generations_used (and updated_at)
  IF NEW.plan IS DISTINCT FROM OLD.plan
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.generations_limit IS DISTINCT FROM OLD.generations_limit
    OR NEW.brand_profiles_limit IS DISTINCT FROM OLD.brand_profiles_limit
    OR NEW.mp_subscription_id IS DISTINCT FROM OLD.mp_subscription_id
    OR NEW.mp_payer_email IS DISTINCT FROM OLD.mp_payer_email
    OR NEW.current_period_start IS DISTINCT FROM OLD.current_period_start
    OR NEW.current_period_end IS DISTINCT FROM OLD.current_period_end
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    -- Allow if caller is service_role (admin operations)
    IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
      RETURN NEW;
    END IF;
    -- Allow if caller is admin
    IF public.has_role(auth.uid(), 'admin') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Users can only update generations_used';
  END IF;
  
  -- Ensure generations_used only increments
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

CREATE TRIGGER check_subscription_update_trigger
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_subscription_update();

-- Re-create a simple RLS policy for user updates (trigger enforces column restrictions)
CREATE POLICY "Users can update own subscription usage"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
