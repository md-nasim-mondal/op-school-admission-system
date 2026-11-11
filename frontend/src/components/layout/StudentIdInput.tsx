import { User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStudent } from '../../context/StudentContext';

export const StudentIdInput: React.FC = () => {
  const { studentId, setStudentId, isValidBRN } = useStudent();

  return (
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
            onChange={(e) => setStudentId(e.target.value)}
            className="bg-transparent text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden w-48 sm:w-56"
          />
        </div>

        {studentId.length > 0 && (
          isValidBRN ? (
            <span title="Valid 17-digit BRN" className="shrink-0 flex items-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </span>
          ) : (
            <span 
              className="text-xs text-amber-600 font-mono flex items-center gap-1 shrink-0" 
              title={`${studentId.length}/17 digits`}
            >
              <AlertCircle className="w-4 h-4" />
              {studentId.length}/17
            </span>
          )
        )}
      </div>

      {!isValidBRN && (
        <button
          type="button"
          onClick={() => setStudentId('20152691234567890')}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline shrink-0 font-medium"
        >
          Use Demo ID
        </button>
      )}
    </div>
  );
};
