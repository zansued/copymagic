
-- Add team_id to projects (nullable, so existing projects remain personal)
ALTER TABLE public.projects 
ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- Index for fast team project queries
CREATE INDEX idx_projects_team_id ON public.projects(team_id) WHERE team_id IS NOT NULL;

-- Team members can view team projects
CREATE POLICY "Team members can view team projects"
ON public.projects
FOR SELECT
USING (
  team_id IS NOT NULL 
  AND is_team_member(auth.uid(), team_id)
);

-- Team members (editor+) can create projects for their team
CREATE POLICY "Team members can create team projects"
ON public.projects
FOR INSERT
WITH CHECK (
  team_id IS NOT NULL
  AND auth.uid() = user_id
  AND is_team_member(auth.uid(), team_id)
  AND get_team_role(auth.uid(), team_id) IN ('owner', 'admin', 'editor')
);

-- Team owner/admin can update any team project; editor can update own
CREATE POLICY "Team members can update team projects"
ON public.projects
FOR UPDATE
USING (
  team_id IS NOT NULL
  AND is_team_member(auth.uid(), team_id)
  AND (
    get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
    OR auth.uid() = user_id
  )
);

-- Team owner/admin can delete team projects; creator can delete own
CREATE POLICY "Team members can delete team projects"
ON public.projects
FOR DELETE
USING (
  team_id IS NOT NULL
  AND is_team_member(auth.uid(), team_id)
  AND (
    get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
    OR auth.uid() = user_id
  )
);
