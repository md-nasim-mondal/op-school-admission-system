import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/Badge';

describe('Badge Component', () => {
  it('renders HELD status correctly', () => {
    render(<Badge status="HELD" />);
    expect(screen.getByText('HELD')).toBeInTheDocument();
  });

  it('renders CONFIRMED status correctly', () => {
    render(<Badge status="CONFIRMED" />);
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
  });

  it('renders EXPIRED status correctly', () => {
    render(<Badge status="EXPIRED" />);
    expect(screen.getByText('EXPIRED')).toBeInTheDocument();
  });

  it('renders CANCELLED status correctly', () => {
    render(<Badge status="CANCELLED" />);
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });
});
