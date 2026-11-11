import React from 'react';
import { ErrorFallbackCard } from './ErrorFallbackCard';

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level React ErrorBoundary catching unexpected runtime or rendering failures
 * anywhere in the application tree.
 */
export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Uncaught application error:', error, errorInfo);
    document.title = 'Application Error | School Admission System';
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col bg-slate-50 font-sans">
          <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-8">
            <ErrorFallbackCard
              variant="page"
              headingLevel="h1"
              statusCode="Application Error"
              title="Something went wrong"
              description="An unexpected error interrupted the School Admission System interface. Reload the page or return to the Student Portal."
              errorMessage={this.state.error?.message}
              onRetry={this.handleReload}
              retryLabel="Reload Application"
              showHomeLink
              showAdminLink
              useAnchorLinks
            />
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
