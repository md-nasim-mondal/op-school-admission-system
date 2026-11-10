import React from 'react';
import { School, User, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

interface NavbarProps {
  studentId: string;
  onStudentIdChange: (id: string) => void;
  activeTab: 'student' | 'admin';
  onTabChange: (tab: 'student' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  studentId,
  onStudentIdChange,
  activeTab,
  onTabChange,
}) => {
  const isValidBRN = /^\d{17}$/.test(studentId.trim());

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                School Admission System
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Onnorokom Projukti Limited
              </p>
            </div>
          </div>

          {/* Student Identity (17-digit Birth Registration Number) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-200 w-full sm:w-auto">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Student Birth Registration Number (17 Digits)
                </span>
                <input
                  type="text"
                  maxLength={17}
                  placeholder="e.g. 20152691234567890"
                  value={studentId}
                  onChange={(e) => onStudentIdChange(e.target.value.replace(/\D/g, ''))}
                  className="bg-transparent text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden w-48 sm:w-56"
                />
              </div>

              {studentId.length > 0 && (
                isValidBRN ? (
                  <span title="Valid 17-digit BRN" className="shrink-0 flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-mono flex items-center gap-1 shrink-0" title={`${studentId.length}/17 digits`}>
                    <AlertCircle className="w-4 h-4" />
                    {studentId.length}/17
                  </span>
                )
              )}
            </div>

            {/* Quick Demo Helper */}
            {!isValidBRN && (
              <button
                type="button"
                onClick={() => onStudentIdChange('20152691234567890')}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline shrink-0"
              >
                Use Demo ID
              </button>
            )}

            {/* Portal Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => onTabChange('student')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'student'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student Portal
              </button>
              <button
                type="button"
                onClick={() => onTabChange('admin')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
