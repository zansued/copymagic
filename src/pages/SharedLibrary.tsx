import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { useTeam } from "@/hooks/use-team";
import { useSharedLibrary, SharedLibraryItem } from "@/hooks/use-shared-library";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { BookOpen, Plus, Search, Trash2, Pencil, Copy, Loader2, Tag, LayoutList, Library, Share2, FileDown } from "lucide-react";
import { Book } from "@/components/ui/book";
import ReactMarkdown from "react-markdown";

const categories = [
  { value: "geral", label: "Geral" },
  { value: "headline", label: "Headline" },
  { value: "body", label: "Body Copy" },
  { value: "cta", label: "CTA" },
  { value: "email", label: "E-mail" },
  { value: "ad", label: "Anúncio" },
  { value: "landing", label: "Landing Page" },
  { value: "social", label: "Social Media" },
];

const categoryColors: Record<string, string> = {
  geral: "hsl(var(--muted))",
  headline: "hsl(262, 83%, 65%)",
  body: "hsl(220, 90%, 56%)",
  cta: "hsl(0, 72%, 55%)",
  email: "hsl(292, 70%, 50%)",
  ad: "hsl(35, 90%, 55%)",
  landing: "hsl(170, 70%, 45%)",
  social: "hsl(200, 80%, 50%)",
};

export default function SharedLibrary() {
  const { user } = useAuth();
  const { team, loading: teamLoading, isOwnerOrAdmin } = useTeam();
  const { subscription } = useSubscription();
  const { items, loading, addItem, updateItem, deleteItem } = useSharedLibrary();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SharedLibraryItem | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "geral", tags: "" });
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"list" | "bookshelf">("bookshelf");
  const [selectedItem, setSelectedItem] = useState<SharedLibraryItem | null>(null);

  const isAgency = subscription?.plan === "agency" || subscription?.plan === "lifetime";

  if (teamLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAgency || !team) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">
            {!isAgency ? "Biblioteca é exclusiva do plano Agency" : "Crie uma equipe primeiro"}
          </h1>
          <p className="text-muted-foreground">
            {!isAgency
              ? "Faça upgrade para o plano Agency para acessar a Biblioteca Compartilhada."
              : "Acesse a página de Equipe para criar seu time."}
          </p>
          <Button onClick={() => window.location.href = !isAgency ? "/pricing" : "/team"}>
            {!isAgency ? "Ver Planos" : "Criar Equipe"}
          </Button>
        </div>
      </div>
    );
  }

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const openNew = () => {
    setEditingItem(null);
    setForm({ title: "", content: "", category: "geral", tags: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: SharedLibraryItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags.join(", "),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingItem) {
      const ok = await updateItem(editingItem.id, {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        tags,
      });
      ok ? toast.success("Item atualizado!") : toast.error("Erro ao atualizar");
    } else {
      const result = await addItem(
        { title: form.title.trim(), content: form.content.trim(), category: form.category, tags },
        user.id
      );
      result ? toast.success("Item adicionado à biblioteca!") : toast.error("Erro ao adicionar");
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteItem(id);
    ok ? toast.success("Item removido") : toast.error("Erro ao remover");
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado!");
  };

  const handleExportPdf = async (item: SharedLibraryItem) => {
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:0;top:0;width:800px;color:#000;background:#fff;padding:32px;font-family:Georgia,serif;z-index:-1;opacity:0;pointer-events:none;";
    container.innerHTML = `<h1 style="font-size:20px;font-weight:bold;margin-bottom:8px;color:#000;">${item.title.replace(/</g, "&lt;")}</h1>
      <p style="font-size:11px;color:#666;margin-bottom:16px;">${categories.find(c => c.value === item.category)?.label ?? item.category}${item.agent_name ? ` · ${item.agent_name}` : ""} · ${new Date(item.created_at).toLocaleDateString("pt-BR")}</p>
      <div style="font-size:14px;line-height:1.7;white-space:pre-wrap;color:#000;">${item.content.replace(/</g, "&lt;")}</div>`;
    document.body.appendChild(container);
    // Allow layout to settle
    await new Promise(r => setTimeout(r, 100));
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set({
        margin: [12, 12, 12, 12],
        filename: `${item.title.slice(0, 40)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false, windowWidth: 800 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(container).save();
      toast.success("PDF exportado!");
    } catch {
      toast.error("Erro ao exportar PDF");
    } finally {
      document.body.removeChild(container);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Biblioteca Compartilhada
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} {items.length === 1 ? "item" : "itens"} salvos · {team.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-0.5 rounded-lg bg-secondary/50 p-1">
              <button
                onClick={() => setView("bookshelf")}
                className={`rounded-md p-1.5 transition-all ${
                  view === "bookshelf"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Library className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-md p-1.5 transition-all ${
                  view === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={openNew} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, conteúdo ou tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {items.length === 0 ? "Nenhum item na biblioteca ainda" : "Nenhum resultado encontrado"}
            </p>
          </div>
        ) : view === "bookshelf" ? (
          /* Bookshelf View */
          <div className="space-y-6">
            {/* Bookshelf with "shelf" effect */}
            <div className="flex flex-wrap gap-6 justify-center py-6 px-4 rounded-xl bg-gradient-to-b from-secondary/30 to-transparent border border-border/30">
              {filtered.map((item) => {
                const catLabel = categories.find((c) => c.value === item.category)?.label ?? item.category;
                const catColor = categoryColors[item.category] || categoryColors.geral;
                return (
                  <div key={item.id} className="flex flex-col items-center gap-2">
                    <Book
                      title={item.title}
                      variant="stripe"
                      width={130}
                      color={catColor}
                      textColor="hsl(0, 0%, 100%)"
                      textured
                      onClick={() => setSelectedItem(item)}
                      illustration={
                        <div className="flex flex-col items-center gap-1 px-2">
                          <div
                            className="rounded-full px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-md border border-white/20 backdrop-blur-sm"
                            style={{ backgroundColor: catColor }}
                          >
                            {catLabel}
                          </div>
                          {item.agent_name && (
                            <span className="text-[7px] text-white/70 font-medium truncate max-w-[90px]">
                              🤖 {item.agent_name}
                            </span>
                          )}
                        </div>
                      }
                    />
                    <Badge variant="outline" className="text-[10px]">
                      {catLabel}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Shelf shadow line */}
            <div className="h-1 rounded-full bg-gradient-to-r from-transparent via-border to-transparent -mt-4" />
          </div>
        ) : (
          /* List View */
          <div className="grid gap-3">
            {filtered.map((item) => {
              const canManage = user?.id === item.created_by || isOwnerOrAdmin;
              return (
                <Card key={item.id} className="border-border bg-card group">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                          <Badge variant="outline" className="text-[10px]">
                            {categories.find((c) => c.value === item.category)?.label ?? item.category}
                          </Badge>
                          {item.agent_name && (
                            <Badge variant="secondary" className="text-[10px]">
                              {item.agent_name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                          {item.content}
                        </p>
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {item.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px] text-muted-foreground">
                                <Tag className="h-2.5 w-2.5 mr-0.5" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-[11px] text-muted-foreground/60">
                          {new Date(item.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(item.content)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {canManage && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Textarea
              placeholder="Conteúdo da copy..."
              rows={6}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
            <div className="flex gap-2">
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Tags (separadas por vírgula)"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="flex-1"
              />
            </div>
            <Button
              className="w-full"
              disabled={!form.title.trim() || !form.content.trim() || saving}
              onClick={handleSave}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingItem ? "Salvar Alterações" : "Adicionar à Biblioteca"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Book Detail Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
          {selectedItem && (
            <>
              {/* Header with colored accent bar */}
              <div
                className="h-1.5 w-full shrink-0"
                style={{ background: categoryColors[selectedItem.category] || categoryColors.geral }}
              />
              <SheetHeader className="px-6 pt-5 pb-0 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <SheetTitle className="text-lg font-bold text-foreground leading-tight">
                      {selectedItem.title}
                    </SheetTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className="text-[10px] font-medium border-0 text-white"
                        style={{ backgroundColor: categoryColors[selectedItem.category] || categoryColors.geral }}
                      >
                        {categories.find((c) => c.value === selectedItem.category)?.label ?? selectedItem.category}
                      </Badge>
                      {selectedItem.agent_name && (
                        <Badge variant="secondary" className="text-[10px]">
                          🤖 {selectedItem.agent_name}
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(selectedItem.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* Scrollable content */}
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="prose-premium max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{selectedItem.content}</ReactMarkdown>
                </div>
              </ScrollArea>

              {/* Sticky footer actions */}
              <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm px-6 py-3 flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleCopy(selectedItem.content)}>
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleExportPdf(selectedItem)}>
                  <FileDown className="h-3.5 w-3.5" /> PDF
                </Button>
                {selectedItem.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap ml-auto">
                    {selectedItem.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] text-muted-foreground">
                        <Tag className="h-2.5 w-2.5 mr-0.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {(user?.id === selectedItem.created_by || isOwnerOrAdmin) && (
                  <>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setSelectedItem(null); openEdit(selectedItem); }}>
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive hover:bg-destructive/10"
                      onClick={() => { handleDelete(selectedItem.id); setSelectedItem(null); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
