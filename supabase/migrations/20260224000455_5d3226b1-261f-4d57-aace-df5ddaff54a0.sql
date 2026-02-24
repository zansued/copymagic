
-- =============================================
-- 1) team_subscriptions: limites por time (Agency)
-- =============================================
CREATE TABLE public.team_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL UNIQUE REFERENCES public.teams(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'agency',
  status text NOT NULL DEFAULT 'active',
  generations_used integer NOT NULL DEFAULT 0,
  generations_limit integer NOT NULL DEFAULT 10000,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.team_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view team subscription"
  ON public.team_subscriptions FOR SELECT
  USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Only service_role can modify team subscriptions"
  ON public.team_subscriptions FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR has_role(auth.uid(), 'admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_team_subscriptions_updated_at
  BEFORE UPDATE ON public.team_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2) usage_events: rate limiting por escopo
-- =============================================
CREATE TABLE public.usage_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope_type text NOT NULL CHECK (scope_type IN ('user', 'team')),
  scope_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for rate limit queries
CREATE INDEX idx_usage_events_scope_time
  ON public.usage_events (scope_type, scope_id, created_at DESC);

-- RLS (only service_role operates on this table)
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages usage events"
  ON public.usage_events FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Auto-create team_subscriptions when a team is created with agency plan
CREATE OR REPLACE FUNCTION public.auto_create_team_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan IN ('agency', 'agency_plus') THEN
    INSERT INTO public.team_subscriptions (team_id, plan, generations_limit)
    VALUES (
      NEW.id,
      NEW.plan,
      CASE WHEN NEW.plan = 'agency_plus' THEN 50000 ELSE 10000 END
    )
    ON CONFLICT (team_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_team_subscription
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_team_subscription();
