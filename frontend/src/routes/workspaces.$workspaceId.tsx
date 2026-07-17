import { useState } from 'react';
import { createFileRoute, Link, redirect, Outlet, useParams } from '@tanstack/react-router';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  type Project,
} from '../lib/projects';
import { CreateNameForm } from '../components/CreateNameForm';

export const Route = createFileRoute('/workspaces/$workspaceId')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router's redirect() is a control-flow object by design, not a real Error
      throw redirect({ to: '/' });
    }
  },
  component: WorkspaceDetail,
});

function WorkspaceDetail() {
  const { workspaceId } = useParams({ from: '/workspaces/$workspaceId' });
  const { data: projects, isLoading, isError } = useProjects(workspaceId);
  const createProject = useCreateProject(workspaceId);

  if (isLoading) return <p>Loading projects...</p>;
  if (isError) return <p className="text-red-600">Failed to load projects.</p>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link to="/" className="text-sm text-blue-600 underline">
        &larr; Back to workspaces
      </Link>

      <h1 className="my-4 text-xl font-semibold">Projects</h1>

      <ul className="mb-4 space-y-2">
        {projects?.map((project) => (
          <ProjectRow key={project.id} workspaceId={workspaceId} project={project} />
        ))}
        {projects?.length === 0 && (
          <p className="text-gray-500">No projects yet — create one below.</p>
        )}
      </ul>

      <CreateNameForm
        placeholder="New project name"
        onCreate={(name) => createProject.mutateAsync(name)}
      />

      <Outlet />
    </div>
  );
}

function ProjectRow({ workspaceId, project }: { workspaceId: string; project: Project }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const updateProject = useUpdateProject(workspaceId);
  const deleteProject = useDeleteProject(workspaceId);

  if (isEditing) {
    return (
      <li className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          className="rounded border px-2 py-1"
          autoFocus
        />
        <button
          onClick={() => {
            updateProject.mutate(
              { projectId: project.id, name },
              {
                onSuccess: () => {
                  setIsEditing(false);
                },
              }
            );
          }}
          className="text-sm text-blue-600 underline"
        >
          Save
        </button>
        <button
          onClick={() => {
            setName(project.name);
            setIsEditing(false);
          }}
          className="text-sm text-gray-500 underline"
        >
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2">
      <Link
        to="/workspaces/$workspaceId/projects/$projectId"
        params={{ workspaceId, projectId: project.id }}
        className="text-blue-600 underline"
      >
        {project.name}
      </Link>
      <span className="flex gap-2 text-sm">
        <button
          onClick={() => {
            setIsEditing(true);
          }}
          className="text-gray-500 underline"
        >
          Rename
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete "${project.name}"? This also deletes its tasks.`)) {
              deleteProject.mutate(project.id);
            }
          }}
          className="text-red-600 underline"
        >
          Delete
        </button>
      </span>
    </li>
  );
}
