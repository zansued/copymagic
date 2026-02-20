import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, ShieldCheck, Pencil, Eye, Trash2, Camera, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/hooks/use-team";
import type { Profile } from "@/hooks/use-profiles";

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string; gradient: string }> = {
  owner: { label: "Owner", icon: Crown, color: "text-amber-400 border-amber-500/30", gradient: "from-amber-500 to-yellow-400" },
  admin: { label: "Admin", icon: ShieldCheck, color: "text-primary border-primary/30", gradient: "from-primary to-violet-400" },
  editor: { label: "Editor", icon: Pencil, color: "text-blue-400 border-blue-500/30", gradient: "from-blue-500 to-cyan-400" },
  viewer: { label: "Viewer", icon: Eye, color: "text-muted-foreground border-border", gradient: "from-muted-foreground to-muted" },
};

interface MemberCardProps {
  member: TeamMember;
  profile?: Profile;
  isMe: boolean;
  isOwnerOrAdmin: boolean;
  onUpdateRole: (memberId: string, role: string) => void;
  onRemove: (memberId: string) => void;
  onUpdateProfile: (displayName: string, avatarUrl?: string | null) => Promise<boolean>;
  onUploadAvatar: (file: File) => Promise<string | null>;
}

export function MemberCard({
  member,
  profile,
  isMe,
  isOwnerOrAdmin,
  onUpdateRole,
  onRemove,
  onUpdateProfile,
  onUploadAvatar,
}: MemberCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const role = roleConfig[member.role] || roleConfig.viewer;
  const Icon = role.icon;
  const displayName = profile?.display_name || member.user_id.slice(0, 8) + "...";
  const avatarUrl = profile?.avatar_url;

  const handleSave = async () => {
    setSaving(true);
    await onUpdateProfile(name.trim() || displayName);
    setSaving(false);
    setEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await onUploadAvatar(file);
    if (url) {
      await onUpdateProfile(profile?.display_name || "", url);
    }
    setUploading(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-3 px-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-border transition-colors group"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className={cn(
                "h-10 w-10 rounded-full object-cover border-2 transition-transform duration-300",
                `border-${member.role === "owner" ? "amber-500/50" : "border"}`,
                "group-hover:scale-105"
              )}
            />
          ) : (
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white",
                "bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-105",
                role.gradient
              )}
            >
              {(profile?.display_name || member.user_id).charAt(0).toUpperCase()}
            </div>
          )}

          {/* Upload overlay for own profile */}
          {isMe && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </>
          )}
        </div>

        {/* Info */}
        <div className="space-y-0.5">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-7 text-sm w-32"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-400" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(false)}>
                <X className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-foreground font-medium">{displayName}</p>
              {isMe && (
                <button
                  onClick={() => {
                    setName(profile?.display_name || "");
                    setEditing(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Icon className={cn("h-3 w-3", role.color)} />
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", role.color)}>
              {role.label}
            </Badge>
            {isMe && (
              <span className="text-[10px] text-primary/60 font-medium">Você</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {isOwnerOrAdmin && member.role !== "owner" && !isMe && (
        <div className="flex items-center gap-1">
          <Select
            defaultValue={member.role}
            onValueChange={(val) => onUpdateRole(member.id, val)}
          >
            <SelectTrigger className="h-7 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(member.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
