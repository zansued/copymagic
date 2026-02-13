import { useState, useRef, useEffect } from "react";
import { Send, Square, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
            <span className="text-6xl">🧠</span>
            <h3 className="text-lg font-semibold text-foreground">Mentor de Riqueza</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Me conte seu objetivo de negócio e eu vou criar o melhor plano de ação usando nossos agentes de IA especializados.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {[
                "Quero lançar meu primeiro produto digital",
                "Preciso escalar meus anúncios",
                "Quero criar conteúdo que converte",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSend(suggestion)}
                  className="px-3 py-2 text-xs rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{stripFlowBlocks(msg.content)}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isGenerating && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-secondary text-secondary-foreground rounded-bl-md">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{stripFlowBlocks(streamingContent)}</ReactMarkdown>
              </div>
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            </div>
          </div>
        )}

        {isGenerating && !streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-secondary text-secondary-foreground rounded-bl-md">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva seu objetivo..."
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          {isGenerating ? (
            <Button variant="destructive" size="icon" onClick={onStop} className="shrink-0">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="shrink-0 bg-gradient-to-r from-primary to-accent-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
