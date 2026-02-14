
-- Table to store agent generation history
CREATE TABLE public.agent_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  output TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT 'deepseek',
  brand_profile_id UUID REFERENCES public.brand_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_generations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own generations
CREATE POLICY "Users can view own agent generations"
  ON public.agent_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own agent generations"
  ON public.agent_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent generations"
  ON public.agent_generations FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_agent_generations_user_agent ON public.agent_generations (user_id, agent_id, created_at DESC);
