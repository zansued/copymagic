import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Key, Plus, Trash2, ExternalLink, Copy, Check, RotateCcw,
  ChevronDown, ChevronUp, Settings2, Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { storage } from "@/lib/ad-offer/storage";
import { generateQueries } from "@/lib/ad-offer/query-generator";
import { defaultKeywordPackages, defaultModifiers, defaultNegativeWords } from "@/lib/ad-offer/keywords-data";
import type { KeywordPackage, Modifier, NegativeWord, GeneratedQuery } from "@/lib/ad-offer/types";

export default function KeywordsTab() {
  const [packages, setPackages] = useState<KeywordPackage[]>(() => storage.getPackages());
  const [modifiers, setModifiers] = useState<Modifier[]>(() => storage.getModifiers());
  const [negatives, setNegatives] = useState<NegativeWord[]>(() => storage.getNegatives());
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [selectedNiche, setSelectedNiche] = useState(packages[0]?.nicheId || "");
  const [showModifiers, setShowModifiers] = useState(false);
  const [showNegatives, setShowNegatives] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newModifier, setNewModifier] = useState("");
  const [newNegative, setNewNegative] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Save helpers
  const savePkgs = (p: KeywordPackage[]) => { setPackages(p); storage.savePackages(p); };
  const saveMods = (m: Modifier[]) => { setModifiers(m); storage.saveModifiers(m); };
  const saveNegs = (n: NegativeWord[]) => { setNegatives(n); storage.saveNegatives(n); };

  // Toggle package
  const togglePkg = (nicheId: string) => {
    savePkgs(packages.map((p) => p.nicheId === nicheId ? { ...p, enabled: !p.enabled } : p));
  };

  // Add keyword to package
  const addKeyword = (nicheId: string) => {
    if (!newKeyword.trim()) return;
    savePkgs(packages.map((p) =>
      p.nicheId === nicheId ? { ...p, keywordsBase: [...p.keywordsBase, newKeyword.trim()] } : p
    ));
    setNewKeyword("");
    toast.success("Keyword adicionada!");
  };

  // Remove keyword
  const removeKeyword = (nicheId: string, idx: number) => {
    savePkgs(packages.map((p) =>
      p.nicheId === nicheId ? { ...p, keywordsBase: p.keywordsBase.filter((_, i) => i !== idx) } : p
    ));
  };

  // Generate queries
  const queries = useMemo<GeneratedQuery[]>(() => {
    const pkg = packages.find((p) => p.nicheId === selectedNiche);
    if (!pkg) return [];
    const activeMods = modifiers.filter((m) => m.enabled);
    return generateQueries(pkg, activeMods, 30);
  }, [selectedNiche, packages, modifiers]);

  const copyQuery = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
    toast.success("Copiado!");
  };

  const openMetaLibrary = (query: string) => {
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&media_type=all&q=${encodeURIComponent(query)}&search_type=keyword_unordered`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const resetAll = () => {
    savePkgs(defaultKeywordPackages);
    saveMods(defaultModifiers);
    saveNegs(defaultNegativeWords);
    toast.success("Configurações restauradas para os padrões!");
  };

  const enabledCount = packages.filter((p) => p.enabled).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">{enabledCount}/{packages.length} nichos ativos</Badge>
          <Badge variant="outline" className="gap-1">{modifiers.filter((m) => m.enabled).length} modificadores</Badge>
          <Badge variant="outline" className="gap-1">{negatives.filter((n) => n.enabled).length} negativos</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowModifiers(!showModifiers)} className="gap-1.5 text-xs h-8">
            <Settings2 className="h-3.5 w-3.5" /> Modificadores
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowNegatives(!showNegatives)} className="gap-1.5 text-xs h-8">
            <Settings2 className="h-3.5 w-3.5" /> Negativos
          </Button>
          <Button variant="ghost" size="sm" onClick={resetAll} className="gap-1.5 text-xs h-8">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Modifiers panel */}
      <AnimatePresence>
        {showModifiers && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="p-4 border-border/50 bg-card/80 space-y-3">
              <p className="text-sm font-semibold">Modificadores Universais</p>
              <div className="flex flex-wrap gap-1.5">
                {modifiers.map((m, i) => (
                  <Badge
                    key={i}
                    variant={m.enabled ? "default" : "outline"}
                    className="cursor-pointer text-xs gap-1"
                    onClick={() => saveMods(modifiers.map((mod, j) => j === i ? { ...mod, enabled: !mod.enabled } : mod))}
                  >
                    {m.word}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newModifier} onChange={(e) => setNewModifier(e.target.value)} placeholder="Novo modificador" className="h-8 text-sm flex-1" onKeyDown={(e) => {
                  if (e.key === "Enter" && newModifier.trim()) {
                    saveMods([...modifiers, { word: newModifier.trim(), enabled: true }]);
                    setNewModifier("");
                  }
                }} />
                <Button size="sm" variant="outline" className="h-8" onClick={() => {
                  if (newModifier.trim()) { saveMods([...modifiers, { word: newModifier.trim(), enabled: true }]); setNewModifier(""); }
                }}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Negatives panel */}
      <AnimatePresence>
        {showNegatives && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="p-4 border-border/50 bg-card/80 space-y-3">
              <p className="text-sm font-semibold">Palavras Negativas</p>
              <div className="flex flex-wrap gap-1.5">
                {negatives.map((n, i) => (
                  <Badge
                    key={i}
                    variant={n.enabled ? "destructive" : "outline"}
                    className="cursor-pointer text-xs gap-1"
                    onClick={() => saveNegs(negatives.map((neg, j) => j === i ? { ...neg, enabled: !neg.enabled } : neg))}
                  >
                    {n.word}
                    <button onClick={(e) => { e.stopPropagation(); saveNegs(negatives.filter((_, j) => j !== i)); }} className="ml-0.5 hover:text-foreground">
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newNegative} onChange={(e) => setNewNegative(e.target.value)} placeholder="Nova palavra negativa" className="h-8 text-sm flex-1" onKeyDown={(e) => {
                  if (e.key === "Enter" && newNegative.trim()) {
                    saveNegs([...negatives, { word: newNegative.trim(), enabled: true }]);
                    setNewNegative("");
                  }
                }} />
                <Button size="sm" variant="outline" className="h-8" onClick={() => {
                  if (newNegative.trim()) { saveNegs([...negatives, { word: newNegative.trim(), enabled: true }]); setNewNegative(""); }
                }}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Niche packages */}
      <div className="space-y-2">
        {packages.map((pkg) => (
          <Card key={pkg.nicheId} className={`border-border/50 bg-card/80 transition-colors ${pkg.enabled ? "border-primary/20" : "opacity-60"}`}>
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              onClick={() => setExpandedPkg(expandedPkg === pkg.nicheId ? null : pkg.nicheId)}
            >
              <Switch checked={pkg.enabled} onCheckedChange={() => togglePkg(pkg.nicheId)} onClick={(e) => e.stopPropagation()} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{pkg.nicheName}</p>
                <p className="text-[10px] text-muted-foreground">{pkg.keywordsBase.length} keywords · {pkg.termosComplementares.length} complementares</p>
              </div>
              {expandedPkg === pkg.nicheId ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>

            <AnimatePresence>
              {expandedPkg === pkg.nicheId && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
                    {/* Keywords */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">Keywords Base</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pkg.keywordsBase.map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-xs gap-1 group/kw">
                            {kw}
                            <button onClick={() => removeKeyword(pkg.nicheId, i)} className="opacity-0 group-hover/kw:opacity-100 transition-opacity">
                              <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="Adicionar keyword" className="h-7 text-xs flex-1" onKeyDown={(e) => { if (e.key === "Enter") addKeyword(pkg.nicheId); }} />
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addKeyword(pkg.nicheId)}><Plus className="h-3 w-3" /></Button>
                      </div>
                    </div>

                    {/* Complementares */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">Termos Complementares</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pkg.termosComplementares.map((tc, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tc}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>

      {/* Query Generator */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Gerador de Queries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedNiche} onValueChange={setSelectedNiche}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Selecione o nicho" />
            </SelectTrigger>
            <SelectContent>
              {packages.filter((p) => p.enabled).map((p) => (
                <SelectItem key={p.nicheId} value={p.nicheId}>{p.nicheName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {queries.length > 0 && (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {queries.map((q, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border/30 hover:border-primary/30 transition-colors group">
                  <p className="text-sm flex-1 truncate font-mono">{q.text}</p>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" onClick={() => copyQuery(q.text, i)}>
                    {copiedIdx === i ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" onClick={() => openMetaLibrary(q.text)}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {queries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Selecione um nicho ativo para gerar queries.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
