import { Search } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

export interface ProjectOption {
  id: string;
  name: string;
  hasSalesCopy: boolean;
  hasUpsellCopy: boolean;
}

interface ProjectSelectorProps {
  projects: ProjectOption[];
  selectedProject: string;
  onSelect: (id: string) => void;
}

export function ProjectSelector({ projects, selectedProject, onSelect }: ProjectSelectorProps) {
  const [search, setSearch] = useState("");
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="premium-card p-5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
        Projeto
      </label>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar projeto..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground py-4 text-center">
            Nenhum projeto encontrado
          </p>
        )}
        {filtered.map((p) => (
          <motion.button
            key={p.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(p.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
              selectedProject === p.id
                ? "bg-primary/15 text-primary border border-primary/30"
                : "hover:bg-secondary/60 text-foreground/80"
            }`}
          >
            <span className="truncate block font-medium">{p.name}</span>
            <div className="flex gap-2 mt-0.5">
              {p.hasSalesCopy && (
                <span className="text-[10px] text-emerald-400/80">● Vendas</span>
              )}
              {p.hasUpsellCopy && (
                <span className="text-[10px] text-amber-400/80">● Upsell</span>
              )}
              {!p.hasSalesCopy && (
                <span className="text-[10px] text-destructive">Sem copy</span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
