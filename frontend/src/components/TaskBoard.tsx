import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useTasks, useUpdateTask, useCreateTask, type Task } from '../lib/tasks';
import { CreateNameForm } from './CreateNameForm';
import { TaskColumn } from './TaskColumn';
import { TaskCard } from './TaskCard';

const STATUSES: Task['status'][] = ['TODO', 'IN_PROGRESS', 'DONE'];

export function TaskBoard({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading, isError } = useTasks(projectId);
  const updateTask = useUpdateTask(projectId);
  const createTask = useCreateTask(projectId);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Require a small drag distance before a drag "starts" — without this,
  // a plain click on a card can be misread as a drag and interfere with
  // click-based interactions later (e.g. opening task details).
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (isLoading) return <p className="text-sm text-slate-500">Loading tasks...</p>;
  if (isError) return <p className="text-sm text-red-600">Failed to load tasks.</p>;

  const tasksByStatus = (status: Task['status']) =>
    (tasks ?? []).filter((t) => t.status === status).sort((a, b) => a.position - b.position);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks?.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !tasks) return;

    const activeTaskItem = tasks.find((t) => t.id === active.id);
    if (!activeTaskItem) return;

    // `over.id` is either another task's id (dropped on top of a card) or
    // a column's status id (dropped on the empty area of a column) — the
    // column status ids are set by useDroppable in TaskColumn.
    const overIsColumn = STATUSES.includes(over.id as Task['status']);
    const targetStatus = overIsColumn
      ? (over.id as Task['status'])
      : tasks.find((t) => t.id === over.id)?.status;

    if (!targetStatus) return;

    const columnTasks = tasksByStatus(targetStatus).filter((t) => t.id !== activeTaskItem.id);

    // Dropped on a specific card: insert at that card's position.
    // Dropped on empty column space: append to the end.
    const overTaskIndex = columnTasks.findIndex((t) => t.id === over.id);
    const newPosition = overTaskIndex === -1 ? columnTasks.length : overTaskIndex;

    if (targetStatus === activeTaskItem.status && newPosition === activeTaskItem.position) {
      return; // no actual change
    }

    updateTask.mutate({
      taskId: activeTaskItem.id,
      status: targetStatus,
      position: newPosition,
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <CreateNameForm
          placeholder="New task title"
          onCreate={(title) => createTask.mutateAsync(title)}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-5 lg:flex-row">
          {STATUSES.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasksByStatus(status)}
              projectId={projectId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} projectId={projectId} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
