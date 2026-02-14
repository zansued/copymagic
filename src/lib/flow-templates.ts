import { Rocket, Megaphone, PenTool, ShoppingBag, Mail, Video } from "lucide-react";

export interface FlowTemplate {
  id: string;
  title: string;
  description: string;
  icon: typeof Rocket;
  gradient: string;
  prompt: string;
}

export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: "launch-product",
    title: "Lançar Produto Digital",
    description: "Do zero ao lançamento: ICP, oferta, página de vendas, anúncios e VSL",
    icon: Rocket,
    gradient: "from-violet-500/20 to-purple-600/20",
    prompt:
      "Quero lançar meu primeiro produto digital. Me ajude a criar um plano completo desde a definição do cliente ideal até a página de vendas e anúncios.",
  },
  {
    id: "scale-ads",
    title: "Escalar Anúncios",
    description: "Análise de marketing, ângulos, funil de ads e criativos otimizados",
    icon: Megaphone,
    gradient: "from-blue-500/20 to-cyan-500/20",
    prompt:
      "Preciso escalar meus anúncios pagos. Quero analisar minha estratégia atual e criar novos ângulos, funil de anúncios e criativos de alta conversão.",
  },
  {
    id: "content-machine",
    title: "Máquina de Conteúdo",
    description: "Calendário, carrosséis, vídeos, stories e legendas para 30 dias",
    icon: PenTool,
    gradient: "from-emerald-500/20 to-green-500/20",
    prompt:
      "Quero criar uma máquina de conteúdo para 30 dias. Preciso de calendário editorial, roteiros de vídeo, carrosséis e legendas estratégicas.",
  },
  {
    id: "high-ticket",
    title: "Oferta High Ticket",
    description: "Produto premium, premissa persuasiva, mecanismo único e VSL",
    icon: ShoppingBag,
    gradient: "from-amber-500/20 to-orange-500/20",
    prompt:
      "Quero criar uma oferta high ticket. Me ajude a estruturar o produto, a premissa persuasiva, o mecanismo único e o roteiro de VSL para vender.",
  },
  {
    id: "email-funnel",
    title: "Funil de E-mails",
    description: "Isca digital, sequência de e-mails, assuntos e páginas de captura",
    icon: Mail,
    gradient: "from-pink-500/20 to-rose-500/20",
    prompt:
      "Quero montar um funil de e-mails completo. Preciso de uma isca digital, sequência de e-mails de nutrição e vendas, e uma landing page de captura.",
  },
  {
    id: "vsl-launch",
    title: "Lançamento com VSL",
    description: "Roteiro completo de VSL, página de vendas e funil de anúncios",
    icon: Video,
    gradient: "from-fuchsia-500/20 to-purple-500/20",
    prompt:
      "Quero fazer um lançamento baseado em VSL. Preciso do roteiro da VSL, página de vendas otimizada e funil de anúncios para tráfego.",
  },
];
