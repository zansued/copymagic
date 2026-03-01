
-- Fix SELECT policies - drop restrictive and recreate as permissive
DROP POLICY IF EXISTS "Invited users can view own invites" ON public.team_invites;
DROP POLICY IF EXISTS "Members can view team invites" ON public.team_invites;

CREATE POLICY "Invited users can view own invites"
ON public.team_invites
FOR SELECT
USING (
  lower(email) = lower(current_user_email())
  AND status = 'pending'
  AND expires_at > now()
);

CREATE POLICY "Members can view team invites"
ON public.team_invites
FOR SELECT
USING (is_team_member(auth.uid(), team_id));

-- Fix INSERT and DELETE too
DROP POLICY IF EXISTS "Owner or admin can create invites" ON public.team_invites;
DROP POLICY IF EXISTS "Owner or admin can delete invites" ON public.team_invites;

CREATE POLICY "Owner or admin can create invites"
ON public.team_invites
FOR INSERT
WITH CHECK (
  get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
  AND auth.uid() = invited_by
);

CREATE POLICY "Owner or admin can delete invites"
ON public.team_invites
FOR DELETE
USING (
  get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
);
