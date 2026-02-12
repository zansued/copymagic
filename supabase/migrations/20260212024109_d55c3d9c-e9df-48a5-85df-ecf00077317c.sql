
-- Create brand_profiles table for multi-profile PPP/DNA system
CREATE TABLE public.brand_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Meu Perfil',
  
  -- Structured sections as JSONB for flexibility
  brand_identity JSONB NOT NULL DEFAULT '{}'::jsonb,
  brand_voice JSONB NOT NULL DEFAULT '{}'::jsonb,
  target_audience JSONB NOT NULL DEFAULT '{}'::jsonb,
  product_service JSONB NOT NULL DEFAULT '{}'::jsonb,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Legacy compat: simple text fields for quick access
  personality_summary TEXT NOT NULL DEFAULT '',
  audience_summary TEXT NOT NULL DEFAULT '',
  product_summary TEXT NOT NULL DEFAULT '',
  
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own brand profiles"
ON public.brand_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brand profiles"
ON public.brand_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand profiles"
ON public.brand_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand profiles"
ON public.brand_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_brand_profiles_updated_at
BEFORE UPDATE ON public.brand_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
