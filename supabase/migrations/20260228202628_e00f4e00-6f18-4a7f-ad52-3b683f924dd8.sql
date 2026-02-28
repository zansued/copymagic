
-- Drop existing restrictive UPDATE policies on team_invites
DROP POLICY IF EXISTS "Invited users can respond to own invites" ON public.team_invites;
DROP POLICY IF EXISTS "Owner or admin can update invites" ON public.team_invites;

-- Recreate as PERMISSIVE (so ANY matching policy allows access)
CREATE POLICY "Invited users can respond to own invites"
ON public.team_invites FOR UPDATE
TO authenticated
USING ((lower(email) = lower((auth.jwt() ->> 'email'::text))) AND (status = 'pending'::text));

CREATE POLICY "Owner or admin can update invites"
ON public.team_invites FOR UPDATE
TO authenticated
USING (get_team_role(auth.uid(), team_id) = ANY (ARRAY['owner'::text, 'admin'::text]));
