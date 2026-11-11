import React, { useState } from 'react';
import { User, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { useStudent, DEMO_STUDENT_A } from '../../context/StudentContext';
import { useToast } from '../../context/ToastContext';
import { SwitchStudentModal } from './SwitchStudentModal';

export const StudentIdentityBadge: React.FC = () => {
  const { studentId, isIdentified, identifyStudent, clearStudent } = useStudent();
  const { addToast } = useToast();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  const handleConfirmSwitch = () => {
    clearStudent();
    setIsSwitchModalOpen(false);
    addToast(
      'warning',
      'Student identity cleared. You can now enter another 17-digit BRN to apply.',
      'Switched Student'
    );
  };

  if (!isIdentified) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          No Student Identified
        </span>
        <button
          type="button"
          onClick={() => identifyStudent(DEMO_STUDENT_A)}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer shrink-0"
        >
          Use Demo ID
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Compact Student Identity Chip */}
        <div 
          className="flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200 text-xs shadow-2xs"
          title={`Identified Student Birth Registration Number: ${studentId}`}
        >
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <User className="w-3 h-3" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Student BRN</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            </div>
            <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
              <span className="hidden sm:inline">{studentId}</span>
              <span className="sm:hidden">{studentId.slice(0, 6)}...{studentId.slice(-4)}</span>
            </span>
          </div>
        </div>

        {/* Switch Student Action Button */}
        <button
          type="button"
          onClick={() => setIsSwitchModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          title="Switch to a different student applicant"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Switch Student</span>
          <span className="sm:hidden">Switch</span>
        </button>
      </div>

      <SwitchStudentModal
        isOpen={isSwitchModalOpen}
        studentId={studentId}
        onClose={() => setIsSwitchModalOpen(false)}
        onConfirm={handleConfirmSwitch}
      />
    </>
  );
};

// Re-export as StudentIdInput for backwards compatibility
export const StudentIdInput = StudentIdentityBadge;
