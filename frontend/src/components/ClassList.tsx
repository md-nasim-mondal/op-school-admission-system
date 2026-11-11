import React, { useState } from 'react';
import { Users, ArrowRight, Loader2 } from 'lucide-react';
import { ClassDetails } from '../types';

interface ClassListProps {
  classes: ClassDetails[];
  isLoading: boolean;
  studentId: string;
  hasActiveHoldOrConfirmed: boolean;
  onApply: (classId: string) => Promise<void>;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ClassList: React.FC<ClassListProps> = ({
  classes,
  isLoading,
  studentId,
  hasActiveHoldOrConfirmed,
  onApply,
  onRefresh,
  isRefreshing,
}) => {
  const [applyingClassId, setApplyingClassId] = useState<string | null>(null);
  const isValidBRN = /^\d{17}$/.test(studentId.trim());

  const handleApplyClick = async (classId: string) => {
    if (!isValidBRN) {
      alert('Please enter a valid 17-digit Birth Registration Number at the top before applying.');
      return;
    }
    try {
      setApplyingClassId(classId);
      await onApply(classId);
    } finally {
      setApplyingClassId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading available classes and live seat counts...</p>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
        <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No classes created yet</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          The school admin has not opened admission for any classes yet. Switch to the Admin portal to create classes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Available Classes & Shifts
          </h2>
          <p className="text-xs text-slate-500">
            First-Come, First-Served admission. Real-time live seat availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-refreshes every 5s
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh now'}
          </button>
        </div>
      </div>

      {/* Grid of Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => {
          const isFull = c.availableSeats <= 0;
          const occupancyPercent = c.totalSeats > 0 
            ? Math.round(((c.heldSeats + c.confirmedSeats) / c.totalSeats) * 100) 
            : 0;

          const isApplyingThis = applyingClassId === c.id;

          return (
            <div
              key={c.id}
              className={`rounded-2xl border border-slate-200 p-5 flex flex-col justify-between transition-all bg-white hover:shadow-md ${
                isFull
                  ? 'opacity-80'
                  : 'hover:border-blue-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {c.name}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                    isFull
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {isFull ? 'SEATS FULL' : `${c.availableSeats} LEFT`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {c.id}</p>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Capacity Occupied</span>
                    <span className="font-semibold">{occupancyPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull
                          ? 'bg-rose-500'
                          : occupancyPercent > 80
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Seat breakdown stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="block text-[11px] font-medium text-slate-500">Total</span>
                    <span className="text-sm font-bold text-slate-800">{c.totalSeats}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-100/50">
                    <span className="block text-[11px] font-medium text-amber-700">Held</span>
                    <span className="text-sm font-bold text-amber-800">{c.heldSeats}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100/50">
                    <span className="block text-[11px] font-medium text-emerald-700">Confirmed</span>
                    <span className="text-sm font-bold text-emerald-800">{c.confirmedSeats}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3">
                <button
                  type="button"
                  disabled={isFull || isApplyingThis || !isValidBRN || hasActiveHoldOrConfirmed}
                  onClick={() => handleApplyClick(c.id)}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    isFull
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : !isValidBRN
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer'
                      : hasActiveHoldOrConfirmed
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer'
                  }`}
                  title={
                    isFull
                      ? 'No seats available'
                      : !isValidBRN
                      ? 'Please enter 17-digit BRN at the top'
                      : hasActiveHoldOrConfirmed
                      ? 'You already have an active hold or confirmed admission'
                      : 'Apply for a seat in this class'
                  }
                >
                  {isApplyingThis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Holding Seat...
                    </>
                  ) : isFull ? (
                    'No Seats Available'
                  ) : hasActiveHoldOrConfirmed ? (
                    'Already Applied'
                  ) : !isValidBRN ? (
                    'Enter BRN to Apply'
                  ) : (
                    <>
                      Apply for Admission
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
