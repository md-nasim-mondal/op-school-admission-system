import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home, Shield } from "lucide-react";

interface ErrorFallbackCardProps {
  statusCode?: string;
  title: string;
  description: string;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  showHomeLink?: boolean;
  showAdminLink?: boolean;
  useAnchorLinks?: boolean;
  headingLevel?: "h1" | "h2";
  variant?: "page" | "inline";
}

/**
 * Unified accessible error card shared by global ErrorBoundary, route errorElement,
 * and inline API error states.
 */
export const ErrorFallbackCard: React.FC<ErrorFallbackCardProps> = ({
  statusCode = "Error",
  title,
  description,
  errorMessage,
  onRetry,
  retryLabel = "Try Again",
  showHomeLink = false,
  showAdminLink = false,
  useAnchorLinks = false,
  headingLevel = "h2",
  variant = "inline",
}) => {
  const Heading = headingLevel;
  const isPage = variant === "page";

  const homeAction = showHomeLink ? (
    useAnchorLinks ? (
      <a
        href="/"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
        Student Portal
      </a>
    ) : (
      <Link
        to="/"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
        Student Portal
      </Link>
    )
  ) : null;

  const adminAction = showAdminLink ? (
    useAnchorLinks ? (
      <a
        href="/admin"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
        Admin Portal
      </a>
    ) : (
      <Link
        to="/admin"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
        Admin Portal
      </Link>
    )
  ) : null;

  return (
    <div
      role="alert"
      className={
        isPage
          ? "min-h-[55dvh] flex items-center justify-center py-6 sm:py-12"
          : ""
      }
    >
      <div
        className={`bg-white rounded-2xl border border-rose-200 shadow-xs text-center ${
          isPage ? "w-full max-w-xl mx-auto p-5 sm:p-8" : "p-5 sm:p-8"
        }`}
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
        </div>

        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 mb-2">
          {statusCode}
        </span>

        <Heading className="text-lg sm:text-2xl font-bold text-slate-900">
          {title}
        </Heading>

        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
          {description}
        </p>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 mb-0.5">
              Details
            </p>
            <p className="text-xs font-mono text-rose-900 wrap-break-word">
              {errorMessage}
            </p>
          </div>
        )}

        {(onRetry || showHomeLink || showAdminLink) && (
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
                {retryLabel}
              </button>
            )}
            {homeAction}
            {adminAction}
          </div>
        )}
      </div>
    </div>
  );
};
