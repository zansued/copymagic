import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function ResultsTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="p-8 border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-full bg-violet-500/10">
            <BarChart3 className="h-8 w-8 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Resultados & Scoring</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Visualize anúncios importados, scores heurísticos (oferta, risco, geral), alertas de compliance e exporte para CSV.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Badge variant="secondary" className="gap-1">Score de Oferta</Badge>
            <Badge variant="outline">Compliance</Badge>
            <Badge variant="outline">Export CSV</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            🚧 Em construção — Etapa 2 da migração
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
