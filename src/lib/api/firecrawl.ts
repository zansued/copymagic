import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

export const firecrawlApi = {
  async scrape(url: string): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options: { formats: ['markdown'], onlyMainContent: true } },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  async search(query: string, options?: { limit?: number; lang?: string; country?: string }): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-search', {
      body: {
        query,
        options: {
          limit: options?.limit || 8,
          lang: options?.lang || 'pt-br',
          country: options?.country || 'BR',
          scrapeOptions: { formats: ['markdown'] },
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
