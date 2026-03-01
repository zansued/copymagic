
-- Drop restrictive UPDATE policies
DROP POLICY IF EXISTS "Invited users can respond to own invites" ON public.team_invites;
DROP POLICY IF EXISTS "Owner or admin can update invites" ON public.team_invites;

-- Recreate as PERMISSIVE (default) so EITHER can match
CREATE POLICY "Invited users can respond to own invites"
ON public.team_invites
FOR UPDATE
USING (
  lower(email) = lower(current_user_email())
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  lower(email) = lower(current_user_email())
  AND status IN ('accepted', 'rejected')
  AND expires_at > now()
);

CREATE POLICY "Owner or admin can update invites"
ON public.team_invites
FOR UPDATE
USING (
  get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
)
WITH CHECK (
  get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
);
