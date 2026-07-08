import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Field, TextInput } from "../components/ui";

export default function Login() {
  const { signInWithPassword, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "in") {
        await signInWithPassword(email, password);
      } else {
        await signUp(email, password);
        setInfo("Account created. If email confirmation is on, check your inbox.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            K
          </div>
          <h1 className="mt-3 text-xl font-semibold text-slate-900">
            KOBIS Connect
          </h1>
          <p className="text-sm text-slate-500">
            {mode === "in" ? "Sign in to your team workspace" : "Create your account"}
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          <Field label="Work email">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@office.com"
              required
              autoFocus
            />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </Field>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-100">
              {info}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </button>

          <p className="text-center text-sm text-slate-500">
            {mode === "in" ? "No account yet? " : "Already have one? "}
            <button
              type="button"
              className="font-medium text-brand-600 hover:text-brand-700"
              onClick={() => {
                setMode(mode === "in" ? "up" : "in");
                setError(null);
                setInfo(null);
              }}
            >
              {mode === "in" ? "Create one" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
