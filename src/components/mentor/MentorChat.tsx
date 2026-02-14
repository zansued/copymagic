import { useState, useRef, useEffect } from "react";
import { Send, Square, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { FLOW_TEMPLATES } from "@/lib/flow-templates";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MentorChatProps {
  messages: Message[];
  isGenerating: boolean;
  streamingContent: string;
  onSend: (message: string) => void;
  onStop: () => void;
}

export default function MentorChat({ messages, isGenerating, streamingContent, onSend, onStop }: MentorChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const stripFlowBlocks = (content: string) => {
    return content.replace(/```flow[\s\S]*?```/g, "").trim();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && !isGenerating && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 py-16">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
                  <span className="text-4xl">🧠</span>
                </div>
                <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl -z-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold gradient-text font-[Space_Grotesk]">Mentor de Riqueza</h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Escolha um plano pronto ou descreva seu objetivo e eu crio o melhor fluxo de ação.
                </p>
              </div>

              {/* Flow Templates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                {FLOW_TEMPLATES.map((template, i) => {
                  const Icon = template.icon;
                  return (
                    <motion.button
                      key={template.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      onClick={() => onSend(template.prompt)}
                      className="group text-left p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/80 hover:border-primary/30 transition-all duration-200 hover:shadow-[0_0_24px_-6px_hsl(var(--primary)/0.15)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center shrink-0`}>
                          <Icon className="h-4.5 w-4.5 text-foreground/80" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {template.title}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Custom prompt suggestions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground/60">Ou descreva seu próprio objetivo:</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {[
                    "Quero monetizar minha audiência",
                    "Preciso de uma estratégia de e-mail marketing",
                    "Quero criar um funil de vendas completo",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => onSend(suggestion)}
                      className="px-4 py-2 text-xs rounded-xl border border-border/40 bg-card/30 hover:bg-card hover:border-primary/20 text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx > messages.length - 3 ? 0.05 : 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/15 flex items-center justify-center shrink-0 mr-3 mt-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-lg shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.3)]"
                      : "bg-card/80 border border-border/50 text-card-foreground rounded-bl-lg"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose-premium text-sm">
                      <ReactMarkdown>{stripFlowBlocks(msg.content)}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isGenerating && streamingContent && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/15 flex items-center justify-center shrink-0 mr-3 mt-1">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-5 py-3.5 text-sm bg-card/80 border border-border/50 text-card-foreground rounded-bl-lg">
                <div className="prose-premium text-sm">
                  <ReactMarkdown>{stripFlowBlocks(streamingContent)}</ReactMarkdown>
                </div>
                <span className="inline-block w-1.5 h-5 bg-primary rounded-full animate-pulse ml-0.5 -mb-1" />
              </div>
            </motion.div>
          )}

          {isGenerating && !streamingContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/15 flex items-center justify-center shrink-0 mr-3 mt-1">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl px-5 py-4 bg-card/80 border border-border/50 rounded-bl-lg">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end premium-card p-2 !shadow-none">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva seu objetivo..."
              className="min-h-[44px] max-h-[120px] resize-none text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              rows={1}
            />
            {isGenerating ? (
              <Button variant="destructive" size="icon" onClick={onStop} className="shrink-0 h-10 w-10 rounded-xl">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="shrink-0 h-10 w-10 rounded-xl premium-button"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
