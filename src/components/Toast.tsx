"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastKind, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-slate-200 bg-white text-slate-900",
};

const icons: Record<ToastKind, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setItems((current) => [...current, { id, kind, message }]);
      window.setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message: string) => toast("success", message),
      error: (message: string) => toast("error", message),
      info: (message: string) => toast("info", message),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`fade-up pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${styles[item.kind]}`}
            role="status"
          >
            <span aria-hidden="true" className="mt-0.5">
              {icons[item.kind]}
            </span>
            <p className="flex-1 leading-6">{item.message}</p>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="opacity-50 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}
