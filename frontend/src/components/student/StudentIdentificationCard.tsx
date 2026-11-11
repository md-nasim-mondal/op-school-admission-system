import React, { useState } from 'react';
import { User, CheckCircle2, AlertCircle, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useStudent, DEMO_STUDENT_A, DEMO_STUDENT_B } from '../../context/StudentContext';
import { useToast } from '../../context/ToastContext';

export const StudentIdentificationCard: React.FC = () => {
  const { studentId, identifyStudent } = useStudent();
  const { addToast } = useToast();
  const [inputVal, setInputVal] = useState(studentId);

  const cleanDigits = inputVal.replace(/\D/g, '').slice(0, 17);
  const isValid = /^\d{17}$/.test(cleanDigits);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/\D/g, '').slice(0, 17);
    setInputVal(sanitized);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    identifyStudent(cleanDigits);
    addToast(
      'success',
      `Identified as student BRN: ${cleanDigits}. You can now apply for open seats.`,
      'Student Identity Set'
    );
  };

  const handleUsePreset = (presetId: string, label: string) => {
    setInputVal(presetId);
    identifyStudent(presetId);
    addToast(
      'success',
      `Identified as ${label} (${presetId})`,
      'Preset Applied'
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
      <div className="max-w-2xl">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>First-Come, First-Served Admission System</span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to the Student Admission Portal
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          To apply for admission, reserve a temporary seat hold, or view your current application status,
          please provide the student&apos;s <strong>17-digit Birth Registration Number (BRN)</strong>.
        </p>

        {/* Identity Form */}
        <form onSubmit={handleContinue} className="mt-6 space-y-4">
          <div>
            <label htmlFor="brn-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Student Birth Registration Number (17 Digits)
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                id="brn-input"
                type="text"
                inputMode="numeric"
                maxLength={17}
                placeholder="e.g. 20152691234567890"
                value={inputVal}
                onChange={handleInputChange}
                className="w-full pl-11 pr-24 py-3 rounded-2xl border border-slate-300 text-slate-900 font-mono text-base font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                autoComplete="off"
              />
              <div className="absolute right-3.5 flex items-center gap-2">
                {cleanDigits.length > 0 && (
                  isValid ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {cleanDigits.length}/17
                    </span>
                  )
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Must be exactly 17 digits. Leading zeros are strictly preserved.
            </p>
          </div>

          {/* Quick Demo Presets */}
          <div className="pt-2">
            <span className="text-xs font-medium text-slate-500 block mb-2">
              Quick Test Presets (For Demonstration & Review):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleUsePreset(DEMO_STUDENT_A, 'Student A')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Use Demo Student A ({DEMO_STUDENT_A.slice(0, 7)}...)
              </button>
              <button
                type="button"
                onClick={() => handleUsePreset(DEMO_STUDENT_B, 'Student B')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Use Demo Student B ({DEMO_STUDENT_B.slice(0, 7)}...)
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={!isValid}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all shadow-xs ${
                isValid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-md'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              Continue to Student Portal
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Informational Guidelines Banner */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block">No Password Required:</strong>
              As per assignment guidelines, admission applications are identified strictly via the 17-digit BRN.
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block">Seat Reservation:</strong>
              When applying, seats are held for 10 minutes (600s) to allow fee payment before automatic release.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
