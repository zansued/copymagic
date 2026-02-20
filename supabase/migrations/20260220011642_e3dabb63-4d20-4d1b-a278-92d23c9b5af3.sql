
-- Shared library: copies/outputs salvos para o time
CREATE TABLE public.shared_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  agent_name TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'geral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_library ENABLE ROW LEVEL SECURITY;

-- All team members can view
CREATE POLICY "Team members can view shared library"
ON public.shared_library FOR SELECT
USING (is_team_member(auth.uid(), team_id));

-- Any team member can insert
CREATE POLICY "Team members can add to shared library"
ON public.shared_library FOR INSERT
WITH CHECK (is_team_member(auth.uid(), team_id) AND auth.uid() = created_by);

-- Creator, owner or admin can update
CREATE POLICY "Creator or admin can update shared library"
ON public.shared_library FOR UPDATE
USING (
  auth.uid() = created_by
  OR get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
);

-- Creator, owner or admin can delete
CREATE POLICY "Creator or admin can delete shared library"
ON public.shared_library FOR DELETE
USING (
  auth.uid() = created_by
  OR get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_shared_library_updated_at
BEFORE UPDATE ON public.shared_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
