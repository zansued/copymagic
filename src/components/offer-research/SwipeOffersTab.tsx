import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function SwipeOffersTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="p-8 border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Swipe Offers</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Busque anúncios diretamente na Meta Ad Library, analise criativos, e classifique ofertas com scoring heurístico.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Badge variant="secondary" className="gap-1">
              <ExternalLink className="h-3 w-3" /> Meta Ad Library
            </Badge>
            <Badge variant="outline">Scoring local</Badge>
            <Badge variant="outline">Importação manual</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            🚧 Em construção — Etapa 2 da migração
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
