-- Auto-delete expired invites: trigger on any table access + cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_invites()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.team_invites
  WHERE status = 'pending' AND expires_at <= now();
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_cleanup_expired_invites
BEFORE INSERT OR UPDATE OR DELETE ON public.team_invites
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_invites();