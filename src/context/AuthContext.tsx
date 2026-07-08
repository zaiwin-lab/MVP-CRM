import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface AuthState {
  /** Signed-in user's email, or null. In demo mode this is a fixed label. */
  email: string | null;
  ready: boolean;
  /** Whether a real login is required (shared mode) or bypassed (demo mode). */
  requiresAuth: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setEmail("You (demo mode)");
      setReady(true);
      return;
    }
    supabase!.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase!.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithPassword = async (e: string, p: string) => {
    const { error } = await supabase!.auth.signInWithPassword({
      email: e,
      password: p,
    });
    if (error) throw error;
  };

  const signUp = async (e: string, p: string) => {
    const { error } = await supabase!.auth.signUp({ email: e, password: p });
    if (error) throw error;
  };

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase!.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        email,
        ready,
        requiresAuth: isSupabaseConfigured,
        signInWithPassword,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
