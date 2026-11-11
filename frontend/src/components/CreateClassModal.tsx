import React, { useState } from 'react';
import { PlusCircle, X, Loader2, School } from 'lucide-react';
import { CreateClassInput } from '../types';
import { getErrorMessage } from '../utils/errors';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateClassInput) => Promise<void>;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [totalSeats, setTotalSeats] = useState<number | ''>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Class name is required.');
      return;
    }

    if (!totalSeats || Number(totalSeats) <= 0) {
      setError('Total seats must be a positive number greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        totalSeats: Number(totalSeats),
      });
      setName('');
      setTotalSeats(60);
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create class.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-indigo-700 min-w-0">
            <School className="w-5 h-5 shrink-0" aria-hidden="true" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Create New Class / Shift</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Class & Shift Name
            </label>
            <input
              type="text"
              placeholder="e.g. Class 6 - Morning Shift"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Include class level and shift (e.g. Morning, Day).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Total Seat Capacity
            </label>
            <input
              type="number"
              min={1}
              placeholder="e.g. 120"
              value={totalSeats}
              onChange={(e) => setTotalSeats(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          {/* Preset Buttons for Quick Entry */}
          <div>
            <span className="text-[11px] font-medium text-slate-500 block mb-1">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {['Class 6 - Morning Shift', 'Class 6 - Day Shift', 'Class 7 - Morning Shift', 'Class 8 - Day Shift'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setName(preset)}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Create Class
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
