
-- Table for project sharing invitations
CREATE TABLE public.project_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid NOT NULL,
  shared_with_email text NOT NULL,
  shared_with_user_id uuid,
  permission text NOT NULL DEFAULT 'viewer',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, shared_with_email)
);

ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage their shares
CREATE POLICY "Owners can manage shares"
  ON public.project_shares FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Invited users can view shares meant for them
CREATE POLICY "Invited users can view their shares"
  ON public.project_shares FOR SELECT
  USING (auth.uid() = shared_with_user_id);

-- Table for sharing individual agent generation outputs
CREATE TABLE public.generation_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid REFERENCES public.agent_generations(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid NOT NULL,
  share_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  shared_with_email text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(generation_id, shared_with_email)
);

ALTER TABLE public.generation_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage their generation shares
CREATE POLICY "Owners can manage generation shares"
  ON public.generation_shares FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Public shares can be viewed by anyone with the token (handled in app logic)
CREATE POLICY "Anyone can view public shares"
  ON public.generation_shares FOR SELECT
  USING (is_public = true);

-- Allow invited users to view projects shared with them
CREATE POLICY "Shared users can view shared projects"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.project_id = projects.id
        AND ps.shared_with_user_id = auth.uid()
        AND ps.status = 'accepted'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_project_shares_updated_at
  BEFORE UPDATE ON public.project_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
