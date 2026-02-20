
-- Allow team owner to see their team right after creation (before team_members row exists)
CREATE POLICY "Owner can view own team"
ON public.teams
FOR SELECT
USING (auth.uid() = owner_id);
