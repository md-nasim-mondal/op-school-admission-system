import React, { useState, useMemo } from 'react';
import { Plus, Users, Shield, CheckCircle, Clock, Search, Info } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShift, setSelectedShift] = useState<'ALL' | 'MORNING' | 'DAY'>('ALL');

  const totalCapacity = classes.reduce((sum, c) => sum + c.totalSeats, 0);
  const totalHeld = classes.reduce((sum, c) => sum + c.heldSeats, 0);
  const totalConfirmed = classes.reduce((sum, c) => sum + c.confirmedSeats, 0);
  const totalAvailable = classes.reduce((sum, c) => sum + c.availableSeats, 0);

  // Filter classes based on search and shift selection
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesShift =
        selectedShift === 'ALL' ||
        (selectedShift === 'MORNING' && c.name.toLowerCase().includes('morning')) ||
        (selectedShift === 'DAY' && c.name.toLowerCase().includes('day'));

      return matchesSearch && matchesShift;
    });
  }, [classes, searchQuery, selectedShift]);

  return (
    <div className="space-y-6">
      {/* Demo Portal Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 text-indigo-900 text-xs">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-indigo-950 mb-0.5">
            Admin Demonstration Portal (No Login Required)
          </span>
          <span>
            As specified in the assignment, school administrators and parents interact directly through the UI without a conventional login system.
            Use this view to create new class shifts and monitor real-time seat allocations.
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">School Administration</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Admission & Capacity Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create classes, set seat capacities, and monitor seat status in real time.
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

      {/* Classes Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Table Filters & Header */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">Configured Classes & Capacities</h3>
            <span className="text-xs text-slate-500 font-medium">
              Live updates every 5 seconds
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-1">
              {(['ALL', 'MORNING', 'DAY'] as const).map((shift) => (
                <button
                  key={shift}
                  type="button"
                  onClick={() => setSelectedShift(shift)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedShift === shift
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {shift === 'ALL' ? 'All' : shift === 'MORNING' ? 'Morning' : 'Day'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No classes created yet. Click &quot;Create Class&quot; above to add your first class.
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No classes match &quot;{searchQuery}&quot;. Try clearing the search filter.
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
                {filteredClasses.map((c) => {
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
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percent >= 100
                                  ? 'bg-rose-500'
                                  : percent > 80
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-600'
                              }`}
                              style={{ width: `${Math.min(100, percent)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-8 text-right">{percent}%</span>
                        </div>
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
