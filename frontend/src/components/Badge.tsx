import React from 'react';
import { HoldStatus } from '../types';

interface BadgeProps {
  status: HoldStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  switch (status) {
    case 'HELD':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          HELD
        </span>
      );
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
          CONFIRMED
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-400"></span>
          EXPIRED
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
          CANCELLED
        </span>
      );
    default:
      return null;
  }
};
