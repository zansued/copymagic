-- Update admin_update_user_plan to handle fallback_plan
CREATE OR REPLACE FUNCTION public.admin_update_user_plan(_target_user_id uuid, _plan text, _generations_limit integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _projects_limit integer;
  _brand_profiles_limit integer;
  _agents_access text;
  _current_plan text;
  _fallback text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Get current plan to determine fallback
  SELECT plan, fallback_plan INTO _current_plan, _fallback
  FROM subscriptions WHERE user_id = _target_user_id;

  -- If current plan is lifetime and changing to something else, preserve as fallback
  IF _current_plan = 'lifetime' AND _plan != 'lifetime' THEN
    _fallback := 'lifetime';
  END IF;
  -- If changing back to lifetime, clear fallback
  IF _plan = 'lifetime' THEN
    _fallback := NULL;
  END IF;

  IF _plan = 'free' THEN
    _projects_limit := 1; _brand_profiles_limit := 1; _agents_access := 'basic';
  ELSIF _plan = 'starter' THEN
    _projects_limit := 5; _brand_profiles_limit := 3; _agents_access := 'basic';
  ELSIF _plan = 'pro' THEN
    _projects_limit := 25; _brand_profiles_limit := 10; _agents_access := 'full';
  ELSIF _plan = 'lifetime' THEN
    _projects_limit := 30; _brand_profiles_limit := 15; _agents_access := 'full';
  ELSIF _plan IN ('agency', 'agency_plus') THEN
    _projects_limit := 999999; _brand_profiles_limit := 999; _agents_access := 'full';
  ELSE
    _projects_limit := 1; _brand_profiles_limit := 1; _agents_access := 'basic';
  END IF;

  INSERT INTO subscriptions (user_id, plan, generations_limit, generations_used, status, projects_limit, brand_profiles_limit, agents_access, fallback_plan)
  VALUES (_target_user_id, _plan, _generations_limit, 0, 'active', _projects_limit, _brand_profiles_limit, _agents_access, _fallback)
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan = _plan,
    generations_limit = _generations_limit,
    generations_used = 0,
    projects_limit = _projects_limit,
    brand_profiles_limit = _brand_profiles_limit,
    agents_access = _agents_access,
    fallback_plan = _fallback,
    current_period_start = now(),
    current_period_end = CASE WHEN _plan = 'lifetime' THEN NULL ELSE now() + interval '30 days' END,
    updated_at = now();
END;
$function$;
