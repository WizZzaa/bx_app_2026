import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: ToastKind; text: string }

interface ToastApi {
  toast: (text: string, kind?: ToastKind) => void;
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // Безопасный фолбэк, если провайдер не смонтирован
    return { toast: () => { void 0 }, success: () => { void 0 }, error: () => { void 0 }, info: () => { void 0 } }
  }
  return ctx;
}

// Иконки в весе 500 — читаются и на тёмном (#141820), и на светлом (#fff) фоне
const STYLE: Record<ToastKind, { icon: string; border: string; accent: string }> = {
  success: { icon: '✓', border: 'border-emerald-500/40', accent: 'text-emerald-500' },
  error:   { icon: '✕', border: 'border-red-500/40', accent: 'text-red-500' },
  info:    { icon: 'ℹ', border: 'border-blue-500/40', accent: 'text-blue-500' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => setItems(p => p.filter(t => t.id !== id)), []);

  const push = useCallback((text: string, kind: ToastKind = 'info') => {
    const id = ++idRef.current;
    setItems(p => [...p, { id, kind, text }]);
    setTimeout(() => remove(id), kind === 'error' ? 5000 : 3000);
  }, [remove]);

  const api: ToastApi = {
    toast: push,
    success: (t) => push(t, 'success'),
    error:   (t) => push(t, 'error'),
    info:    (t) => push(t, 'info'),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {items.map(t => {
          const s = STYLE[t.kind];
          return (
            <div key={t.id}
              onClick={() => remove(t.id)}
              role="alert"
              aria-live="assertive"
              className={`bx-animate-toast pointer-events-auto cursor-pointer flex items-center gap-2.5 bg-bx-surface border ${s.border} rounded-xl px-4 py-2.5 shadow-2xl max-w-sm`}>
              <span className={`text-sm font-bold flex-shrink-0 ${s.accent}`}>{s.icon}</span>
              <span className="text-xs text-bx-text leading-snug">{t.text}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
