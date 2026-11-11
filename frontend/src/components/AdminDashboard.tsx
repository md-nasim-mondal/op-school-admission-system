import React, { useState, useMemo } from 'react';
import { Plus, Users, Shield, CheckCircle, Clock, Search, Info } from 'lucide-react';
import { ClassDetails } from '../types';
import { LoadingState } from './LoadingState';
import { ErrorFallbackCard } from './ErrorFallbackCard';

interface AdminDashboardProps {
  classes: ClassDetails[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  classes,
  isLoading = false,
  isError = false,
  errorMessage,
  onOpenCreateModal,
  onRefresh,
  isRefreshing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShift, setSelectedShift] = useState<'ALL' | 'MORNING' | 'DAY'>('ALL');

  const totalCapacity = classes.reduce((sum: number, c: ClassDetails) => sum + c.totalSeats, 0);
  const totalHeld = classes.reduce((sum: number, c: ClassDetails) => sum + c.heldSeats, 0);
  const totalConfirmed = classes.reduce((sum: number, c: ClassDetails) => sum + c.confirmedSeats, 0);
  const totalAvailable = classes.reduce((sum: number, c: ClassDetails) => sum + c.availableSeats, 0);

  // Filter classes based on search and shift selection
  const filteredClasses = useMemo(() => {
    return classes.filter((c: ClassDetails) => {
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
      <div className="flex items-start gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 text-indigo-900 text-xs">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-indigo-700 mb-1">
            <Shield className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider">School Administration</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
            Admission &amp; Capacity Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create classes, set seat capacities, and monitor seat status in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            Create Class
          </button>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 min-[320px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-tight">Total Capacity</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2.5 sm:mt-3">
            {isLoading ? '—' : totalCapacity}
          </p>
          <span className="text-xs text-slate-400 mt-0.5 block">
            {isLoading ? 'Loading classes...' : `${classes.length} classes total`}
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-amber-200 shadow-xs min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-amber-700 leading-tight">Active Holds</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-800 mt-2.5 sm:mt-3">
            {isLoading ? '—' : totalHeld}
          </p>
          <span className="text-xs text-amber-600 mt-0.5 block">Occupied under hold</span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 leading-tight">Confirmed Admissions</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-800 mt-2.5 sm:mt-3">
            {isLoading ? '—' : totalConfirmed}
          </p>
          <span className="text-xs text-emerald-600 mt-0.5 block">Paid &amp; confirmed seats</span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-blue-200 shadow-xs min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-blue-700 leading-tight">Available Seats</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-800 mt-2.5 sm:mt-3">
            {isLoading ? '—' : totalAvailable}
          </p>
          <span className="text-xs text-blue-600 mt-0.5 block">Open for applications</span>
        </div>
      </div>

      {/* Classes Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Table Filters & Header */}
        <div className="p-3.5 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 id="admin-classes-heading" className="font-bold text-sm sm:text-base text-slate-900">
              Configured Classes &amp; Capacities
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Live updates every 5 seconds
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-44 pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {(['ALL', 'MORNING', 'DAY'] as const).map((shift) => (
                <button
                  key={shift}
                  type="button"
                  onClick={() => setSelectedShift(shift)}
                  className={`flex-1 sm:flex-initial px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap ${
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

        {isLoading ? (
          <div className="p-4 sm:p-6">
            <LoadingState
              title="Loading class capacities and occupancy metrics..."
              description="Fetching live admission statistics from the server."
              accent="indigo"
              compact
            />
          </div>
        ) : isError ? (
          <div className="p-4 sm:p-6">
            <ErrorFallbackCard
              statusCode="Connection Error"
              title="Unable to load class capacities"
              description="We couldn't retrieve class lists or live seat occupancy right now."
              errorMessage={errorMessage}
              onRetry={onRefresh}
              retryLabel="Retry Loading Dashboard"
            />
          </div>
        ) : classes.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-500 text-sm">
            No classes created yet. Click &quot;Create Class&quot; above to add your first class.
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No classes match &quot;{searchQuery}&quot;. Try clearing the search filter.
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="admin-classes-heading"
            className="responsive-table-wrapper"
          >
            <table className="responsive-table w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th scope="col" className="px-2.5 lg:px-5 py-3.5 whitespace-nowrap">Class / Shift Name</th>
                  <th scope="col" className="px-2.5 lg:px-5 py-3.5 whitespace-nowrap">ID</th>
                  <th scope="col" className="px-2.5 lg:px-5 py-3.5 text-center whitespace-nowrap">Total Seats</th>
                  <th scope="col" className="px-2.5 lg:px-5 py-3.5 text-center whitespace-nowrap">Held</th>
                  <th scope="col" className="px-2.5 lg:px-5 py-3.5 text-center whitespace-nowrap">Confirmed</th>
                  <th scope="col" className="px-2.5 lg:px-5 py-3.5 text-center whitespace-nowrap">Available</th>
                  <th scope="col" className="px-2.5 lg:px-5 py-3.5 text-right whitespace-nowrap">Occupancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredClasses.map((c: ClassDetails) => {
                  const percent = c.totalSeats > 0 
                    ? Math.round(((c.heldSeats + c.confirmedSeats) / c.totalSeats) * 100)
                    : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <th scope="row" className="px-2.5 lg:px-5 py-4 font-bold text-slate-900">
                        {c.name}
                      </th>
                      <td data-label="ID" className="px-2.5 lg:px-5 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {c.id}
                      </td>
                      <td data-label="Total Seats" className="px-2.5 lg:px-5 py-4 text-center font-semibold text-slate-800">
                        {c.totalSeats}
                      </td>
                      <td data-label="Held" className="px-2.5 lg:px-5 py-4 text-center font-semibold text-amber-700">
                        {c.heldSeats}
                      </td>
                      <td data-label="Confirmed" className="px-2.5 lg:px-5 py-4 text-center font-semibold text-emerald-700">
                        {c.confirmedSeats}
                      </td>
                      <td data-label="Available" className="px-2.5 lg:px-5 py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.availableSeats <= 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {c.availableSeats}
                        </span>
                      </td>
                      <td data-label="Occupancy" className="px-2.5 lg:px-5 py-4 text-right">
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
