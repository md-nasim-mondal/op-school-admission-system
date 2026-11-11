import React, { useState, useMemo } from 'react';
import { Users, ArrowRight, Loader2, Search, CheckCircle2, Clock } from 'lucide-react';
import { ClassDetails, StudentHold } from '../types';

interface ClassListProps {
  classes: ClassDetails[];
  isLoading: boolean;
  studentId: string;
  myHolds: StudentHold[];
  onApply: (classId: string) => Promise<void>;
  onContinueHold?: (hold: StudentHold) => void;
  onPromptIdentification?: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ClassList: React.FC<ClassListProps> = ({
  classes,
  isLoading,
  studentId,
  myHolds,
  onApply,
  onContinueHold,
  onPromptIdentification,
  onRefresh,
  isRefreshing,
}) => {
  const [applyingClassId, setApplyingClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShift, setSelectedShift] = useState<'ALL' | 'MORNING' | 'DAY'>('ALL');

  const isValidBRN = /^\d{17}$/.test(studentId.trim());

  // Derive active hold and confirmed admission across all classes
  const now = Date.now();
  const activeHold = myHolds.find(
    (h) => h.status === 'HELD' && new Date(h.expiresAt).getTime() > now
  ) || null;

  const confirmedHold = myHolds.find((h) => h.status === 'CONFIRMED') || null;

  // Filter classes based on search and shift
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesShift = 
        selectedShift === 'ALL' ||
        (selectedShift === 'MORNING' && c.name.toLowerCase().includes('morning')) ||
        (selectedShift === 'DAY' && c.name.toLowerCase().includes('day'));

      return matchesSearch && matchesShift;
    });
  }, [classes, searchQuery, selectedShift]);

  const handleApplyClick = async (classId: string) => {
    if (!isValidBRN) {
      if (onPromptIdentification) {
        onPromptIdentification();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-xs">
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
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Available Classes & Shifts
          </h2>
          <p className="text-xs text-slate-500">
            First-Come, First-Served admission. Real-time live seat availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live 5s Polling
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer px-1 py-1"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh now'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search classes or shifts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 placeholder:text-slate-400 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'MORNING', 'DAY'] as const).map((shift) => (
            <button
              key={shift}
              type="button"
              onClick={() => setSelectedShift(shift)}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap text-center ${
                selectedShift === shift
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {shift === 'ALL' ? 'All Shifts' : shift === 'MORNING' ? 'Morning Shift' : 'Day Shift'}
            </button>
          ))}
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No classes match your filter criteria. Try clearing the search or shift selection.
        </div>
      ) : (
        /* Grid of Class Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((c) => {
            const isFull = c.availableSeats <= 0;
            const occupancyPercent = c.totalSeats > 0 
              ? Math.round(((c.heldSeats + c.confirmedSeats) / c.totalSeats) * 100) 
              : 0;

            const isApplyingThis = applyingClassId === c.id;

            // State evaluation for this exact class
            const isConfirmedThisClass = confirmedHold?.classId === c.id;
            const isConfirmedOtherClass = confirmedHold != null && confirmedHold.classId !== c.id;
            const isHeldThisClass = activeHold?.classId === c.id;
            const isHeldOtherClass = activeHold != null && activeHold.classId !== c.id;
            const hadPreviousExpiredOrCancelled = !activeHold && !confirmedHold && myHolds.some(
              (h) => h.classId === c.id && (h.status === 'EXPIRED' || h.status === 'CANCELLED')
            );

            // Determine button presentation and status
            let buttonText: React.ReactNode = (
              <>
                Apply for Admission
                <ArrowRight className="w-4 h-4" />
              </>
            );
            let buttonDisabled = false;
            let buttonClasses = 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer';
            let buttonTitle = 'Apply for a seat in this class';
            let onButtonClick: () => void | Promise<void> = () => handleApplyClick(c.id);

            if (isApplyingThis) {
              buttonText = (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Holding Seat...
                </>
              );
              buttonDisabled = true;
              buttonClasses = 'bg-blue-600 text-white opacity-70 cursor-wait';
            } else if (!isValidBRN) {
              buttonText = 'Enter BRN Above to Apply';
              buttonDisabled = false;
              buttonClasses = 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer border border-slate-200';
              buttonTitle = 'Please enter the 17-digit Birth Registration Number in the header above to apply';
              onButtonClick = () => {
                document.getElementById('top-brn-input')?.focus();
                if (onPromptIdentification) {
                  onPromptIdentification();
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              };
            } else if (isConfirmedThisClass) {
              buttonText = (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Admission Confirmed
                </>
              );
              buttonDisabled = true;
              buttonClasses = 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default';
              buttonTitle = 'Your admission in this class is officially confirmed and paid.';
            } else if (isConfirmedOtherClass) {
              buttonText = 'Already Admitted to Another Class';
              buttonDisabled = true;
              buttonClasses = 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200';
              buttonTitle = `You already have a confirmed admission in another class (${confirmedHold.className || confirmedHold.classId}).`;
            } else if (isHeldThisClass) {
              buttonText = (
                <>
                  <Clock className="w-4 h-4" />
                  Continue Application
                </>
              );
              buttonDisabled = false;
              buttonClasses = 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer';
              buttonTitle = 'You currently hold a seat in this class. Click to review timer and complete fee payment.';
              onButtonClick = () => {
                if (activeHold && onContinueHold) {
                  onContinueHold(activeHold);
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              };
            } else if (isHeldOtherClass) {
              buttonText = 'Application Already Active';
              buttonDisabled = true;
              buttonClasses = 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200';
              buttonTitle = `You currently have an active seat hold in ${activeHold.className || activeHold.classId}. You cannot apply for multiple classes simultaneously.`;
            } else if (isFull) {
              buttonText = 'No Seats Available';
              buttonDisabled = true;
              buttonClasses = 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200';
              buttonTitle = 'All seats in this class are currently occupied or held.';
            } else if (hadPreviousExpiredOrCancelled) {
              buttonText = (
                <>
                  Apply Again
                  <ArrowRight className="w-4 h-4" />
                </>
              );
              buttonDisabled = false;
              buttonClasses = 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer';
              buttonTitle = 'Your previous hold was released. You can apply again for this class.';
            }

            return (
              <div
                key={c.id}
                className={`rounded-2xl border border-slate-200 p-3.5 min-[320px]:p-4 sm:p-5 flex flex-col justify-between transition-all bg-white hover:shadow-md min-w-0 ${
                  isFull ? 'opacity-85' : 'hover:border-blue-300'
                } ${isConfirmedThisClass ? 'ring-2 ring-emerald-500/20 border-emerald-300' : ''}`}
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug min-w-0 break-words">
                      {c.name}
                    </h3>
                    <span
                      className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold shrink-0 ${
                        isFull
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isFull ? 'SEATS FULL' : `${c.availableSeats} LEFT`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 break-all">ID: {c.id}</p>

                  {/* Progress bar */}
                  <div className="mt-3.5 sm:mt-4">
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
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3.5 sm:mt-4 pt-3 border-t border-slate-100 text-center">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 min-w-0">
                      <span className="block text-[10px] min-[340px]:text-[11px] font-medium text-slate-500 truncate">Total</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">{c.totalSeats}</span>
                    </div>
                    <div className="p-1.5 sm:p-2 rounded-lg bg-amber-50 border border-amber-200/60 min-w-0">
                      <span className="block text-[10px] min-[340px]:text-[11px] font-medium text-amber-700 truncate">Held</span>
                      <span className="text-xs sm:text-sm font-bold text-amber-800">{c.heldSeats}</span>
                    </div>
                    <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 border border-emerald-200/60 min-w-0">
                      <span className="block text-[10px] min-[340px]:text-[11px] font-medium text-emerald-700 truncate">Confirmed</span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-800">{c.confirmedSeats}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4 sm:mt-5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={buttonDisabled}
                    onClick={onButtonClick}
                    className={`w-full min-h-[44px] py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 text-center leading-snug transition-all ${buttonClasses}`}
                    title={buttonTitle}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
