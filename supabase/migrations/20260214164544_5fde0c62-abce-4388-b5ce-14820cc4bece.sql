
-- Fix 1: Add admin authorization checks inside SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION public.get_admin_users()
 RETURNS TABLE(user_id uuid, email text, registered_at timestamp with time zone, last_sign_in_at timestamp with time zone, plan text, subscription_status text, generations_used integer, generations_limit integer, mp_subscription_id text, mp_payer_email text, current_period_start timestamp with time zone, current_period_end timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_metrics()
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_user_plan(_target_user_id uuid, _plan text, _generations_limit integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

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
$function$;

-- Fix 2: Add missing DELETE policies on mentor tables

CREATE POLICY "Users can delete own mentor messages" 
ON public.mentor_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.mentor_conversations c 
    WHERE c.id = conversation_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own mentor flow steps" 
ON public.mentor_flow_steps FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.mentor_flows f 
    WHERE f.id = flow_id 
    AND f.user_id = auth.uid()
  )
);
