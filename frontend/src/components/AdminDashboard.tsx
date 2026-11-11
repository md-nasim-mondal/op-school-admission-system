import React from 'react';
import { Plus, Users, Shield, CheckCircle, Clock } from 'lucide-react';
import { ClassDetails } from '../types';

interface AdminDashboardProps {
  classes: ClassDetails[];
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  classes,
  onOpenCreateModal,
  onRefresh,
  isRefreshing,
}) => {
  const totalCapacity = classes.reduce((sum, c) => sum + c.totalSeats, 0);
  const totalHeld = classes.reduce((sum, c) => sum + c.heldSeats, 0);
  const totalConfirmed = classes.reduce((sum, c) => sum + c.confirmedSeats, 0);
  const totalAvailable = classes.reduce((sum, c) => sum + c.availableSeats, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Admin Portal</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            School Admission Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create classes, set capacities, and monitor seat status in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Class
          </button>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Total Capacity</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{totalCapacity}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">{classes.length} classes total</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-amber-700">Active Holds</span>
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-3">{totalHeld}</p>
          <span className="text-xs text-amber-600 mt-0.5 block">Occupied under hold</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-emerald-700">Confirmed Admissions</span>
          </div>
          <p className="text-2xl font-bold text-emerald-800 mt-3">{totalConfirmed}</p>
          <span className="text-xs text-emerald-600 mt-0.5 block">Paid & confirmed seats</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-blue-700">Available Seats</span>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-3">{totalAvailable}</p>
          <span className="text-xs text-blue-600 mt-0.5 block">Open for applications</span>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">All Configured Classes</h3>
          <span className="text-xs text-slate-500 font-medium">
            Live updates via polling
          </span>
        </div>

        {classes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No classes created yet. Click "Create Class" above to add your first class.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3.5">Class / Shift Name</th>
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5 text-center">Total Seats</th>
                  <th className="px-6 py-3.5 text-center">Held</th>
                  <th className="px-6 py-3.5 text-center">Confirmed</th>
                  <th className="px-6 py-3.5 text-center">Available</th>
                  <th className="px-6 py-3.5 text-right">Occupancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {classes.map((c) => {
                  const percent = c.totalSeats > 0 
                    ? Math.round(((c.heldSeats + c.confirmedSeats) / c.totalSeats) * 100)
                    : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {c.id}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-800">
                        {c.totalSeats}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-amber-700">
                        {c.heldSeats}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-emerald-700">
                        {c.confirmedSeats}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.availableSeats <= 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {c.availableSeats}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-bold text-slate-700">{percent}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
