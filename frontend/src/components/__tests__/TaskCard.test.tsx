import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '../TaskCard';
import type { Task } from '../../lib/tasks';

const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('../../lib/tasks', async () => {
  const actual = await vi.importActual<typeof import('../../lib/tasks')>('../../lib/tasks');
  return {
    ...actual,
    useUpdateTask: () => ({ mutate: mockUpdateMutate }),
    useDeleteTask: () => ({ mutate: mockDeleteMutate }),
  };
});

// dnd-kit's useSortable attaches drag-start listeners (onPointerDown, etc.)
// that get spread directly onto the card's root div. Mocking it with a spy
// lets us assert those listeners do NOT fire when a click originates from
// the Edit/Delete buttons (they call stopPropagation), while confirming
// they DO fire for a pointerdown anywhere else on the card.
const mockOnPointerDown = vi.fn();

vi.mock('@dnd-kit/sortable', async () => {
  const actual = await vi.importActual<typeof import('@dnd-kit/sortable')>('@dnd-kit/sortable');
  return {
    ...actual,
    useSortable: () => ({
      attributes: {},
      listeners: { onPointerDown: mockOnPointerDown },
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
  };
});

const task: Task = {
  id: 't1',
  title: 'Write the report',
  status: 'TODO',
  position: 0,
  assigneeSub: null,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('TaskCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the task title', () => {
    render(<TaskCard task={task} projectId="p1" />);
    expect(screen.getByText('Write the report')).toBeInTheDocument();
  });

  it('a pointerdown on the card body triggers the drag listener', () => {
    render(<TaskCard task={task} projectId="p1" />);
    fireEvent.pointerDown(screen.getByText('Write the report'));
    expect(mockOnPointerDown).toHaveBeenCalled();
  });

  it('a pointerdown on the Edit button does not trigger the drag listener', () => {
    render(<TaskCard task={task} projectId="p1" />);
    const editButton = screen.getByRole('button', { name: 'Edit' });
    fireEvent.pointerDown(editButton);
    expect(mockOnPointerDown).not.toHaveBeenCalled();
  });

  it('a pointerdown on the Delete button does not trigger the drag listener', () => {
    render(<TaskCard task={task} projectId="p1" />);
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.pointerDown(deleteButton);
    expect(mockOnPointerDown).not.toHaveBeenCalled();
  });

  it('clicking Edit switches to an editable title input pre-filled with the current title', async () => {
    const user = userEvent.setup();
    render(<TaskCard task={task} projectId="p1" />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const input = screen.getByDisplayValue<HTMLInputElement>('Write the report');
    expect(input).toBeInTheDocument();
  });

  it('Save calls useUpdateTask with the new title', async () => {
    const user = userEvent.setup();
    render(<TaskCard task={task} projectId="p1" />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const input = screen.getByDisplayValue('Write the report');
    await user.clear(input);
    await user.type(input, 'Write the final report');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { taskId: 't1', title: 'Write the final report' },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any() intentionally returns `any` in Vitest's own types
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('Cancel discards the edit and reverts to the original title', async () => {
    const user = userEvent.setup();
    render(<TaskCard task={task} projectId="p1" />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const input = screen.getByDisplayValue('Write the report');
    await user.clear(input);
    await user.type(input, 'Something else entirely');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('Write the report')).toBeInTheDocument();
    expect(mockUpdateMutate).not.toHaveBeenCalled();
  });

  it('Delete calls useDeleteTask when the confirmation dialog is accepted', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TaskCard task={task} projectId="p1" />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockDeleteMutate).toHaveBeenCalledWith('t1');
  });

  it('Delete does nothing when the confirmation dialog is dismissed', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<TaskCard task={task} projectId="p1" />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });
});
