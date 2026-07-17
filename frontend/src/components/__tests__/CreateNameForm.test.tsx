import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateNameForm } from '../CreateNameForm';

describe('CreateNameForm', () => {
  it('calls onCreate with the entered name on submit', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(<CreateNameForm placeholder="New workspace name" onCreate={onCreate} />);

    const input = screen.getByPlaceholderText('New workspace name');
    await user.type(input, 'My Workspace');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith('My Workspace');
    });
  });

  it('clears the input after a successful create', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(<CreateNameForm placeholder="New workspace name" onCreate={onCreate} />);

    const input = screen.getByPlaceholderText<HTMLInputElement>('New workspace name');
    await user.type(input, 'My Workspace');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('shows a validation error and does not call onCreate when the name is empty', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    render(<CreateNameForm placeholder="New workspace name" onCreate={onCreate} />);

    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });
});
