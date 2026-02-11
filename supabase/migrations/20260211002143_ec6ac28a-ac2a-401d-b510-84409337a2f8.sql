
-- Add LCM (Language & Cultural Modeling) columns to projects table
ALTER TABLE public.projects
  ADD COLUMN language_code TEXT NOT NULL DEFAULT 'pt-BR',
  ADD COLUMN cultural_region TEXT DEFAULT 'auto',
  ADD COLUMN tone_formality TEXT NOT NULL DEFAULT 'neutral',
  ADD COLUMN avoid_real_names BOOLEAN NOT NULL DEFAULT true;
