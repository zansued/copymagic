-- RPC segura para responder convites sem depender de update direto via client
CREATE OR REPLACE FUNCTION public.respond_to_team_invite(
  p_invite_id uuid,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invite public.team_invites%ROWTYPE;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_action NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  SELECT *
  INTO v_invite
  FROM public.team_invites
  WHERE id = p_invite_id
    AND status = 'pending'
    AND expires_at > now()
    AND lower(email) = lower(public.current_user_email())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or not allowed';
  END IF;

  UPDATE public.team_invites
  SET status = p_action
  WHERE id = v_invite.id;

  IF p_action = 'accepted' THEN
    INSERT INTO public.team_members (team_id, user_id, role)
    SELECT v_invite.team_id, v_user_id, v_invite.role
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = v_invite.team_id
        AND tm.user_id = v_user_id
    );
  END IF;

  RETURN true;
END;
$$;