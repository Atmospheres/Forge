import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import {
  useWorkspaces,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  type Workspace,
} from '../lib/workspaces';
import { CreateNameForm } from '../components/CreateNameForm';
import { AppShell } from '../components/AppShell';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Forge</h1>
          <p className="mb-6 text-sm text-slate-500">Sign in to see your workspaces.</p>
          <button
            onClick={() => void loginWithRedirect()}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Your workspaces</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything you own or have created, in one place.
        </p>
      </div>
      <WorkspaceList />
    </AppShell>
  );
}

function WorkspaceList() {
  const { data: workspaces, isLoading, isError } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <CreateNameForm
          placeholder="New workspace name"
          onCreate={(name) => createWorkspace.mutateAsync(name)}
        />
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading workspaces...</p>}
      {isError && <p className="text-sm text-red-600">Failed to load workspaces.</p>}

      {workspaces?.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No workspaces yet — create one above to get started.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces?.map((workspace) => (
          <WorkspaceCard key={workspace.id} workspace={workspace} />
        ))}
      </div>
    </div>
  );
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(workspace.name);
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

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
              updateWorkspace.mutate(
                { workspaceId: workspace.id, name },
                { onSuccess: () => { setIsEditing(false); } }
              );
            }}
            className="font-medium text-slate-900 underline underline-offset-2"
          >
            Save
          </button>
          <button
            onClick={() => {
              setName(workspace.name);
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
      <Link to="/workspaces/$workspaceId" params={{ workspaceId: workspace.id }} className="block">
        <h2 className="pr-14 font-semibold text-slate-900">{workspace.name}</h2>
        <p className="mt-1 text-xs text-slate-400">
          Created {new Date(workspace.createdAt).toLocaleDateString()}
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
            if (
              window.confirm(
                `Delete "${workspace.name}"? This also deletes its projects and tasks.`
              )
            ) {
              deleteWorkspace.mutate(workspace.id);
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
