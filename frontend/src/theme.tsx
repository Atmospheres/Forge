import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { ThemeContext, type Theme } from './theme-context';
import { usePreferences, useUpdatePreferences } from './lib/preferences';

const STORAGE_KEY = 'forge-theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Mirrors the inline script in index.html (which sets the class before first
 * paint to avoid a flash of the wrong theme) into React state, and keeps
 * both the <html> class and localStorage in sync as the user toggles it.
 *
 * localStorage is just a fast local cache for that first paint -- the
 * account-level preference on the backend is the real source of truth once
 * the user is logged in, so it overrides the local guess exactly once, the
 * first time it loads (not on every refetch, so it can't fight a toggle the
 * user just made in this tab).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const { isAuthenticated } = useAuth0();
  const { data: serverPreferences } = usePreferences(isAuthenticated);
  const updatePreferences = useUpdatePreferences();
  const hasSyncedFromServer = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (serverPreferences && !hasSyncedFromServer.current) {
      hasSyncedFromServer.current = true;
      setTheme(serverPreferences.theme);
    }
  }, [serverPreferences]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      if (isAuthenticated) {
        updatePreferences.mutate(next);
      }
      return next;
    });
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
