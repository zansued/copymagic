import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function generateSessionToken(): string {
  return crypto.randomUUID();
}

const SESSION_TOKEN_KEY = "cm_session_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const validationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Register session token in DB and localStorage
  const registerSession = useCallback(async (userId: string) => {
    const token = generateSessionToken();
    localStorage.setItem(SESSION_TOKEN_KEY, token);

    await supabase
      .from("subscriptions")
      .update({ active_session_token: token } as any)
      .eq("user_id", userId);
  }, []);

  // Validate that local token matches DB token
  const validateSession = useCallback(async (userId: string) => {
    const localToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!localToken) return;

    const { data } = await supabase
      .from("subscriptions")
      .select("active_session_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (data && (data as any).active_session_token && (data as any).active_session_token !== localToken) {
      // Another session took over
      toast.error("Sua sessão foi encerrada pois outro login foi detectado.");
      localStorage.removeItem(SESSION_TOKEN_KEY);
      await supabase.auth.signOut();
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === "SIGNED_IN" && session?.user) {
          // Small delay to ensure subscription row exists
          setTimeout(() => registerSession(session.user.id), 500);
        }

        if (event === "SIGNED_OUT") {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          if (validationInterval.current) {
            clearInterval(validationInterval.current);
            validationInterval.current = null;
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [registerSession]);

  // Periodic validation every 30 seconds
  useEffect(() => {
    if (validationInterval.current) {
      clearInterval(validationInterval.current);
      validationInterval.current = null;
    }

    if (user) {
      validationInterval.current = setInterval(() => {
        validateSession(user.id);
      }, 30000);
    }

    return () => {
      if (validationInterval.current) {
        clearInterval(validationInterval.current);
      }
    };
  }, [user, validateSession]);

  const signOut = async () => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
