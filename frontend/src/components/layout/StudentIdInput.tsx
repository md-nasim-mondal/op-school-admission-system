import React, { useState } from 'react';
import { User, CheckCircle2, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { useStudent } from '../../context/StudentContext';
import { useToast } from '../../context/ToastContext';
import { SwitchStudentModal } from './SwitchStudentModal';

export const StudentIdInput: React.FC = () => {
  const { studentId, setStudentId, isIdentified, clearStudent } = useStudent();
  const { addToast } = useToast();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  const handleConfirmSwitch = () => {
    clearStudent();
    setIsSwitchModalOpen(false);
    addToast(
      'warning',
      'Student identity cleared. You can now enter another 17-digit BRN in the input above.',
      'Switched Student'
    );
    // Focus the input box for convenient entry of next student
    setTimeout(() => {
      document.getElementById('top-brn-input')?.focus();
    }, 100);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
      {/* Required Top-of-Page 17-Digit Student BRN Input Box */}
      <div 
        className={`flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-xl border transition-all ${
          isIdentified 
            ? 'border-emerald-300 ring-2 ring-emerald-500/10' 
            : studentId.length > 0 
            ? 'border-amber-300' 
            : 'border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10'
        }`}
      >
        <User className={`w-4 h-4 shrink-0 ${isIdentified ? 'text-emerald-600' : 'text-slate-500'}`} />
        <div className="flex flex-col">
          <label htmlFor="top-brn-input" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer">
            Student Birth Registration Number (17 Digits)
          </label>
          <input
            id="top-brn-input"
            type="text"
            inputMode="numeric"
            maxLength={17}
            placeholder="e.g. 20152691234567890"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="bg-transparent text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden w-48 sm:w-56"
            autoComplete="off"
          />
        </div>

        {/* Real-time Validation Status */}
        {studentId.length > 0 && (
          isIdentified ? (
            <span title="Valid 17-digit BRN (Active)" className="shrink-0 flex items-center gap-1 text-emerald-600 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="hidden md:inline">Valid</span>
            </span>
          ) : (
            <span 
              className="text-xs text-amber-600 font-mono flex items-center gap-1 shrink-0" 
              title={`${studentId.length}/17 digits`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {studentId.length}/17
            </span>
          )
        )}
      </div>

      {/* Switch Student Action Button (Available when identified) */}
      {isIdentified && (
        <button
          type="button"
          onClick={() => setIsSwitchModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
          title="Switch to another student applicant"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
          <span>Switch Student</span>
        </button>
      )}

      {/* Switch Confirmation Modal */}
      <SwitchStudentModal
        isOpen={isSwitchModalOpen}
        studentId={studentId}
        onClose={() => setIsSwitchModalOpen(false)}
        onConfirm={handleConfirmSwitch}
      />
    </div>
  );
};
