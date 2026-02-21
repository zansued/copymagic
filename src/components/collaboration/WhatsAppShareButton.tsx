import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useState } from "react";

interface WhatsAppShareButtonProps {
  generationId: string;
  agentName: string;
  /** If already have a public link, skip creation */
  existingToken?: string;
  size?: "sm" | "default";
  variant?: "outline" | "default" | "ghost";
  className?: string;
}

export function WhatsAppShareButton({
  generationId,
  agentName,
  existingToken,
  size = "sm",
  variant = "outline",
  className,
}: WhatsAppShareButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const buildWhatsAppUrl = (token: string) => {
    const link = `${window.location.origin}/shared/${token}`;
    const text = `🔥 Olha essa copy que o CopyEngine Pro gerou pra mim!\n\n📝 *${agentName}*\n\n👉 ${link}\n\nCria a sua também de graça!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handleShare = async () => {
    if (existingToken) {
      window.open(buildWhatsAppUrl(existingToken), "_blank");
      return;
    }

    if (!user) {
      toast.error("Faça login para compartilhar");
      return;
    }

    setLoading(true);
    try {
      // Check if public share already exists
      const { data: existing } = await supabase
        .from("generation_shares")
        .select("share_token")
        .eq("generation_id", generationId)
        .eq("owner_id", user.id)
        .eq("is_public", true)
        .maybeSingle();

      if (existing) {
        window.open(buildWhatsAppUrl(existing.share_token), "_blank");
        return;
      }

      // Create public share
      const { data, error } = await supabase
        .from("generation_shares")
        .insert({
          generation_id: generationId,
          owner_id: user.id,
          is_public: true,
        })
        .select("share_token")
        .single();

      if (error) throw error;
      window.open(buildWhatsAppUrl(data.share_token), "_blank");
    } catch {
      toast.error("Erro ao gerar link de compartilhamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      disabled={loading}
      className={`gap-1.5 text-xs ${className || ""}`}
    >
      <MessageCircle className="h-3.5 w-3.5" />
      WhatsApp
    </Button>
  );
}
