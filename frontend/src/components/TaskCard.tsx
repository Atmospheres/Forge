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
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          autoFocus
        />
        <div className="flex gap-3 text-xs">
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
            className="font-medium text-slate-900 underline underline-offset-2 dark:text-slate-100"
          >
            Save
          </button>
          <button
            onClick={() => {
              setTitle(task.title);
              setIsEditing(false);
            }}
            className="text-slate-500 underline underline-offset-2 dark:text-slate-400"
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
      className="group cursor-grab rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-slate-800 dark:text-slate-200">{task.title}</span>
        <span className="hidden shrink-0 gap-2 text-xs group-hover:flex">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-100"
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
            className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
          >
            Delete
          </button>
        </span>
      </div>
    </div>
  );
}
