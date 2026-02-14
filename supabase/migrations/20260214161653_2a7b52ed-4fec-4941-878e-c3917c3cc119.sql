
-- Fix 1: Allow reading agent_generations through public shares
DROP POLICY IF EXISTS "Users can view own agent generations" ON public.agent_generations;

CREATE POLICY "Users can view own agent generations"
  ON public.agent_generations FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.generation_shares gs
      WHERE gs.generation_id = agent_generations.id
        AND gs.is_public = true
    )
  );

-- Fix 2: Add UPDATE policy for subscriptions (only generations_used)
CREATE POLICY "Users can update own subscription usage"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
