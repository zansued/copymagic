-- Fix team_invites UPDATE RLS: allow pending -> accepted/rejected transitions for invited users
DROP POLICY IF EXISTS "Invited users can respond to own invites" ON public.team_invites;
DROP POLICY IF EXISTS "Owner or admin can update invites" ON public.team_invites;

CREATE POLICY "Invited users can respond to own invites"
ON public.team_invites
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  lower(email) = lower((auth.jwt() ->> 'email'::text))
  AND status = 'pending'
)
WITH CHECK (
  lower(email) = lower((auth.jwt() ->> 'email'::text))
  AND status = ANY (ARRAY['accepted'::text, 'rejected'::text])
);

CREATE POLICY "Owner or admin can update invites"
ON public.team_invites
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  get_team_role(auth.uid(), team_id) = ANY (ARRAY['owner'::text, 'admin'::text])
)
WITH CHECK (
  get_team_role(auth.uid(), team_id) = ANY (ARRAY['owner'::text, 'admin'::text])
);