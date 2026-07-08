import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckIcon, CloseIcon } from "../components/icons";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  success: (message: string, action?: Toast["action"]) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const KIND_STYLES: Record<ToastKind, string> = {
  success: "border-emerald-200 bg-white",
  error: "border-red-200 bg-white",
  info: "border-slate-200 bg-white",
};

const DOT: Record<ToastKind, string> = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  info: "bg-brand-500",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string, action?: Toast["action"]) => {
      const id = nextId.current++;
      setToasts((t) => [...t, { id, kind, message, action }]);
      // Give people longer to hit Undo.
      timers.current[id] = setTimeout(() => dismiss(id), action ? 6000 : 3500);
    },
    [dismiss]
  );

  const api: ToastApi = {
    success: (m, a) => push("success", m, a),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-5 sm:items-end sm:pr-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-pop ${KIND_STYLES[t.kind]}`}
            role="status"
          >
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${DOT[t.kind]}`} />
            <span className="min-w-0 flex-1 text-sm text-slate-700">
              {t.message}
            </span>
            {t.action && (
              <button
                className="flex-shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700"
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
            <button
              className="flex-shrink-0 text-slate-400 hover:text-slate-600"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              {t.kind === "success" && !t.action ? (
                <CheckIcon size={16} />
              ) : (
                <CloseIcon size={16} />
              )}
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
