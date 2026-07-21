import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../ToastProvider';
import { useToast } from '../toast-context';
import { notifyError } from '../toast';
import { ApiError } from '../lib/api';

function ShowToastButton({ message }: { message: string }) {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        showToast(message, 'error');
      }}
    >
      Trigger
    </button>
  );
}

describe('ToastProvider', () => {
  it('shows a toast when showToast is called and auto-dismisses it', () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider>
          <ShowToastButton message="Something happened" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));
      expect(screen.getByText('Something happened')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(6000);
      });
      expect(screen.queryByText('Something happened')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('dismisses a toast when its close button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <ShowToastButton message="Dismiss me" />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByText('Dismiss me')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });

  it('surfaces a rate-limit-specific message for a 429 ApiError via notifyError', () => {
    render(
      <ToastProvider>
        <p>App content</p>
      </ToastProvider>
    );

    act(() => {
      notifyError(new ApiError(429, 'Rate limit exceeded, try again later.'));
    });

    expect(screen.getByText(/too fast/i)).toBeInTheDocument();
  });

  it('falls back to a generic message for a non-ApiError', () => {
    render(
      <ToastProvider>
        <p>App content</p>
      </ToastProvider>
    );

    act(() => {
      notifyError(new TypeError('Failed to fetch'));
    });

    expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
  });
});
