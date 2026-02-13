
-- Mentor conversations
CREATE TABLE public.mentor_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentor conversations" ON public.mentor_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own mentor conversations" ON public.mentor_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mentor conversations" ON public.mentor_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mentor conversations" ON public.mentor_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mentor_conversations_updated_at
  BEFORE UPDATE ON public.mentor_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mentor messages
CREATE TABLE public.mentor_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.mentor_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentor messages" ON public.mentor_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.mentor_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can create own mentor messages" ON public.mentor_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.mentor_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- Mentor flows (generated plans)
CREATE TABLE public.mentor_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.mentor_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  goal TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentor flows" ON public.mentor_flows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own mentor flows" ON public.mentor_flows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mentor flows" ON public.mentor_flows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mentor flows" ON public.mentor_flows FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mentor_flows_updated_at
  BEFORE UPDATE ON public.mentor_flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mentor flow steps
CREATE TABLE public.mentor_flow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.mentor_flows(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_flow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentor flow steps" ON public.mentor_flow_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.mentor_flows f WHERE f.id = flow_id AND f.user_id = auth.uid()));
CREATE POLICY "Users can create own mentor flow steps" ON public.mentor_flow_steps FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.mentor_flows f WHERE f.id = flow_id AND f.user_id = auth.uid()));
CREATE POLICY "Users can update own mentor flow steps" ON public.mentor_flow_steps FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.mentor_flows f WHERE f.id = flow_id AND f.user_id = auth.uid()));

CREATE TRIGGER update_mentor_flow_steps_updated_at
  BEFORE UPDATE ON public.mentor_flow_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
