
-- =============================================
-- Sprint 1: Teams, Members & Invites
-- =============================================

-- 1. Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Minha Equipe',
  owner_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'agency',
  seats_limit integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 2. Team members table (roles stored separately as required)
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'editor',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'editor', 'viewer'))
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 3. Team invites table
CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'editor',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  CONSTRAINT valid_invite_role CHECK (role IN ('admin', 'editor', 'viewer')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Triggers for updated_at
-- =============================================

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Helper: check if user is member of a team
-- =============================================

CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_team_role(_user_id uuid, _team_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.team_members
  WHERE user_id = _user_id AND team_id = _team_id
  LIMIT 1
$$;

-- =============================================
-- RLS Policies: teams
-- =============================================

-- Members can view their team
CREATE POLICY "Team members can view team"
  ON public.teams FOR SELECT
  USING (public.is_team_member(auth.uid(), id));

-- Only the owner can create a team (owner_id must match)
CREATE POLICY "Users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Only owner can update team
CREATE POLICY "Owner can update team"
  ON public.teams FOR UPDATE
  USING (auth.uid() = owner_id);

-- Only owner can delete team
CREATE POLICY "Owner can delete team"
  ON public.teams FOR DELETE
  USING (auth.uid() = owner_id);

-- =============================================
-- RLS Policies: team_members
-- =============================================

-- Members can view other members of their team
CREATE POLICY "Members can view team members"
  ON public.team_members FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));

-- Owner/admin can add members
CREATE POLICY "Owner or admin can add members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
  );

-- Owner/admin can update member roles
CREATE POLICY "Owner or admin can update members"
  ON public.team_members FOR UPDATE
  USING (
    public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
  );

-- Owner/admin can remove members (or member can leave)
CREATE POLICY "Owner admin or self can delete members"
  ON public.team_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
  );

-- =============================================
-- RLS Policies: team_invites
-- =============================================

-- Team members can view invites for their team
CREATE POLICY "Members can view team invites"
  ON public.team_invites FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));

-- Owner/admin can create invites
CREATE POLICY "Owner or admin can create invites"
  ON public.team_invites FOR INSERT
  WITH CHECK (
    public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
    AND auth.uid() = invited_by
  );

-- Owner/admin can update invites (cancel)
CREATE POLICY "Owner or admin can update invites"
  ON public.team_invites FOR UPDATE
  USING (
    public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
  );

-- Owner/admin can delete invites
CREATE POLICY "Owner or admin can delete invites"
  ON public.team_invites FOR DELETE
  USING (
    public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
  );
