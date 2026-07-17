import { createFileRoute, redirect, useParams } from '@tanstack/react-router';
import { z } from 'zod';
import { TaskBoard } from '../components/TaskBoard';

const searchSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
});

export const Route = createFileRoute('/workspaces/$workspaceId/projects/$projectId')({
  validateSearch: searchSchema,

  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router's redirect() is a control-flow object by design, not a real Error
      throw redirect({ to: '/' });
    }
  },

  component: ProjectBoard,
});

function ProjectBoard() {
  const { projectId } = useParams({ from: '/workspaces/$workspaceId/projects/$projectId' });

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Project board</h1>
      <TaskBoard projectId={projectId} />
    </div>
  );
}
