import React, { useEffect } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { ErrorFallbackCard } from '../components/ErrorFallbackCard';
import { NotFoundPage } from './NotFoundPage';

interface ErrorPageProps {
  standalone?: boolean;
}

/**
 * Route-level error fallback rendered by React Router when a route or layout fails.
 */
export const ErrorPage: React.FC<ErrorPageProps> = ({ standalone = false }) => {
  const error = useRouteError();
  const navigate = useNavigate();

  const is404 = isRouteErrorResponse(error) && error.status === 404;

  let statusCode = 'Unexpected Error';
  let errorMessage: string | undefined;

  if (isRouteErrorResponse(error)) {
    statusCode = `HTTP ${error.status}`;
    errorMessage = error.statusText || (typeof error.data === 'string' ? error.data : undefined);
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  useEffect(() => {
    if (is404) return;
    const prevTitle = document.title;
    document.title = 'Error | School Admission System';
    return () => {
      document.title = prevTitle;
    };
  }, [is404]);

  if (is404) {
    if (standalone) {
      return (
        <div className="min-h-dvh flex flex-col bg-slate-50 font-sans">
          <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-8">
            <NotFoundPage headingLevel="h1" />
          </main>
        </div>
      );
    }
    return <NotFoundPage />;
  }

  const content = (
    <ErrorFallbackCard
      variant="page"
      headingLevel={standalone ? 'h1' : 'h2'}
      statusCode={statusCode}
      title="Unable to display this page"
      description="Something unexpected happened while loading this portal view. You can try again or return to the Student Portal."
      errorMessage={errorMessage}
      onRetry={() => {
        if (standalone) {
          window.location.reload();
        } else {
          navigate(0);
        }
      }}
      retryLabel={standalone ? 'Reload Page' : 'Retry'}
      showHomeLink
      showAdminLink
    />
  );

  if (standalone) {
    return (
      <div className="min-h-dvh flex flex-col bg-slate-50 font-sans">
        <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-8">
          {content}
        </main>
      </div>
    );
  }

  return content;
};
