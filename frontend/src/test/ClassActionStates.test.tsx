import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClassList } from '../components/ClassList';
import { ClassDetails, StudentHold } from '../types';

const mockClass1: ClassDetails = {
  id: 'c_morning_6',
  name: 'Class 6 - Morning Shift',
  totalSeats: 120,
  heldSeats: 10,
  confirmedSeats: 20,
  availableSeats: 90,
};

const mockClass2: ClassDetails = {
  id: 'c_day_6',
  name: 'Class 6 - Day Shift',
  totalSeats: 100,
  heldSeats: 0,
  confirmedSeats: 0,
  availableSeats: 100,
};

const mockFullClass: ClassDetails = {
  id: 'c_full',
  name: 'Class 8 - Full Shift',
  totalSeats: 50,
  heldSeats: 10,
  confirmedSeats: 40,
  availableSeats: 0,
};

const defaultProps = {
  classes: [mockClass1, mockClass2, mockFullClass],
  isLoading: false,
  studentId: '20152691234567890',
  myHolds: [] as StudentHold[],
  onApply: vi.fn(),
  onRefresh: vi.fn(),
  isRefreshing: false,
};

describe('ClassList Action States', () => {
  it('renders "Identify to Apply" when student is not identified', () => {
    render(<ClassList {...defaultProps} studentId="" />);
    const buttons = screen.getAllByRole('button', { name: /Identify to Apply/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders "Apply for Admission" when student has no active holds', () => {
    render(<ClassList {...defaultProps} myHolds={[]} />);
    expect(screen.getAllByRole('button', { name: /Apply for Admission/i }).length).toBe(2);
    expect(screen.getByRole('button', { name: /No Seats Available/i })).toBeInTheDocument();
  });

  it('renders "No Seats Available" when class has 0 available seats', () => {
    render(<ClassList {...defaultProps} myHolds={[]} />);
    const fullButton = screen.getByRole('button', { name: /No Seats Available/i });
    expect(fullButton).toBeDisabled();
  });

  it('renders "Continue Application" when student currently holds a seat in THIS class', () => {
    const futureDate = new Date(Date.now() + 500000).toISOString();
    const activeHold: StudentHold = {
      holdId: 'h_1',
      classId: 'c_morning_6',
      className: 'Class 6 - Morning Shift',
      status: 'HELD',
      expiresAt: futureDate,
    };

    render(<ClassList {...defaultProps} myHolds={[activeHold]} />);
    expect(screen.getByRole('button', { name: /Continue Application/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Application Already Active/i }).length).toBe(2);
  });

  it('renders "Application Already Active" for other classes when student holds a seat in Class 1', () => {
    const futureDate = new Date(Date.now() + 500000).toISOString();
    const activeHold: StudentHold = {
      holdId: 'h_1',
      classId: 'c_morning_6',
      className: 'Class 6 - Morning Shift',
      status: 'HELD',
      expiresAt: futureDate,
    };

    render(<ClassList {...defaultProps} myHolds={[activeHold]} />);
    const alreadyActiveBtns = screen.getAllByRole('button', { name: /Application Already Active/i });
    expect(alreadyActiveBtns.length).toBe(2);
    expect(alreadyActiveBtns[0]).toBeDisabled();
    expect(alreadyActiveBtns[1]).toBeDisabled();
  });

  it('renders "Admission Confirmed" for confirmed class and blocks other classes', () => {
    const confirmedHold: StudentHold = {
      holdId: 'h_conf',
      classId: 'c_morning_6',
      className: 'Class 6 - Morning Shift',
      status: 'CONFIRMED',
      expiresAt: new Date().toISOString(),
    };

    render(<ClassList {...defaultProps} myHolds={[confirmedHold]} />);
    expect(screen.getByRole('button', { name: /Admission Confirmed/i })).toBeDisabled();
    const otherClassBtns = screen.getAllByRole('button', { name: /Already Admitted to Another Class/i });
    expect(otherClassBtns.length).toBe(2);
    expect(otherClassBtns[0]).toBeDisabled();
    expect(otherClassBtns[1]).toBeDisabled();
  });

  it('renders "Apply Again" when previous hold was EXPIRED and student has no active holds', () => {
    const expiredHold: StudentHold = {
      holdId: 'h_exp',
      classId: 'c_morning_6',
      className: 'Class 6 - Morning Shift',
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 10000).toISOString(),
    };

    render(<ClassList {...defaultProps} myHolds={[expiredHold]} />);
    expect(screen.getByRole('button', { name: /Apply Again/i })).toBeInTheDocument();
  });
});
