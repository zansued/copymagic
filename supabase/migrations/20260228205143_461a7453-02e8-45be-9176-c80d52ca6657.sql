-- Robust fix for team invite response authorization
-- 1) Avoid relying on JWT email claim (which can be missing/stale)
-- 2) Prevent actions on expired invites

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT au.email::text
  FROM auth.users au
  WHERE au.id = auth.uid()
  LIMIT 1
$$;

DROP POLICY IF EXISTS "Invited users can view own invites" ON public.team_invites;
DROP POLICY IF EXISTS "Invited users can respond to own invites" ON public.team_invites;

CREATE POLICY "Invited users can view own invites"
ON public.team_invites
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(public.current_user_email())
  AND status = 'pending'
  AND expires_at > now()
);

CREATE POLICY "Invited users can respond to own invites"
ON public.team_invites
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  lower(email) = lower(public.current_user_email())
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  lower(email) = lower(public.current_user_email())
  AND status = ANY (ARRAY['accepted'::text, 'rejected'::text])
  AND expires_at > now()
);