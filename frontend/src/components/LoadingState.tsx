import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  accent?: 'blue' | 'indigo';
  className?: string;
}

const SPINNER_DIMENSIONS: Record<'sm' | 'md' | 'lg', { size: string; thickness: string }> = {
  sm: { size: '20px', thickness: '2px' },
  md: { size: '32px', thickness: '3px' },
  lg: { size: '44px', thickness: '3.5px' },
};

const SPINNER_COLORS: Record<'blue' | 'indigo', string> = {
  blue: '#2563eb',
  indigo: '#4f46e5',
};

/**
 * Semantic indeterminate loading indicator built on the native <progress> element.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading content',
  size = 'md',
  accent = 'blue',
  className = '',
}) => {
  const { size: dim, thickness } = SPINNER_DIMENSIONS[size];
  const style = {
    '--size': dim,
    '--thickness': thickness,
    '--spinner-color': SPINNER_COLORS[accent],
  } as React.CSSProperties;

  return (
    <progress
      aria-label={label}
      className={`loading-spinner ${className}`.trim()}
      style={style}
    />
  );
};

interface LoadingStateProps {
  title?: string;
  description?: string;
  accent?: 'blue' | 'indigo';
  showSkeleton?: boolean;
  skeletonCount?: number;
  compact?: boolean;
}

/**
 * Accessible loading state card with optional responsive skeleton placeholders.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading data...',
  description = 'Please wait a moment while we fetch the latest information.',
  accent = 'blue',
  showSkeleton = false,
  skeletonCount = 3,
  compact = false,
}) => {
  return (
    <div className="space-y-4">
      <div
        className={`flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 shadow-xs ${
          compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12'
        }`}
      >
        <LoadingSpinner size={compact ? 'md' : 'lg'} accent={accent} label={title} className="mb-3.5" />
        <p className="text-sm sm:text-base font-semibold text-slate-800">{title}</p>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">{description}</p>
        )}
      </div>

      {showSkeleton && (
        <div
          aria-hidden="true"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4 motion-safe:animate-pulse"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-5 w-16 bg-slate-100 rounded-full shrink-0" />
              </div>
              <div className="space-y-2 pt-1">
                <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                <div className="flex justify-between gap-2">
                  <div className="h-3 bg-slate-100 rounded w-20" />
                  <div className="h-3 bg-slate-100 rounded w-16" />
                </div>
              </div>
              <div className="h-10 bg-slate-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface PageLoaderProps {
  label?: string;
}

/**
 * Route/Suspense page-level loading screen centered cleanly inside the viewport or layout.
 */
export const PageLoader: React.FC<PageLoaderProps> = ({
  label = 'Loading School Admission System...',
}) => {
  return (
    <div className="min-h-[55dvh] flex items-center justify-center px-2 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <LoadingState
          title={label}
          description="Preparing portal view and real-time admission status."
          accent="blue"
          compact
        />
      </div>
    </div>
  );
};
