import { createFileRoute, Link, redirect, useParams } from '@tanstack/react-router';
import { TaskBoard } from '../components/TaskBoard';
import { useProjects } from '../lib/projects';
import { useWorkspace } from '../lib/workspaces';
import { AppShell, Crumb } from '../components/AppShell';

export const Route = createFileRoute('/workspaces/$workspaceId/projects/$projectId')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router's redirect() is a control-flow object by design, not a real Error
      throw redirect({ to: '/' });
    }
  },

  component: ProjectBoard,
});

function ProjectBoard() {
  const { workspaceId, projectId } = useParams({
    from: '/workspaces/$workspaceId/projects/$projectId',
  });
  const { data: workspace } = useWorkspace(workspaceId);
  // No single-project fetch endpoint exists yet, so this reuses the (already
  // cached, since the workspace index route fetches it too) project list.
  const { data: projects } = useProjects(workspaceId);
  const project = projects?.find((p) => p.id === projectId);

  return (
    <AppShell
      breadcrumb={
        <>
          <Crumb>
            <Link
              to="/workspaces/$workspaceId"
              params={{ workspaceId }}
              className="hover:text-slate-900 dark:hover:text-slate-100"
            >
              {workspace?.name ?? '...'}
            </Link>
          </Crumb>
          <Crumb current>{project?.name ?? '...'}</Crumb>
        </>
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {project?.name ?? 'Project board'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Drag tasks between columns to update status.
        </p>
      </div>

      <TaskBoard projectId={projectId} />
    </AppShell>
  );
}
