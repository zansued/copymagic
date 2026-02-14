
-- Drop the overly permissive update policy
DROP POLICY "Service role can update subscriptions" ON public.subscriptions;

-- No UPDATE policy needed - service role bypasses RLS
-- This means only the webhook edge function (using service role) can update subscriptions
