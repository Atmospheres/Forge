import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { useTheme } from '../theme-context';

export function AppShell({
  breadcrumb,
  children,
}: {
  breadcrumb?: ReactNode;
  children: ReactNode;
}) {
  const { user, logout } = useAuth0();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/"
              className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Forge
            </Link>
            {breadcrumb}
          </nav>

          <div className="flex items-center gap-4">
            {user?.name && <UserMenu name={user.name} />}
            <button
              onClick={() => void logout({ logoutParams: { returnTo: window.location.origin } })}
              className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-100"
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

function UserMenu({ name }: { name: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        aria-expanded={isOpen}
      >
        {name}
        <span className="text-xs text-slate-400" aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between rounded-md px-2 py-1.5">
            <span className="text-sm text-slate-700 dark:text-slate-300">Dark mode</span>
            <button
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={toggleTheme}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** One breadcrumb segment. Wrap a <Link> as children for a clickable crumb, or pass `current` for the (unlinked) current page. */
export function Crumb({ children, current }: { children: ReactNode; current?: boolean }) {
  return (
    <>
      <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
        /
      </span>
      <span
        className={
          current
            ? 'font-medium text-slate-900 dark:text-slate-100'
            : 'text-slate-500 dark:text-slate-400'
        }
      >
        {children}
      </span>
    </>
  );
}
