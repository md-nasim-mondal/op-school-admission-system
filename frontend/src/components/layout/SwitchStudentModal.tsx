import React from 'react';
import { ArrowLeftRight, AlertTriangle, X } from 'lucide-react';

interface SwitchStudentModalProps {
  isOpen: boolean;
  studentId: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const SwitchStudentModal: React.FC<SwitchStudentModalProps> = ({
  isOpen,
  studentId,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="switch-student-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <h3 id="switch-student-title" className="font-bold text-base">
              Switch Student Applicant
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Database Records Are Safe</span>
              <span>
                Switching only clears this browser's cached view. Any active holds or confirmed admissions for this student remain safely stored on the server.
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-sm">
            <span className="text-xs text-slate-500 block">Current Student Birth Registration No:</span>
            <span className="font-mono font-bold text-slate-900 text-base">{studentId}</span>
          </div>

          <p className="text-xs text-slate-500">
            After switching, you will return to the Student Identification screen where a different student can enter their 17-digit Birth Registration Number.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Switch Student
          </button>
        </div>
      </div>
    </div>
  );
};
