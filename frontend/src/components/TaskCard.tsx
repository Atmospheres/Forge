import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../lib/tasks';
import { useUpdateTask, useDeleteTask } from '../lib/tasks';

export function TaskCard({ task, projectId }: { task: Task; projectId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="rounded border bg-white p-3 shadow-sm">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          className="mb-2 w-full rounded border px-2 py-1 text-sm"
          autoFocus
        />
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => {
              updateTask.mutate(
                { taskId: task.id, title },
                {
                  onSuccess: () => {
                    setIsEditing(false);
                  },
                }
              );
            }}
            className="text-blue-600 underline"
          >
            Save
          </button>
          <button
            onClick={() => {
              setTitle(task.title);
              setIsEditing(false);
            }}
            className="text-gray-500 underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group cursor-grab rounded border bg-white p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <span>{task.title}</span>
        <span className="hidden shrink-0 gap-2 text-xs group-hover:flex">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="text-gray-500 underline"
          >
            Edit
          </button>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete "${task.title}"?`)) {
                deleteTask.mutate(task.id);
              }
            }}
            className="text-red-600 underline"
          >
            Delete
          </button>
        </span>
      </div>
    </div>
  );
}
