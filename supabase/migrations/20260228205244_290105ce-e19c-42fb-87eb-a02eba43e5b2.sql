-- Fix: change trigger to AFTER so it doesn't block the operation itself
DROP TRIGGER IF EXISTS trg_cleanup_expired_invites ON public.team_invites;

CREATE TRIGGER trg_cleanup_expired_invites
AFTER INSERT ON public.team_invites
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_invites();