import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentProvider, useStudent, DEMO_STUDENT_A, DEMO_STUDENT_B } from '../context/StudentContext';

const TestConsumer: React.FC = () => {
  const { studentId, isValidBRN, isIdentified, identifyStudent, clearStudent } = useStudent();
  return (
    <div>
      <span data-testid="student-id">{studentId}</span>
      <span data-testid="is-valid">{isValidBRN ? 'VALID' : 'INVALID'}</span>
      <span data-testid="is-identified">{isIdentified ? 'IDENTIFIED' : 'ANONYMOUS'}</span>
      <button data-testid="set-student-a" onClick={() => identifyStudent(DEMO_STUDENT_A)}>
        Set Student A
      </button>
      <button data-testid="set-student-b" onClick={() => identifyStudent(DEMO_STUDENT_B)}>
        Set Student B
      </button>
      <button data-testid="set-invalid" onClick={() => identifyStudent('12345')}>
        Set Invalid
      </button>
      <button data-testid="clear-student" onClick={clearStudent}>
        Clear
      </button>
    </div>
  );
};

describe('StudentIdentityWorkflow and Switching', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient();
  });

  it('starts as anonymous when localStorage is empty', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <StudentProvider>
          <TestConsumer />
        </StudentProvider>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('student-id').textContent).toBe('');
    expect(screen.getByTestId('is-valid').textContent).toBe('INVALID');
    expect(screen.getByTestId('is-identified').textContent).toBe('ANONYMOUS');
  });

  it('identifies Student A with valid 17-digit BRN and persists to localStorage', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <StudentProvider>
          <TestConsumer />
        </StudentProvider>
      </QueryClientProvider>
    );

    act(() => {
      screen.getByTestId('set-student-a').click();
    });

    expect(screen.getByTestId('student-id').textContent).toBe(DEMO_STUDENT_A);
    expect(screen.getByTestId('is-valid').textContent).toBe('VALID');
    expect(screen.getByTestId('is-identified').textContent).toBe('IDENTIFIED');
    expect(localStorage.getItem('student_id')).toBe(DEMO_STUDENT_A);
  });

  it('rejects incomplete identifiers under 17 digits from being marked as identified', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <StudentProvider>
          <TestConsumer />
        </StudentProvider>
      </QueryClientProvider>
    );

    act(() => {
      screen.getByTestId('set-invalid').click();
    });

    expect(screen.getByTestId('student-id').textContent).toBe('12345');
    expect(screen.getByTestId('is-valid').textContent).toBe('INVALID');
    expect(screen.getByTestId('is-identified').textContent).toBe('ANONYMOUS');
    expect(localStorage.getItem('student_id')).toBeNull();
  });

  it('switching from Student A to Student B flushes previous state and assigns new identity', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <StudentProvider>
          <TestConsumer />
        </StudentProvider>
      </QueryClientProvider>
    );

    // Identify Student A
    act(() => {
      screen.getByTestId('set-student-a').click();
    });
    expect(screen.getByTestId('student-id').textContent).toBe(DEMO_STUDENT_A);
    expect(localStorage.getItem('student_id')).toBe(DEMO_STUDENT_A);

    // Clear / Switch
    act(() => {
      screen.getByTestId('clear-student').click();
    });
    expect(screen.getByTestId('student-id').textContent).toBe('');
    expect(screen.getByTestId('is-identified').textContent).toBe('ANONYMOUS');
    expect(localStorage.getItem('student_id')).toBeNull();

    // Identify Student B
    act(() => {
      screen.getByTestId('set-student-b').click();
    });
    expect(screen.getByTestId('student-id').textContent).toBe(DEMO_STUDENT_B);
    expect(screen.getByTestId('is-identified').textContent).toBe('IDENTIFIED');
    expect(localStorage.getItem('student_id')).toBe(DEMO_STUDENT_B);
  });
});
