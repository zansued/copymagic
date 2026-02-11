
-- Table for storing generated site pages
CREATE TABLE public.site_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL DEFAULT 'modern-dark',
  status TEXT NOT NULL DEFAULT 'draft',
  generated_html TEXT,
  generated_assets JSONB DEFAULT '{}'::jsonb,
  language_code TEXT DEFAULT 'pt-BR',
  locale_code TEXT,
  cultural_region TEXT,
  branding JSONB DEFAULT '{}'::jsonb,
  include_upsells BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_generations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own site generations"
ON public.site_generations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own site generations"
ON public.site_generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own site generations"
ON public.site_generations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own site generations"
ON public.site_generations FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_site_generations_updated_at
BEFORE UPDATE ON public.site_generations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
