import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, onExpire }) => {
  const calculateRemainingSeconds = (): number => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemainingSeconds);

  useEffect(() => {
    // Initial sync
    const initial = calculateRemainingSeconds();
    setRemainingSeconds(initial);
    if (initial <= 0 && onExpire) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isCritical = remainingSeconds > 0 && remainingSeconds <= 60;
  const isExpired = remainingSeconds <= 0;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-medium text-sm transition-colors ${
      isExpired
        ? 'bg-red-50 text-red-700 border-red-200'
        : isCritical
        ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
        : 'bg-blue-50 text-blue-700 border-blue-200'
    }`}>
      <Clock className="w-4 h-4" />
      {isExpired ? (
        <span className="font-semibold">EXPIRED</span>
      ) : (
        <span>
          Time remaining: <strong className="font-bold">{formattedTime}</strong>
        </span>
      )}
    </div>
  );
};
