
-- Table to store user's agent configuration (personality, audience, product)
CREATE TABLE public.agent_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_personality TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  product_service TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- One config per user
CREATE UNIQUE INDEX idx_agent_configs_user_id ON public.agent_configs (user_id);

-- Enable RLS
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent config"
ON public.agent_configs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent config"
ON public.agent_configs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent config"
ON public.agent_configs FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_agent_configs_updated_at
BEFORE UPDATE ON public.agent_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
