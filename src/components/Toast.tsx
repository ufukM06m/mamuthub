import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'warning' | 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 8000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'warning':
        return {
          bg: 'bg-amber-950/95 border-amber-500/80 text-amber-200 shadow-amber-950/50',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
        };
      case 'success':
        return {
          bg: 'bg-emerald-950/95 border-emerald-500/80 text-emerald-200 shadow-emerald-950/50',
          icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-950/95 border-rose-500/80 text-rose-200 shadow-rose-950/50',
          icon: <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
        };
      default:
        return {
          bg: 'bg-slate-900/95 border-slate-700 text-slate-200 shadow-slate-950/50',
          icon: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-300 ${style.bg}`}
    >
      {style.icon}
      <div className="flex-1 text-xs font-semibold leading-relaxed">{toast.message}</div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        title="Kapat"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
