import { TopNav } from "@/components/TopNav";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
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

        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">
          <p><strong>Última atualização:</strong> 17 de fevereiro de 2026</p>

          <h2>1. Dados Coletados</h2>
          <p>Coletamos os seguintes dados:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Dados de cadastro:</strong> e-mail e senha (criptografada)</li>
            <li><strong>Dados de uso:</strong> interações com a plataforma, gerações realizadas, projetos criados</li>
            <li><strong>Dados de pagamento:</strong> processados por terceiros (MercadoPago). Não armazenamos dados de cartão</li>
            <li><strong>Conteúdo gerado:</strong> textos, análises e configurações criadas na plataforma</li>
          </ul>

          <h2>2. Uso dos Dados</h2>
          <p>Seus dados são utilizados para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Prover e melhorar o Serviço</li>
            <li>Personalizar sua experiência</li>
            <li>Processar pagamentos e gerenciar assinaturas</li>
            <li>Enviar comunicações relevantes sobre o Serviço</li>
            <li>Garantir a segurança da plataforma</li>
          </ul>

          <h2>3. Compartilhamento de Dados</h2>
          <p>
            Não vendemos seus dados pessoais. Podemos compartilhar dados com:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Provedores de IA:</strong> textos enviados para geração (sem dados pessoais identificáveis)</li>
            <li><strong>Processadores de pagamento:</strong> MercadoPago para transações financeiras</li>
            <li><strong>Infraestrutura:</strong> serviços de hospedagem e banco de dados</li>
          </ul>

          <h2>4. Armazenamento e Segurança</h2>
          <p>
            Seus dados são armazenados em servidores seguros com criptografia em trânsito e em repouso. 
            Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado.
          </p>

          <h2>5. Seus Direitos (LGPD)</h2>
          <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão dos seus dados</li>
            <li>Revogar consentimento a qualquer momento</li>
            <li>Solicitar portabilidade dos dados</li>
          </ul>

          <h2>6. Cookies</h2>
          <p>
            Utilizamos cookies essenciais para autenticação e funcionamento da plataforma. 
            Não utilizamos cookies de rastreamento de terceiros para publicidade.
          </p>

          <h2>7. Retenção de Dados</h2>
          <p>
            Seus dados são mantidos enquanto sua conta estiver ativa. 
            Após exclusão da conta, seus dados serão removidos em até 30 dias, 
            exceto quando a retenção for exigida por lei.
          </p>

          <h2>8. Alterações</h2>
          <p>
            Esta política pode ser atualizada periodicamente. 
            Alterações significativas serão comunicadas por e-mail ou notificação na plataforma.
          </p>

          <h2>9. Contato</h2>
          <p>
            Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, 
            entre em contato pelo e-mail: privacidade@copyengine.app
          </p>
        </div>
      </main>
    </div>
  );
}
