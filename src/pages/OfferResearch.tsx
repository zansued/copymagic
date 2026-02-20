import { TopNav } from "@/components/TopNav";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Globe, Search, Key, BarChart3 } from "lucide-react";
import AiResearchTab from "@/components/offer-research/AiResearchTab";
import SwipeOffersTab from "@/components/offer-research/SwipeOffersTab";
import KeywordsTab from "@/components/offer-research/KeywordsTab";
import ResultsTab from "@/components/offer-research/ResultsTab";

export default function OfferResearch() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Pesquisa de Ofertas Escaladas</h1>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">Premium</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Descubra tendências, analise anúncios e encontre ofertas vencedoras em qualquer nicho.
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="pesquisa" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-11">
            <TabsTrigger value="pesquisa" className="gap-1.5 text-xs sm:text-sm">
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pesquisa IA</span>
              <span className="sm:hidden">IA</span>
            </TabsTrigger>
            <TabsTrigger value="swipe" className="gap-1.5 text-xs sm:text-sm">
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Swipe Offers</span>
              <span className="sm:hidden">Swipe</span>
            </TabsTrigger>
            <TabsTrigger value="keywords" className="gap-1.5 text-xs sm:text-sm">
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keywords</span>
              <span className="sm:hidden">Keys</span>
            </TabsTrigger>
            <TabsTrigger value="resultados" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Resultados</span>
              <span className="sm:hidden">Score</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pesquisa">
            <AiResearchTab />
          </TabsContent>
          <TabsContent value="swipe">
            <SwipeOffersTab />
          </TabsContent>
          <TabsContent value="keywords">
            <KeywordsTab />
          </TabsContent>
          <TabsContent value="resultados">
            <ResultsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
