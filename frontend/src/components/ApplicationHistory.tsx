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
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <History className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          <h3 id="app-history-heading" className="font-bold text-sm text-slate-900">
            My Applications History
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Total: {holds.length} application{holds.length > 1 ? 's' : ''}
        </span>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-labelledby="app-history-heading"
        className="responsive-table-wrapper"
      >
        <table className="responsive-table w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <th scope="col" className="px-4 sm:px-5 py-3">Class & Shift</th>
              <th scope="col" className="px-4 sm:px-5 py-3">Hold ID</th>
              <th scope="col" className="px-4 sm:px-5 py-3">Status</th>
              <th scope="col" className="px-4 sm:px-5 py-3">Expiry / Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {holds.map((hold: StudentHold) => (
              <tr
                key={hold.holdId}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => onSelectHold && onSelectHold(hold)}
              >
                <th scope="row" className="px-4 sm:px-5 py-3.5 font-semibold text-slate-900 text-sm">
                  {hold.className || hold.classId}
                </th>
                <td data-label="Hold ID" className="px-4 sm:px-5 py-3.5 font-mono text-xs text-slate-500 break-all">
                  {hold.holdId}
                </td>
                <td data-label="Status" className="px-4 sm:px-5 py-3.5">
                  <Badge status={hold.status} />
                </td>
                <td data-label="Expiry / Date" className="px-4 sm:px-5 py-3.5 text-xs text-slate-500">
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
