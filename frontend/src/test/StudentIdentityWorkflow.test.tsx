import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentProvider, useStudent } from '../context/StudentContext';
import { ToastProvider } from '../context/ToastContext';
import { StudentIdInput } from '../components/layout/StudentIdInput';

const TEST_STUDENT_A = '20152691234567890';
const TEST_STUDENT_B = '20152699876543210';

const TestConsumer: React.FC = () => {
  const { studentId, isValidBRN, isIdentified, setStudentId, clearStudent } = useStudent();
  return (
    <div>
      <span data-testid="student-id">{studentId}</span>
      <span data-testid="is-valid">{isValidBRN ? 'VALID' : 'INVALID'}</span>
      <span data-testid="is-identified">{isIdentified ? 'IDENTIFIED' : 'ANONYMOUS'}</span>
      <button data-testid="set-student-a" onClick={() => setStudentId(TEST_STUDENT_A)}>
        Set Student A
      </button>
      <button data-testid="set-student-b" onClick={() => setStudentId(TEST_STUDENT_B)}>
        Set Student B
      </button>
      <button data-testid="set-invalid" onClick={() => setStudentId('12345')}>
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

  it('starts as anonymous with empty string when localStorage is empty', () => {
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

    expect(screen.getByTestId('student-id').textContent).toBe(TEST_STUDENT_A);
    expect(screen.getByTestId('is-valid').textContent).toBe('VALID');
    expect(screen.getByTestId('is-identified').textContent).toBe('IDENTIFIED');
    expect(localStorage.getItem('student_id')).toBe(TEST_STUDENT_A);
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
    expect(screen.getByTestId('student-id').textContent).toBe(TEST_STUDENT_A);
    expect(localStorage.getItem('student_id')).toBe(TEST_STUDENT_A);

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
    expect(screen.getByTestId('student-id').textContent).toBe(TEST_STUDENT_B);
    expect(screen.getByTestId('is-identified').textContent).toBe('IDENTIFIED');
    expect(localStorage.getItem('student_id')).toBe(TEST_STUDENT_B);
  });

  it('StudentIdInput does not set identity automatically while typing until Submit is clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StudentProvider>
            <StudentIdInput />
            <TestConsumer />
          </StudentProvider>
        </ToastProvider>
      </QueryClientProvider>
    );

    const input = screen.getByLabelText(/Student Birth Registration Number/i);
    const submitBtn = screen.getByRole('button', { name: /Submit ID/i });

    // Initially submit button is disabled and state is anonymous
    expect(submitBtn).toBeDisabled();
    expect(screen.getByTestId('is-identified').textContent).toBe('ANONYMOUS');

    // Type 17 digits into input
    fireEvent.change(input, { target: { value: TEST_STUDENT_A } });

    // Still ANONYMOUS before clicking submit!
    expect(screen.getByTestId('is-identified').textContent).toBe('ANONYMOUS');
    expect(localStorage.getItem('student_id')).toBeNull();
    expect(submitBtn).not.toBeDisabled();

    // Click Submit
    fireEvent.click(submitBtn);

    // Now IDENTIFIED, persisted to localStorage, and input field is locked (disabled) until Switch Student!
    expect(screen.getByTestId('is-identified').textContent).toBe('IDENTIFIED');
    expect(screen.getByTestId('student-id').textContent).toBe(TEST_STUDENT_A);
    expect(localStorage.getItem('student_id')).toBe(TEST_STUDENT_A);
    expect(input).toBeDisabled();

    // Clearing / switching re-enables the input field
    act(() => {
      screen.getByTestId('clear-student').click();
    });
    expect(input).not.toBeDisabled();
  });

  it('StudentIdInput Quick Fill Demo ID populates input and enables Submit without auto-saving', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StudentProvider>
            <StudentIdInput />
            <TestConsumer />
          </StudentProvider>
        </ToastProvider>
      </QueryClientProvider>
    );

    const input = screen.getByLabelText(/Student Birth Registration Number/i) as HTMLInputElement;
    const demoBtn = screen.getByRole('button', { name: /Demo ID/i });
    const submitBtn = screen.getByRole('button', { name: /Submit ID/i });

    expect(input.value).toBe('');
    expect(screen.getByTestId('is-identified').textContent).toBe('ANONYMOUS');

    // Click Quick Fill Demo ID
    fireEvent.click(demoBtn);

    // Populates input with 17 digits but does NOT auto-submit yet
    expect(input.value).toBe(TEST_STUDENT_A);
    expect(screen.getByTestId('is-identified').textContent).toBe('ANONYMOUS');
    expect(submitBtn).not.toBeDisabled();

    // Now user clicks Submit ID
    fireEvent.click(submitBtn);

    // Identity is now confirmed and active
    expect(screen.getByTestId('is-identified').textContent).toBe('IDENTIFIED');
    expect(screen.getByTestId('student-id').textContent).toBe(TEST_STUDENT_A);
  });
});
