import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { useTeam } from "@/hooks/use-team";
import { useSharedLibrary, SharedLibraryItem } from "@/hooks/use-shared-library";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpen, Plus, Search, Trash2, Pencil, Copy, Loader2, Tag, Users } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
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
        ) : (
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
    </div>
  );
}
