
-- Table to store emoji reactions on team messages
CREATE TABLE public.team_message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.team_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.team_message_reactions ENABLE ROW LEVEL SECURITY;

-- Team members can view reactions on their team's messages
CREATE POLICY "Team members can view reactions"
ON public.team_message_reactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.team_messages tm
  WHERE tm.id = team_message_reactions.message_id
  AND is_team_member(auth.uid(), tm.team_id)
));

-- Team members can add reactions
CREATE POLICY "Team members can add reactions"
ON public.team_message_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.team_messages tm
    WHERE tm.id = team_message_reactions.message_id
    AND is_team_member(auth.uid(), tm.team_id)
  )
);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON public.team_message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_message_reactions;
