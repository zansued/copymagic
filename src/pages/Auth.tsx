import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AnimatedInput } from "@/components/auth/AnimatedInput";
import { BoxReveal } from "@/components/auth/BoxReveal";
import { OrbitingCircles } from "@/components/auth/OrbitingCircles";
import { Eye, EyeOff, Zap, Target, PenTool, BarChart3, Sparkles, Megaphone } from "lucide-react";
import { motion } from "motion/react";

const BottomGradient = () => (
  <>
    <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-primary to-transparent" />
    <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-accent-foreground to-transparent" />
  </>
);

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

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

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
    <div className="min-h-screen bg-background flex">
      {/* Left side — Orbit display (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden surface-gradient">
        {/* Background grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="authGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#authGrid)" />
        </svg>

        {/* Ambient glow */}
        <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)" }} />

        {/* Orbiting icons */}
        <div className="relative flex h-[500px] w-[500px] items-center justify-center">
          <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-center text-6xl font-bold leading-none text-transparent font-['Space_Grotesk']">
            Copy<br />Engine
          </span>

          <OrbitingCircles className="size-10 border-none bg-transparent" duration={20} delay={0} radius={120}>
            <Zap className="size-5 text-primary" />
          </OrbitingCircles>
          <OrbitingCircles className="size-10 border-none bg-transparent" duration={20} delay={5} radius={120}>
            <Target className="size-5 text-accent-foreground" />
          </OrbitingCircles>
          <OrbitingCircles className="size-10 border-none bg-transparent" duration={20} delay={10} radius={120}>
            <PenTool className="size-5 text-primary" />
          </OrbitingCircles>
          <OrbitingCircles className="size-10 border-none bg-transparent" duration={20} delay={15} radius={120}>
            <Sparkles className="size-5 text-accent-foreground" />
          </OrbitingCircles>

          <OrbitingCircles className="size-12 border-none bg-transparent" duration={30} delay={0} radius={200} reverse>
            <BarChart3 className="size-6 text-muted-foreground" />
          </OrbitingCircles>
          <OrbitingCircles className="size-12 border-none bg-transparent" duration={30} delay={10} radius={200} reverse>
            <Megaphone className="size-6 text-muted-foreground" />
          </OrbitingCircles>
          <OrbitingCircles className="size-12 border-none bg-transparent" duration={30} delay={20} radius={200} reverse>
            <Zap className="size-6 text-muted-foreground" />
          </OrbitingCircles>
        </div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute bottom-12 text-sm text-muted-foreground tracking-wider uppercase"
        >
          Copywriting movido a IA
        </motion.p>
      </div>

      {/* Right side — Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16">
        <div className="w-full max-w-md flex flex-col gap-5">
          {/* Header */}
          <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🎯</span>
              <h1 className="font-bold text-3xl text-foreground font-['Space_Grotesk']">
                {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
              </h1>
            </div>
          </BoxReveal>

          <BoxReveal boxColor="hsl(var(--primary))" duration={0.3} className="pb-2">
            <p className="text-muted-foreground text-sm">
              {isLogin
                ? "Entre para continuar criando copies de alta conversão."
                : "Comece a criar copies persuasivas em minutos."}
            </p>
          </BoxReveal>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
                <label className="text-sm font-medium text-foreground">
                  Email <span className="text-destructive">*</span>
                </label>
              </BoxReveal>
              <BoxReveal width="100%" boxColor="hsl(var(--primary))" duration={0.3}>
                <AnimatedInput
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </BoxReveal>
            </div>

            <div className="flex flex-col gap-2">
              <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
                <label className="text-sm font-medium text-foreground">
                  Senha <span className="text-destructive">*</span>
                </label>
              </BoxReveal>
              <BoxReveal width="100%" boxColor="hsl(var(--primary))" duration={0.3}>
                <div className="relative">
                  <AnimatedInput
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </BoxReveal>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive bg-destructive/10 p-3 rounded-md"
              >
                {error}
              </motion.p>
            )}

            {message && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-primary bg-primary/10 p-3 rounded-md"
              >
                {message}
              </motion.p>
            )}

            <BoxReveal width="100%" boxColor="hsl(var(--primary))" duration={0.3}>
              <button
                className="relative group/btn w-full h-11 rounded-md font-semibold text-sm
                  premium-button text-primary-foreground
                  disabled:opacity-50 disabled:cursor-not-allowed
                  outline-none cursor-pointer"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Aguarde..." : isLogin ? "Entrar →" : "Cadastrar →"}
                <BottomGradient />
              </button>
            </BoxReveal>
          </form>

          {/* Toggle */}
          <BoxReveal boxColor="hsl(var(--primary))" duration={0.3}>
            <div className="text-center mt-2">
              <button
                onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
              </button>
            </div>
          </BoxReveal>
        </div>
      </div>
    </div>
  );
}
