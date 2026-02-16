
-- Table for roadmaps
CREATE TABLE public.roadmaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  brand_profile_id UUID REFERENCES public.brand_profiles(id) ON DELETE SET NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roadmaps" ON public.roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own roadmaps" ON public.roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roadmaps" ON public.roadmaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own roadmaps" ON public.roadmaps FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_roadmaps_updated_at
BEFORE UPDATE ON public.roadmaps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
