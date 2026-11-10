import React from 'react';
import { History } from 'lucide-react';
import { StudentHold } from '../types';
import { Badge } from './Badge';

interface ApplicationHistoryProps {
  holds: StudentHold[];
  onSelectHold?: (hold: StudentHold) => void;
}

export const ApplicationHistory: React.FC<ApplicationHistoryProps> = ({
  holds,
  onSelectHold,
}) => {
  if (holds.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">No Application History</h4>
        <p className="text-xs text-slate-500 mt-0.5">
          You haven't submitted any admission applications with this Student ID yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-sm text-slate-900">My Applications History</h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Total: {holds.length} application{holds.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-slate-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Class & Shift</th>
              <th className="px-5 py-3">Hold ID</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Expiry / Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {holds.map((hold) => (
              <tr 
                key={hold.holdId}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => onSelectHold && onSelectHold(hold)}
              >
                <td className="px-5 py-3.5 font-medium text-slate-900">
                  {hold.className || hold.classId}
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                  {hold.holdId}
                </td>
                <td className="px-5 py-3.5">
                  <Badge status={hold.status} />
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500">
                  {new Date(hold.expiresAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
