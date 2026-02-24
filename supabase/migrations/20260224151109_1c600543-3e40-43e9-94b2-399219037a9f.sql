
-- Add page_spec column to site_generations for structured PageSpec storage
ALTER TABLE public.site_generations ADD COLUMN IF NOT EXISTS page_spec jsonb NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_generations_project_updated ON public.site_generations (project_id, updated_at DESC);
