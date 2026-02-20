
-- Team messages table (ephemeral, 24h messages)
CREATE TABLE public.team_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Team members can view messages
CREATE POLICY "Team members can view team messages"
ON public.team_messages FOR SELECT
USING (is_team_member(auth.uid(), team_id));

-- Team members can send messages
CREATE POLICY "Team members can send team messages"
ON public.team_messages FOR INSERT
WITH CHECK (is_team_member(auth.uid(), team_id) AND auth.uid() = author_id);

-- Author can delete own messages
CREATE POLICY "Author can delete own messages"
ON public.team_messages FOR DELETE
USING (auth.uid() = author_id);

-- Owner/admin can delete any message or pin
CREATE POLICY "Owner admin can delete any message"
ON public.team_messages FOR DELETE
USING (get_team_role(auth.uid(), team_id) IN ('owner', 'admin'));

-- Owner/admin can update messages (pin/unpin)
CREATE POLICY "Owner admin can update messages"
ON public.team_messages FOR UPDATE
USING (get_team_role(auth.uid(), team_id) IN ('owner', 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
