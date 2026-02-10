import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AnimatedInput } from "@/components/auth/AnimatedInput";
import { BoxReveal } from "@/components/auth/BoxReveal";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, Zap, Target } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import loginBgVideo from "@/assets/login-bg.mp4";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMessage("Verifique seu email para confirmar o cadastro.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-background/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/60 z-10" />
        <video
          ref={videoRef}
          className="absolute inset-0 min-w-full min-h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={loginBgVideo} type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        
        {/* Left — Marketing Copy */}
        <div className="flex-1 text-center lg:text-left max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-2 justify-center lg:justify-start mb-4">
              <span className="text-sm font-medium text-primary uppercase tracking-[0.2em]">CopyEngine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight font-['Space_Grotesk'] text-foreground mb-6">
              Copies que{" "}
              <span className="gradient-text">convertem</span>
              <br />
              em minutos,
              <br />
              não em dias.
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
              Transforme a descrição do seu produto em uma{" "}
              <span className="text-foreground font-medium">máquina de vendas completa</span>
              : páginas de vendas, upsells, anúncios e VSLs — tudo gerado por IA especializada em copywriting direto.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {[
                { icon: <Sparkles className="size-4" />, text: "9 etapas de copy" },
                { icon: <Zap className="size-4" />, text: "IA especializada" },
                { icon: <Target className="size-4" />, text: "Alta conversão" },
              ].map((pill, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/30 backdrop-blur-sm text-sm text-muted-foreground"
                >
                  <span className="text-primary">{pill.icon}</span>
                  {pill.text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right — Glassmorphism Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="p-8 rounded-2xl backdrop-blur-xl bg-card/40 border border-border/30 shadow-2xl shadow-primary/5">
            {/* Form Header */}
            <div className="mb-6">
              <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
                <h2 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">
                  {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
                </h2>
              </BoxReveal>
              <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLogin
                    ? "Entre para continuar criando copies de alta conversão."
                    : "Comece a criar copies persuasivas em minutos."}
                </p>
              </BoxReveal>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <BoxReveal width="100%" boxColor="hsl(var(--primary))" duration={0.3}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10 pointer-events-none" />
                  <AnimatedInput
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </BoxReveal>

              {/* Password */}
              <BoxReveal width="100%" boxColor="hsl(var(--primary))" duration={0.3}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10 pointer-events-none" />
                  <AnimatedInput
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                  >
                    {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                </div>
              </BoxReveal>

              {/* Error / Success Messages */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                  >
                    {error}
                  </motion.p>
                )}
                {message && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-primary bg-primary/10 p-3 rounded-lg border border-primary/20"
                  >
                    {message}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <BoxReveal width="100%" boxColor="hsl(var(--primary))" duration={0.3}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="relative group/btn w-full py-3 rounded-lg premium-button text-primary-foreground font-semibold text-sm
                    disabled:opacity-50 disabled:cursor-not-allowed
                    outline-none cursor-pointer
                    transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="flex items-center justify-center gap-2">
                    {submitting ? "Aguarde..." : isLogin ? "Entrar" : "Cadastrar"}
                    {!submitting && <ArrowRight className="size-4" />}
                  </span>
                  {/* Bottom glow */}
                  <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-accent-foreground to-transparent" />
                </button>
              </BoxReveal>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-border/30 absolute w-full" />
              <span className="bg-transparent px-3 relative text-xs text-muted-foreground">
                {isLogin ? "ou" : "já tem conta?"}
              </span>
            </div>

            {/* Toggle */}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }}
              className="w-full py-2.5 rounded-lg border border-border/30 bg-card/20 backdrop-blur-sm
                text-sm text-muted-foreground hover:text-foreground hover:border-border/60
                transition-all duration-200 cursor-pointer"
            >
              {isLogin ? "Criar uma conta gratuita" : "Já tenho conta — Entrar"}
            </button>

            {/* Trust signal */}
            <p className="mt-6 text-center text-[11px] text-muted-foreground/60">
              🔒 Seus dados estão protegidos com criptografia de ponta a ponta.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
