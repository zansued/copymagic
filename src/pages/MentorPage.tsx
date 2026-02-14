import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import MentorChat from "@/components/mentor/MentorChat";
import MentorFlowPanel, { Flow, FlowStep } from "@/components/mentor/MentorFlowPanel";
import MentorAgentExecutor from "@/components/mentor/MentorAgentExecutor";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export default function MentorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Dialog-based agent execution
  const [executingStep, setExecutingStep] = useState<{ flowId: string; stepId: string; agentId: string; title: string } | null>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    supabase
      .from("mentor_conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setConversations(data || []));
  }, [user]);

  // Load messages & flows when conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setFlows([]);
      return;
    }

    Promise.all([
      supabase
        .from("mentor_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("mentor_flows")
        .select("id, title, goal, status")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true }),
    ]).then(async ([msgRes, flowRes]) => {
      setMessages(
        (msgRes.data || []).map((m: any) => ({ id: m.id, role: m.role, content: m.content }))
      );

      const flowList = flowRes.data || [];
      const flowsWithSteps: Flow[] = [];

      for (const flow of flowList) {
        const { data: steps } = await supabase
          .from("mentor_flow_steps")
          .select("id, agent_id, title, description, status, step_order, output")
          .eq("flow_id", flow.id)
          .order("step_order", { ascending: true });

        flowsWithSteps.push({
          ...flow,
          status: flow.status as Flow["status"],
          steps: (steps || []).map((s: any) => ({ ...s, status: s.status as FlowStep["status"] })),
        });
      }

      setFlows(flowsWithSteps);
    });
  }, [activeConversationId]);

  const createConversation = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("mentor_conversations")
      .insert({ user_id: user.id, title: "Nova conversa" })
      .select("id, title, created_at")
      .single();

    if (error || !data) {
      toast({ title: "Erro ao criar conversa", variant: "destructive" });
      return null;
    }

    setConversations((prev) => [data, ...prev]);
    setActiveConversationId(data.id);
    return data.id;
  };

  const parseFlowFromResponse = async (content: string, conversationId: string) => {
    const flowMatch = content.match(/```flow\s*([\s\S]*?)```/);
    if (!flowMatch) return;

    try {
      const flowData = JSON.parse(flowMatch[1]);
      if (!flowData.title || !flowData.steps?.length) return;

      const { data: flow, error } = await supabase
        .from("mentor_flows")
        .insert({
          conversation_id: conversationId,
          user_id: user!.id,
          title: flowData.title,
          goal: flowData.goal || "",
        })
        .select("id, title, goal, status")
        .single();

      if (error || !flow) return;

      const stepsToInsert = flowData.steps.map((s: any, idx: number) => ({
        flow_id: flow.id,
        step_order: idx + 1,
        agent_id: s.agent_id,
        title: s.title,
        description: s.description || "",
      }));

      const { data: steps } = await supabase
        .from("mentor_flow_steps")
        .insert(stepsToInsert)
        .select("id, agent_id, title, description, status, step_order, output");

      setFlows((prev) => [
        ...prev,
        {
          ...flow,
          status: flow.status as Flow["status"],
          steps: (steps || []).map((s: any) => ({ ...s, status: s.status as FlowStep["status"] })),
        },
      ]);
    } catch {
      // Invalid JSON — ignore
    }
  };

  const handleSendMessage = useCallback(async (content: string) => {
    let convId = activeConversationId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) return;
    }

    const { data: userMsg } = await supabase
      .from("mentor_messages")
      .insert({ conversation_id: convId, role: "user", content })
      .select("id")
      .single();

    const newUserMsg: Message = { id: userMsg?.id || crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, newUserMsg]);

    if (messages.length === 0) {
      const title = content.slice(0, 60) + (content.length > 60 ? "..." : "");
      await supabase.from("mentor_conversations").update({ title }).eq("id", convId);
      setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title } : c)));
    }

    setIsGenerating(true);
    setStreamingContent("");
    abortRef.current = new AbortController();

    const allMessages = [...messages, newUserMsg].map((m) => ({ role: m.role, content: m.content }));
    const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Você precisa estar logado");

      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: allMessages, provider: "openai" }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      if (!resp.body) throw new Error("Stream não disponível");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              accumulated += c;
              setStreamingContent(accumulated);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      const { data: assistantMsg } = await supabase
        .from("mentor_messages")
        .insert({ conversation_id: convId, role: "assistant", content: accumulated })
        .select("id")
        .single();

      const newAssistantMsg: Message = { id: assistantMsg?.id || crypto.randomUUID(), role: "assistant", content: accumulated };
      setMessages((prev) => [...prev, newAssistantMsg]);
      setStreamingContent("");
      setIsGenerating(false);

      await parseFlowFromResponse(accumulated, convId);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({ title: `Erro: ${err.message}`, variant: "destructive" });
      }
      setIsGenerating(false);
      setStreamingContent("");
    }
  }, [activeConversationId, messages, user]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
  };

  const handleExecuteStep = (flowId: string, stepId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    const step = flow?.steps.find((s) => s.id === stepId);
    if (!step) return;
    setExecutingStep({ flowId, stepId, agentId: step.agent_id, title: step.title });
  };

  const handleStepComplete = async (output: string) => {
    if (!executingStep) return;

    await supabase
      .from("mentor_flow_steps")
      .update({ status: "completed", output })
      .eq("id", executingStep.stepId);

    setFlows((prev) =>
      prev.map((f) =>
        f.id === executingStep.flowId
          ? {
              ...f,
              steps: f.steps.map((s) =>
                s.id === executingStep.stepId ? { ...s, status: "completed" as const, output } : s
              ),
            }
          : f
      )
    );

    setExecutingStep(null);
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("mentor_conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
      setFlows([]);
    }
  };

  return (
    <div className="h-screen bg-background flex">
      {/* Left sidebar - Conversations */}
      {showSidebar && (
        <div className="w-64 border-r border-border/50 flex flex-col bg-card/30">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate("/agents")} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold gradient-text font-[Space_Grotesk]">🧠 Mentor</h2>
            <Button variant="ghost" size="icon" onClick={() => createConversation()} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-sm ${
                  activeConversationId === conv.id
                    ? "bg-primary/10 text-foreground border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground border border-transparent"
                }`}
                onClick={() => setActiveConversationId(conv.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}

            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                Nenhuma conversa ainda
              </p>
            )}
          </div>
        </div>
      )}

      {/* Center - Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <MentorChat
          messages={messages}
          isGenerating={isGenerating}
          streamingContent={streamingContent}
          onSend={handleSendMessage}
          onStop={handleStop}
        />
      </div>

      {/* Right - Flow Panel */}
      <div className="w-80 border-l border-border/50 hidden lg:flex flex-col bg-card/20">
        <MentorFlowPanel
          flows={flows}
          onExecuteStep={handleExecuteStep}
          activeStepId={executingStep?.stepId || null}
        />
      </div>

      {/* Agent Executor Dialog */}
      <Dialog open={!!executingStep} onOpenChange={(open) => { if (!open) setExecutingStep(null); }}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden border-border/50 bg-background">
          {executingStep && (
            <MentorAgentExecutor
              agentId={executingStep.agentId}
              stepTitle={executingStep.title}
              onClose={() => setExecutingStep(null)}
              onComplete={handleStepComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
