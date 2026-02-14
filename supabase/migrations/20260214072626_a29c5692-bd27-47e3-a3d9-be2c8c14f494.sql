
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own role
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Create admin edge function for data access
-- We also need a view for admin to see users + subscriptions
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
  au.id AS user_id,
  au.email,
  au.created_at AS registered_at,
  au.last_sign_in_at,
  COALESCE(s.plan, 'free') AS plan,
  COALESCE(s.status, 'active') AS subscription_status,
  COALESCE(s.generations_used, 0) AS generations_used,
  COALESCE(s.generations_limit, 5) AS generations_limit,
  s.mp_subscription_id,
  s.mp_payer_email,
  s.current_period_start,
  s.current_period_end
FROM auth.users au
LEFT JOIN public.subscriptions s ON s.user_id = au.id;

-- Grant access to the view via a security definer function
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS SETOF public.admin_users_view
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.admin_users_view
$$;

-- Function to get admin metrics
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_pro', (SELECT COUNT(*) FROM subscriptions WHERE plan = 'pro' AND status = 'active'),
    'total_agency', (SELECT COUNT(*) FROM subscriptions WHERE plan = 'agency' AND status = 'active'),
    'total_free', (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM subscriptions WHERE plan IN ('pro', 'agency') AND status = 'active'),
    'total_generations', (SELECT COALESCE(SUM(generations_used), 0) FROM subscriptions),
    'mrr', (SELECT COALESCE(SUM(CASE WHEN plan = 'pro' THEN 97 WHEN plan = 'agency' THEN 297 ELSE 0 END), 0) FROM subscriptions WHERE status = 'active')
  ) INTO result;
  RETURN result;
END;
$$;

-- Function to update user plan (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_plan(
  _target_user_id UUID,
  _plan TEXT,
  _generations_limit INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, generations_limit, generations_used, status)
  VALUES (_target_user_id, _plan, _generations_limit, 0, 'active')
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan = _plan,
    generations_limit = _generations_limit,
    generations_used = 0,
    current_period_start = now(),
    current_period_end = now() + interval '30 days',
    updated_at = now();
END;
$$;
