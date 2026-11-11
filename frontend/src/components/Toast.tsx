import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning";
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-3 inset-x-2.5 sm:inset-x-auto sm:bottom-4 sm:right-4 z-50 flex flex-col gap-2 sm:max-w-md sm:w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";
        const isWarning = toast.type === "warning";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border shadow-lg backdrop-blur-xs transition-all animate-in slide-in-from-bottom-5 ${
              isSuccess
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
                : isError
                  ? "bg-rose-50/95 border-rose-200 text-rose-900"
                  : "bg-amber-50/95 border-amber-200 text-amber-900"
            }`}
          >
            {isSuccess && (
              <CheckCircle2
                className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
            )}
            {isError && (
              <XCircle
                className="w-5 h-5 text-rose-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
            )}
            {isWarning && (
              <AlertTriangle
                className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
            )}

            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-xs sm:text-sm font-semibold">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs sm:text-sm mt-0.5 wrap-break-word">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
