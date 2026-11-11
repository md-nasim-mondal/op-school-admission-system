import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileQuestion, Home, Shield, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  headingLevel?: 'h1' | 'h2';
}

/**
 * 404 Not Found page displayed for unknown client routes.
 */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({ headingLevel = 'h2' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const Heading = headingLevel;

  useEffect(() => {
    const prevTitle = document.title;
    document.title = '404 - Page Not Found | School Admission System';
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="min-h-[55dvh] flex items-center justify-center py-6 sm:py-12">
      <section
        aria-labelledby="not-found-heading"
        className="w-full max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-8 text-center"
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
        </div>

        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold tracking-wider bg-slate-100 text-slate-700 mb-2">
          404 &bull; Not Found
        </span>

        <Heading
          id="not-found-heading"
          className="text-lg sm:text-2xl font-bold text-slate-900"
        >
          Page Not Found
        </Heading>

        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
          The route{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] sm:text-xs break-all">
            {location.pathname}
          </code>{' '}
          does not exist in the School Admission System.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
            Student Portal
          </Link>

          <Link
            to="/admin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
            Admin
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            Go Back
          </button>
        </div>
      </section>
    </div>
  );
};
