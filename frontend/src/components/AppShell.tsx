import { type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';

export function AppShell({
  breadcrumb,
  children,
}: {
  breadcrumb?: ReactNode;
  children: ReactNode;
}) {
  const { user, logout } = useAuth0();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-base font-semibold tracking-tight text-slate-900">
              Forge
            </Link>
            {breadcrumb}
          </nav>

          <div className="flex items-center gap-4">
            {user?.name && <span className="text-sm text-slate-500">{user.name}</span>}
            <button
              onClick={() => void logout({ logoutParams: { returnTo: window.location.origin } })}
              className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

/** One breadcrumb segment. Wrap a <Link> as children for a clickable crumb, or pass `current` for the (unlinked) current page. */
export function Crumb({ children, current }: { children: ReactNode; current?: boolean }) {
  return (
    <>
      <span className="text-slate-300" aria-hidden="true">
        /
      </span>
      <span className={current ? 'font-medium text-slate-900' : 'text-slate-500'}>{children}</span>
    </>
  );
}
