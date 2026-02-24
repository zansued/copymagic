
-- Cache table for query packs (reduces OpenAI calls)
CREATE TABLE public.research_query_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  niche text NOT NULL,
  queries jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT research_query_cache_niche_unique UNIQUE (niche)
);

-- RLS: service_role only (edge function uses service role client)
ALTER TABLE public.research_query_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages query cache"
ON public.research_query_cache
FOR ALL
USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text)
WITH CHECK (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);
