
-- Table: ads (stores ads from Meta Ad Library)
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad_archive_id TEXT NOT NULL,
  page_name TEXT NOT NULL DEFAULT '',
  page_id TEXT,
  ad_text TEXT DEFAULT '',
  ad_snapshot_url TEXT,
  ad_creative_link_url TEXT,
  platform TEXT DEFAULT 'Facebook',
  media_type TEXT DEFAULT 'image',
  status TEXT DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  cta TEXT,
  niche TEXT,
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ad_archive_id)
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ads" ON public.ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ads" ON public.ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ads" ON public.ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ads" ON public.ads FOR DELETE USING (auth.uid() = user_id);

-- Table: offers (AI analysis of an ad's offer)
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  promise TEXT DEFAULT '',
  mechanism TEXT DEFAULT '',
  proof TEXT DEFAULT '',
  cta TEXT DEFAULT '',
  angle TEXT DEFAULT '',
  format TEXT DEFAULT '',
  score INTEGER DEFAULT 0,
  analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own offers" ON public.offers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own offers" ON public.offers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own offers" ON public.offers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own offers" ON public.offers FOR DELETE USING (auth.uid() = user_id);

-- Table: funnels (funnel analysis from ad landing pages)
CREATE TABLE public.funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  landing_url TEXT DEFAULT '',
  final_url TEXT DEFAULT '',
  landing_title TEXT DEFAULT '',
  landing_h1 TEXT DEFAULT '',
  checkout_detected BOOLEAN DEFAULT false,
  checkout_platform TEXT,
  funnel_type TEXT DEFAULT '',
  steps JSONB DEFAULT '[]'::jsonb,
  analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own funnels" ON public.funnels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own funnels" ON public.funnels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own funnels" ON public.funnels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own funnels" ON public.funnels FOR DELETE USING (auth.uid() = user_id);

-- Table: collections
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Nova Coleção',
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections" ON public.collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- Table: collection_items (many-to-many between collections and ads)
CREATE TABLE public.collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, ad_id)
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collection items" ON public.collection_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can create own collection items" ON public.collection_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can delete own collection items" ON public.collection_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_ads_user_niche ON public.ads(user_id, niche);
CREATE INDEX idx_ads_ad_archive_id ON public.ads(ad_archive_id);
CREATE INDEX idx_offers_ad_id ON public.offers(ad_id);
CREATE INDEX idx_funnels_ad_id ON public.funnels(ad_id);
CREATE INDEX idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX idx_collection_items_ad ON public.collection_items(ad_id);

-- Triggers for updated_at
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE ON public.funnels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
