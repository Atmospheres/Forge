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

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();

  if (isLoading) return <p>Loading...</p>;

  if (!isAuthenticated) {
    return <button onClick={() => void loginWithRedirect()}>Log in</button>;
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <p>Welcome, {user?.name}</p>
        <button
          onClick={() => void logout({ logoutParams: { returnTo: window.location.origin } })}
          className="text-sm underline"
        >
          Log out
        </button>
      </div>

      <h1 className="mb-4 text-xl font-semibold">Your workspaces</h1>
      <WorkspaceList />
    </div>
  );
}

function WorkspaceList() {
  const { data: workspaces, isLoading, isError } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();

  if (isLoading) return <p>Loading workspaces...</p>;
  if (isError) return <p className="text-red-600">Failed to load workspaces.</p>;

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {workspaces?.map((workspace) => (
          <WorkspaceRow key={workspace.id} workspace={workspace} />
        ))}
        {workspaces?.length === 0 && (
          <p className="text-gray-500">No workspaces yet — create one below.</p>
        )}
      </ul>

      <CreateNameForm
        placeholder="New workspace name"
        onCreate={(name) => createWorkspace.mutateAsync(name)}
      />
    </div>
  );
}

function WorkspaceRow({ workspace }: { workspace: Workspace }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(workspace.name);
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

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
            updateWorkspace.mutate(
              { workspaceId: workspace.id, name },
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
            setName(workspace.name);
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
        to="/workspaces/$workspaceId"
        params={{ workspaceId: workspace.id }}
        className="text-blue-600 underline"
      >
        {workspace.name}
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
            if (
              window.confirm(
                `Delete "${workspace.name}"? This also deletes its projects and tasks.`
              )
            ) {
              deleteWorkspace.mutate(workspace.id);
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
