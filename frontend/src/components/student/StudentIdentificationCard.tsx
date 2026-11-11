import React from 'react';
import { User, Sparkles, ShieldCheck, ArrowUpRight } from 'lucide-react';

export const StudentIdentificationCard: React.FC = () => {
  const handleFocusTopInput = () => {
    document.getElementById('top-brn-input')?.focus();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
      <div className="max-w-3xl">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>First-Come, First-Served Admission System</span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to the School Admission Portal
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          In accordance with the admission guidelines, admission is conducted on a strict <strong>First-Come, First-Served</strong> basis.
          To apply for an open seat or review your existing application status, enter the student&apos;s <strong>17-digit Birth Registration Number (BRN)</strong> in the input box at the top of the page.
        </p>

        {/* Action Prompt */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={handleFocusTopInput}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Enter 17-Digit Student BRN Above</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 self-center">
            (Or click the input field in the header)
          </span>
        </div>

        {/* Explanatory Rule Cards */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block mb-0.5">No Password Required:</strong>
              Students are identified strictly via their 17-digit Birth Registration Number (BRN).
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block mb-0.5">10-Minute Hold Duration:</strong>
              When applying, a seat is temporarily held for 10 minutes (600s) to allow simulated fee payment.
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <User className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block mb-0.5">Single Active Application:</strong>
              A student may hold only one active application across all classes simultaneously.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
