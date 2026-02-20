import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key } from "lucide-react";
import { motion } from "framer-motion";

export default function KeywordsTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="p-8 border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-full bg-amber-500/10">
            <Key className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Gerenciador de Keywords</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Pacotes de keywords por nicho com modificadores, termos negativos e gerador automático de queries para a Meta Ad Library.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Badge variant="secondary" className="gap-1">8 nichos pré-configurados</Badge>
            <Badge variant="outline">Modificadores</Badge>
            <Badge variant="outline">Gerador de queries</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            🚧 Em construção — Etapa 2 da migração
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
