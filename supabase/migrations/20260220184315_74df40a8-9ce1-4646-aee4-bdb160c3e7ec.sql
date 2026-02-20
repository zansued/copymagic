
-- Allow invited users to see their own pending invites (matched by email in JWT)
CREATE POLICY "Invited users can view own invites"
ON public.team_invites
FOR SELECT
USING (
  lower(email) = lower(auth.jwt() ->> 'email')
  AND status = 'pending'
);

-- Allow invited users to update their own invite (accept/reject)
CREATE POLICY "Invited users can respond to own invites"
ON public.team_invites
FOR UPDATE
USING (
  lower(email) = lower(auth.jwt() ->> 'email')
  AND status = 'pending'
);

-- Allow invited users to insert themselves as team members when accepting
CREATE POLICY "Invited users can join team via invite"
ON public.team_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.team_invites ti
    WHERE ti.team_id = team_members.team_id
      AND lower(ti.email) = lower(auth.jwt() ->> 'email')
      AND ti.status = 'accepted'
  )
);

-- Allow invited users to view the team they're being invited to (for showing team name)
CREATE POLICY "Invited users can view invited team"
ON public.teams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_invites ti
    WHERE ti.team_id = teams.id
      AND lower(ti.email) = lower(auth.jwt() ->> 'email')
      AND ti.status = 'pending'
  )
);
