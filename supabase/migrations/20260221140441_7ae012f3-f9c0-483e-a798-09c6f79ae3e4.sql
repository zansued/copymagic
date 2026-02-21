
-- Add view tracking to generation_shares
ALTER TABLE public.generation_shares ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.generation_shares ADD COLUMN IF NOT EXISTS last_viewed_at timestamp with time zone;

-- Function to increment view count (callable by anyone for public shares)
CREATE OR REPLACE FUNCTION public.increment_share_view(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE generation_shares
  SET view_count = view_count + 1, last_viewed_at = now()
  WHERE share_token = p_token AND is_public = true;
END;
$$;
