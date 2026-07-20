import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '../lib/tasks';
import { TaskCard } from './TaskCard';

const COLUMN_LABELS: Record<Task['status'], string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const COLUMN_ACCENTS: Record<Task['status'], string> = {
  TODO: 'bg-slate-400',
  IN_PROGRESS: 'bg-blue-500',
  DONE: 'bg-emerald-500',
};

export function TaskColumn({
  status,
  tasks,
  projectId,
}: {
  status: Task['status'];
  tasks: Task[];
  projectId: string;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex min-w-[18rem] flex-1 flex-col rounded-xl bg-slate-100 p-4 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${COLUMN_ACCENTS[status]}`} aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {COLUMN_LABELS[status]}
        </h2>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-[6rem] flex-1 flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} projectId={projectId} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
