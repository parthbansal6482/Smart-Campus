import React from 'react';
import { create } from 'zustand';
import { Check, AlertCircle, X } from 'lucide-react';

type ToastKind = 'success' | 'error';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastState>(set => ({
  toasts: [],
  push: (kind, message) => {
    const id = nextId++;
    set(state => ({ toasts: [...state.toasts, { id, kind, message }] }));
    setTimeout(() => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })), 3500);
  },
  dismiss: id => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
};

export const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-3rem)]" aria-live="polite">
      {toasts.map(t => (
        <div
          key={t.id}
          role="status"
          className="flex items-start gap-3 bg-ink text-white rounded-xl px-4 py-3 shadow-pop animate-enter"
        >
          {t.kind === 'success' ? (
            <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#9FD3B8]" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#F2A59C]" />
          )}
          <p className="text-[13px] leading-5 flex-1">{t.message}</p>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
