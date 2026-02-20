
-- Drop the existing insert policy
DROP POLICY "Owner or admin can add members" ON public.team_members;

-- Recreate: allow team owner (from teams table) OR existing admin/owner to add members
CREATE POLICY "Owner or admin can add members"
ON public.team_members
FOR INSERT
WITH CHECK (
  (get_team_role(auth.uid(), team_id) = ANY (ARRAY['owner'::text, 'admin'::text]))
  OR
  (EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_id AND teams.owner_id = auth.uid()
  ))
);
