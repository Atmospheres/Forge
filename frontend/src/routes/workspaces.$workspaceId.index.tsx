import { useState } from 'react';
import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  type Project,
} from '../lib/projects';
import { useWorkspace } from '../lib/workspaces';
import { CreateNameForm } from '../components/CreateNameForm';
import { AppShell, Crumb } from '../components/AppShell';

export const Route = createFileRoute('/workspaces/$workspaceId/')({
  component: WorkspaceDetail,
});

function WorkspaceDetail() {
  const { workspaceId } = useParams({ from: '/workspaces/$workspaceId/' });
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: projects, isLoading, isError } = useProjects(workspaceId);
  const createProject = useCreateProject(workspaceId);

  return (
    <AppShell breadcrumb={<Crumb current>{workspace?.name ?? '...'}</Crumb>}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {workspace?.name ?? 'Projects'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Projects in this workspace.</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <CreateNameForm
            placeholder="New project name"
            onCreate={(name) => createProject.mutateAsync(name)}
          />
        </div>

        {isLoading && <p className="text-sm text-slate-500">Loading projects...</p>}
        {isError && <p className="text-sm text-red-600">Failed to load projects.</p>}

        {projects?.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No projects yet — create one above to get started.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <ProjectCard key={project.id} workspaceId={workspaceId} project={project} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function ProjectCard({ workspaceId, project }: { workspaceId: string; project: Project }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const updateProject = useUpdateProject(workspaceId);
  const deleteProject = useDeleteProject(workspaceId);

  if (isEditing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          autoFocus
        />
        <div className="flex gap-3 text-sm">
          <button
            onClick={() => {
              updateProject.mutate(
                { projectId: project.id, name },
                { onSuccess: () => { setIsEditing(false); } }
              );
            }}
            className="font-medium text-slate-900 underline underline-offset-2"
          >
            Save
          </button>
          <button
            onClick={() => {
              setName(project.name);
              setIsEditing(false);
            }}
            className="text-slate-500 underline underline-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <Link
        to="/workspaces/$workspaceId/projects/$projectId"
        params={{ workspaceId, projectId: project.id }}
        className="block"
      >
        <h2 className="pr-14 font-semibold text-slate-900">{project.name}</h2>
        <p className="mt-1 text-xs text-slate-400">
          Created {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </Link>

      <div className="absolute right-4 top-4 flex gap-2 text-xs opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => {
            setIsEditing(true);
          }}
          className="text-slate-400 hover:text-slate-900"
        >
          Rename
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete "${project.name}"? This also deletes its tasks.`)) {
              deleteProject.mutate(project.id);
            }
          }}
          className="text-slate-400 hover:text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
