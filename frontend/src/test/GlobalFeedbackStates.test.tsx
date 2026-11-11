import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentProvider } from '../context/StudentContext';
import { ToastProvider } from '../context/ToastContext';
import { GlobalErrorBoundary } from '../components/ErrorBoundary';
import { LoadingState, PageLoader } from '../components/LoadingState';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ErrorPage } from '../pages/ErrorPage';
import { MainLayout } from '../layouts/MainLayout';
import { ClassList } from '../components/ClassList';
import { AdminDashboard } from '../components/AdminDashboard';

const CrashComponent: React.FC<{ message?: string }> = ({ message = 'Simulated crash' }) => {
  throw new Error(message);
};

describe('Global Error, Not Found (404), and Loading States', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders semantic indeterminate <progress> spinner in LoadingState and PageLoader', () => {
    const { rerender } = render(
      <LoadingState title="Loading seats..." showSkeleton skeletonCount={2} />
    );

    const progressBar = screen.getByRole('progressbar', { name: 'Loading seats...' });
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).not.toHaveAttribute('value');
    expect(screen.getByText('Loading seats...')).toBeInTheDocument();

    rerender(<PageLoader label="Loading admin console..." />);
    expect(screen.getByRole('progressbar', { name: 'Loading admin console...' })).toBeInTheDocument();
  });

  it('renders NotFoundPage with 404 details, title update, and portal navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/missing-route']}>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(document.title).toBe('404 - Page Not Found | School Admission System');
    expect(screen.getByRole('heading', { name: /Page Not Found/i })).toBeInTheDocument();
    expect(screen.getByText('/missing-route')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Student Portal/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /^Admin$/i })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
  });

  it('catches uncaught render errors in GlobalErrorBoundary with standalone main and recovery actions', () => {
    render(
      <GlobalErrorBoundary>
        <CrashComponent message="Boom inside root tree" />
      </GlobalErrorBoundary>
    );

    expect(document.title).toBe('Application Error | School Admission System');
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /Something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText('Boom inside root tree')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload Application/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Student Portal/i })).toHaveAttribute('href', '/');
  });

  it('renders NotFoundPage inside MainLayout for unmatched wildcard routes', () => {
    const queryClient = new QueryClient();
    const memoryRouter = createMemoryRouter(
      [
        {
          path: '/',
          element: <MainLayout />,
          errorElement: <ErrorPage standalone />,
          children: [
            {
              errorElement: <ErrorPage />,
              children: [
                { index: true, element: <div>Home OK</div> },
                { path: '*', element: <NotFoundPage /> },
              ],
            },
          ],
        },
      ],
      { initialEntries: ['/does-not-exist'] }
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StudentProvider>
            <RouterProvider router={memoryRouter} />
          </StudentProvider>
        </ToastProvider>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: /School Admission System/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Page Not Found/i })).toBeInTheDocument();
    expect(screen.getByText('/does-not-exist')).toBeInTheDocument();
  });

  it('renders ErrorPage inside MainLayout when a child route throws', () => {
    const queryClient = new QueryClient();
    const errorRouter = createMemoryRouter(
      [
        {
          path: '/',
          element: <MainLayout />,
          errorElement: <ErrorPage standalone />,
          children: [
            {
              errorElement: <ErrorPage />,
              children: [{ path: 'crash', element: <CrashComponent message="Route exploded" /> }],
            },
          ],
        },
      ],
      { initialEntries: ['/crash'] }
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StudentProvider>
            <RouterProvider router={errorRouter} />
          </StudentProvider>
        </ToastProvider>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: /School Admission System/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Unable to display this page/i })).toBeInTheDocument();
    expect(screen.getByText('Route exploded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('shows ClassList loading state and retryable connection error state', () => {
    const onRefresh = vi.fn();
    const { rerender } = render(
      <ClassList
        classes={[]}
        isLoading={true}
        studentId=""
        myHolds={[]}
        onApply={vi.fn()}
        onRefresh={onRefresh}
        isRefreshing={false}
      />
    );

    expect(screen.getByRole('progressbar', { name: /Loading available classes/i })).toBeInTheDocument();

    rerender(
      <ClassList
        classes={[]}
        isLoading={false}
        isError={true}
        errorMessage="Network Error"
        studentId=""
        myHolds={[]}
        onApply={vi.fn()}
        onRefresh={onRefresh}
        isRefreshing={false}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Unable to load classes')).toBeInTheDocument();
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Retry Loading Classes/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows AdminDashboard loading state and retryable connection error state without flashing empty state', () => {
    const onRefresh = vi.fn();
    const { rerender } = render(
      <AdminDashboard
        classes={[]}
        isLoading={true}
        onOpenCreateModal={vi.fn()}
        onRefresh={onRefresh}
        isRefreshing={false}
      />
    );

    expect(screen.getByRole('progressbar', { name: /Loading class capacities/i })).toBeInTheDocument();
    expect(screen.queryByText(/No classes created yet/i)).not.toBeInTheDocument();

    rerender(
      <AdminDashboard
        classes={[]}
        isLoading={false}
        isError={true}
        errorMessage="Request failed with status code 500"
        onOpenCreateModal={vi.fn()}
        onRefresh={onRefresh}
        isRefreshing={false}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Unable to load class capacities')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Retry Loading Dashboard/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
