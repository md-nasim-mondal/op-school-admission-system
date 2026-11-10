import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountdownTimer } from '../components/CountdownTimer';

describe('CountdownTimer Component', () => {
  it('renders remaining time for future expiration', () => {
    // 5 minutes in future
    const futureDate = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    render(<CountdownTimer expiresAt={futureDate} />);
    expect(screen.getByText(/Time remaining:/i)).toBeInTheDocument();
  });

  it('renders EXPIRED when expiration is in the past', () => {
    const onExpire = vi.fn();
    const pastDate = new Date(Date.now() - 1000).toISOString();
    render(<CountdownTimer expiresAt={pastDate} onExpire={onExpire} />);
    expect(screen.getByText('EXPIRED')).toBeInTheDocument();
    expect(onExpire).toHaveBeenCalled();
  });
});
