'use client';

import { CheckCircle2, XCircle, X } from 'lucide-react';

export interface ToastItem {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface Props {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex min-w-[280px] max-w-sm items-center gap-3 rounded-xl px-4 py-3 shadow-lg ring-1 ${
            t.type === 'success'
              ? 'bg-emerald-50 ring-emerald-200 text-emerald-800'
              : 'bg-rose-50 ring-rose-200 text-rose-800'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
          )}
          <p className="flex-1 text-sm font-medium">{t.message}</p>
          <button
            onClick={() => onDismiss(t.id)}
            className="flex h-5 w-5 items-center justify-center rounded opacity-50 transition hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
