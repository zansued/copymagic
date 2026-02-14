
-- Drop the exposed view to fix security issues
DROP VIEW IF EXISTS public.admin_users_view CASCADE;

-- Recreate get_admin_users as a function that returns a table directly
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  registered_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  plan TEXT,
  subscription_status TEXT,
  generations_used INTEGER,
  generations_limit INTEGER,
  mp_subscription_id TEXT,
  mp_payer_email TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id AS user_id,
    au.email::TEXT,
    au.created_at AS registered_at,
    au.last_sign_in_at,
    COALESCE(s.plan, 'free')::TEXT AS plan,
    COALESCE(s.status, 'active')::TEXT AS subscription_status,
    COALESCE(s.generations_used, 0) AS generations_used,
    COALESCE(s.generations_limit, 5) AS generations_limit,
    s.mp_subscription_id,
    s.mp_payer_email,
    s.current_period_start,
    s.current_period_end
  FROM auth.users au
  LEFT JOIN public.subscriptions s ON s.user_id = au.id;
END;
$$;
