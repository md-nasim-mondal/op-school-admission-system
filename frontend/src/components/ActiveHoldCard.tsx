import React, { useState } from "react";
import { CreditCard, Ban, AlertCircle, Sparkles } from "lucide-react";
import { StudentHold } from "../types";
import { Badge } from "./Badge";
import { CountdownTimer } from "./CountdownTimer";

interface ActiveHoldCardProps {
  hold: StudentHold;
  onConfirm: (holdId: string) => Promise<void>;
  onCancel: (holdId: string) => Promise<void>;
  onExpire: () => void;
}

export const ActiveHoldCard: React.FC<ActiveHoldCardProps> = ({
  hold,
  onConfirm,
  onCancel,
  onExpire,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isHeld = hold.status === "HELD";
  const isConfirmed = hold.status === "CONFIRMED";
  const isExpired = hold.status === "EXPIRED";
  const isCancelled = hold.status === "CANCELLED";

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      await onConfirm(hold.holdId);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this admission application?",
      )
    ) {
      return;
    }
    try {
      setIsCancelling(true);
      await onCancel(hold.holdId);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm transition-all ${
        isConfirmed
          ? "bg-linear-to-br from-emerald-50/50 to-teal-50/30 border-emerald-200"
          : isExpired
            ? "bg-linear-to-br from-rose-50/50 to-orange-50/30 border-rose-200"
            : isCancelled
              ? "bg-slate-50 border-slate-200"
              : "bg-white border-blue-200 ring-2 ring-blue-500/10"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Current Application
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            {hold.className || `Class ID: ${hold.classId}`}
          </h3>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Hold ID: {hold.holdId}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge status={hold.status} />
          {isHeld && (
            <CountdownTimer expiresAt={hold.expiresAt} onExpire={onExpire} />
          )}
        </div>
      </div>

      {/* Body content based on status */}
      <div className="py-4">
        {isConfirmed && (
          <div className="flex items-start gap-3 bg-emerald-100/60 p-4 rounded-xl border border-emerald-200 text-emerald-900">
            <Sparkles className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">
                Admission Confirmed Successfully!
              </h4>
              <p className="text-xs text-emerald-800 mt-1">
                Your admission seat in <strong>{hold.className}</strong> has
                been secured and confirmed.
              </p>
            </div>
          </div>
        )}

        {isHeld && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              A seat in <strong>{hold.className}</strong> is currently on hold
              for you. Please pay the admission fee before the timer expires to
              confirm your admission.
            </p>
            <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Simulated Payment Flow: Clicking{" "}
                <strong>Pay Admission Fee</strong> will instantly confirm your
                seat without real transactions.
              </span>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="flex items-start gap-3 bg-rose-50 p-4 rounded-xl border border-rose-200 text-rose-900">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Hold Period Has Expired</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                The hold duration ended before payment was confirmed. The seat
                has been released for other students. You can apply again for
                any class with available seats.
              </p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="text-sm text-slate-500 italic">
            This admission application was cancelled and the seat was released.
          </div>
        )}
      </div>

      {/* Action buttons (only active when HELD) */}
      {isHeld && (
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isCancelling || isConfirming}
            onClick={handleCancel}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors"
          >
            <Ban className="w-4 h-4" />
            {isCancelling ? "Cancelling..." : "Cancel Application"}
          </button>

          <button
            type="button"
            disabled={isConfirming || isCancelling}
            onClick={handleConfirm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            {isConfirming
              ? "Processing Payment..."
              : "Pay Admission Fee (Confirm)"}
          </button>
        </div>
      )}
    </div>
  );
};
