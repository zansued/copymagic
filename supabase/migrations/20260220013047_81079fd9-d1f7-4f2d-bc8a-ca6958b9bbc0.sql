
-- Function to get team member generation stats (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.get_team_member_stats(_team_id uuid)
RETURNS TABLE(
  user_id uuid,
  total_generations bigint,
  last_generation_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tm.user_id,
    COUNT(ag.id) AS total_generations,
    MAX(ag.created_at) AS last_generation_at
  FROM public.team_members tm
  LEFT JOIN public.agent_generations ag ON ag.user_id = tm.user_id
  WHERE tm.team_id = _team_id
    AND is_team_member(auth.uid(), _team_id)
  GROUP BY tm.user_id
$$;
