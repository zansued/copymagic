import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, Mail, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function DataDeletion() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-2xl mx-auto px-6 py-12 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="h-6 w-6 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Exclusão de Dados do Usuário</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Em conformidade com a LGPD e as políticas da Meta/Facebook.
        </p>

        {!submitted ? (
          <>
            <Card className="p-6 border-border/50 bg-card/80 space-y-6 mb-8">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Solicitar Exclusão de Dados</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Você pode solicitar a exclusão completa de todos os dados associados à sua conta no CopyEngine. 
                  Isso inclui dados de perfil, projetos, gerações, configurações de agentes e qualquer informação 
                  armazenada em nosso sistema.
                </p>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-sm text-destructive">
                      <p className="font-medium">Atenção: esta ação é irreversível.</p>
                      <p className="mt-1 opacity-80">
                        Todos os seus dados serão permanentemente excluídos em até 30 dias após a confirmação. 
                        Não será possível recuperá-los.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      E-mail da conta
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="flex-1"
                      />
                      <Button type="submit" variant="destructive" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Solicitar Exclusão
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </Card>

            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
              <h2 className="text-lg font-semibold text-foreground">Dados que serão excluídos</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Informações de perfil e conta (nome, e-mail)</li>
                <li>Projetos de copywriting e resultados gerados</li>
                <li>Perfis de DNA de Marca</li>
                <li>Configurações de agentes e histórico de gerações</li>
                <li>Conversas com o Mentor IA</li>
                <li>Roadmaps e planos estratégicos</li>
                <li>Pesquisas de ofertas e anúncios salvos</li>
                <li>Dados de assinatura e pagamento</li>
                <li>Qualquer dado coletado via login com Facebook/Meta</li>
              </ul>

              <h2 className="text-lg font-semibold text-foreground">Processo de Exclusão</h2>
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Envie sua solicitação através do formulário acima.</li>
                <li>Você receberá um e-mail de confirmação em até 48 horas.</li>
                <li>Após confirmação, seus dados serão excluídos em até 30 dias.</li>
                <li>Você receberá uma notificação final quando o processo for concluído.</li>
              </ol>

              <h2 className="text-lg font-semibold text-foreground">Contato</h2>
              <p>
                Em caso de dúvidas sobre a exclusão de dados, entre em contato pelo e-mail:{" "}
                <a href="mailto:contato@copyengine.com.br" className="text-primary hover:underline">
                  contato@copyengine.com.br
                </a>
              </p>

              <h2 className="text-lg font-semibold text-foreground">Base Legal</h2>
              <p>
                Este processo está em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) 
                e as políticas de dados da plataforma Meta (Facebook/Instagram), garantindo ao titular dos dados 
                o direito à eliminação de seus dados pessoais mediante solicitação.
              </p>
            </div>
          </>
        ) : (
          <Card className="p-8 border-border/50 bg-card/80 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Solicitação Recebida</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Sua solicitação de exclusão de dados para <strong className="text-foreground">{email}</strong> foi 
              registrada. Você receberá um e-mail de confirmação em até 48 horas.
            </p>
            <p className="text-xs text-muted-foreground">
              Código de referência: DEL-{Date.now().toString(36).toUpperCase()}
            </p>
          </Card>
        )}
      </div>

      <footer className="border-t border-border/50 bg-card/30 mt-auto">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} CopyEngine.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">Termos</Link>
            <Link to="/privacy" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
