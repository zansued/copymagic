
-- Review requests table
CREATE TABLE public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  reviewer_id UUID,
  generation_id UUID REFERENCES public.agent_generations(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  agent_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view review requests"
ON public.review_requests FOR SELECT
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can create review requests"
ON public.review_requests FOR INSERT
WITH CHECK (is_team_member(auth.uid(), team_id) AND auth.uid() = requested_by);

CREATE POLICY "Owner admin can update review requests"
ON public.review_requests FOR UPDATE
USING (
  get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
  OR auth.uid() = requested_by
);

CREATE POLICY "Owner admin can delete review requests"
ON public.review_requests FOR DELETE
USING (
  get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
  OR auth.uid() = requested_by
);

-- Review comments table
CREATE TABLE public.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.review_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view review comments"
ON public.review_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.review_requests r
    WHERE r.id = review_comments.review_id
    AND is_team_member(auth.uid(), r.team_id)
  )
);

CREATE POLICY "Team members can create review comments"
ON public.review_comments FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1 FROM public.review_requests r
    WHERE r.id = review_comments.review_id
    AND is_team_member(auth.uid(), r.team_id)
  )
);

CREATE POLICY "Author can delete own comments"
ON public.review_comments FOR DELETE
USING (auth.uid() = author_id);

-- Trigger for updated_at
CREATE TRIGGER update_review_requests_updated_at
BEFORE UPDATE ON public.review_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
