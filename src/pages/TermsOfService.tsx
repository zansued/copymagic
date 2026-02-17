import { TopNav } from "@/components/TopNav";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <h1 className="text-3xl font-bold mb-8">Termos de Serviço</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">
          <p><strong>Última atualização:</strong> 17 de fevereiro de 2026</p>

          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar a plataforma CopyEngine ("Serviço"), você concorda com estes Termos de Serviço. 
            Se não concordar com qualquer parte destes termos, não utilize o Serviço.
          </p>

          <h2>2. Descrição do Serviço</h2>
          <p>
            O CopyEngine é uma plataforma de inteligência artificial para criação de copy, 
            análise de ofertas, pesquisa de mercado e geração de conteúdo de marketing. 
            O Serviço inclui ferramentas de agentes de IA, mentor estratégico, 
            perfis de DNA de marca e construtor de landing pages.
          </p>

          <h2>3. Conta do Usuário</h2>
          <p>
            Você é responsável por manter a confidencialidade das credenciais da sua conta. 
            Qualquer atividade realizada na sua conta é de sua responsabilidade. 
            Notifique-nos imediatamente caso suspeite de uso não autorizado.
          </p>

          <h2>4. Uso Aceitável</h2>
          <p>Você concorda em não:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Utilizar o Serviço para fins ilegais ou não autorizados</li>
            <li>Gerar conteúdo difamatório, fraudulento ou enganoso</li>
            <li>Tentar acessar áreas restritas do sistema</li>
            <li>Revender ou redistribuir o Serviço sem autorização</li>
            <li>Interferir no funcionamento da plataforma</li>
          </ul>

          <h2>5. Propriedade Intelectual</h2>
          <p>
            O conteúdo gerado pela IA através do Serviço é de propriedade do usuário que o criou. 
            A plataforma CopyEngine, incluindo sua marca, código, design e tecnologia, 
            permanece propriedade exclusiva do CopyEngine.
          </p>

          <h2>6. Planos e Pagamentos</h2>
          <p>
            Os planos de assinatura são cobrados de acordo com o ciclo escolhido (mensal ou anual). 
            Cancelamentos podem ser solicitados a qualquer momento e serão efetivos ao final do período vigente. 
            Não há reembolso para períodos parciais.
          </p>

          <h2>7. Limitação de Responsabilidade</h2>
          <p>
            O CopyEngine é fornecido "como está". Não garantimos que o conteúdo gerado por IA 
            será preciso, completo ou adequado para qualquer finalidade específica. 
            O usuário é responsável por revisar e validar todo conteúdo antes de utilizá-lo.
          </p>

          <h2>8. Modificações</h2>
          <p>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. 
            Alterações significativas serão comunicadas por e-mail ou notificação na plataforma.
          </p>

          <h2>9. Contato</h2>
          <p>
            Para dúvidas sobre estes termos, entre em contato pelo e-mail: suporte@copyengine.app
          </p>
        </div>
      </main>
    </div>
  );
}
