import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '../lib/tasks';
import { TaskCard } from './TaskCard';

const COLUMN_LABELS: Record<Task['status'], string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
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
    <div className="flex w-72 flex-col rounded bg-gray-100 p-3">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        {COLUMN_LABELS[status]} <span className="text-gray-400">({tasks.length})</span>
      </h2>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-[4rem] flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} projectId={projectId} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
