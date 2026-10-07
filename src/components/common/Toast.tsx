import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useApp();

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-70 flex items-center gap-3 px-4 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl shadow-2xl border border-zinc-700/80 dark:border-zinc-300 max-w-md animate-in slide-in-from-bottom-3 duration-200">
      <div className="shrink-0">
        {toast.type === 'warn' ? (
          <AlertCircle className="w-4 h-4 text-amber-400 dark:text-amber-600" />
        ) : toast.type === 'info' ? (
          <Info className="w-4 h-4 text-sky-400 dark:text-sky-600" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
        )}
      </div>

      <div className="text-xs font-medium flex-1">
        {toast.message}
      </div>

      {toast.undoAction && (
        <button
          onClick={() => {
            toast.undoAction?.();
            hideToast();
          }}
          className="text-xs font-bold text-amber-400 dark:text-amber-700 hover:underline px-1.5 py-0.5 rounded cursor-pointer shrink-0 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{toast.undoLabel || 'Annuler'}</span>
        </button>
      )}

      <button
        onClick={hideToast}
        className="text-zinc-400 dark:text-zinc-600 hover:text-white dark:hover:text-black p-0.5 rounded transition cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
