import { ApiError } from './lib/api';

export type ToastTone = 'error' | 'info';
type ShowToast = (message: string, tone?: ToastTone) => void;

let currentShowToast: ShowToast | null = null;

/**
 * Set from ToastProvider via useEffect. Lets notifyError reach the toast UI
 * from the QueryClient's global error handlers, which run outside any React
 * context -- same pattern as auth/authRedirect.ts's setLoginWithRedirect.
 */
export function setShowToast(fn: ShowToast | null) {
  currentShowToast = fn;
}

function messageForError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 429:
        return "You're doing that too fast — wait a moment and try again.";
      case 401:
        return 'Your session may have expired — try refreshing the page.';
      case 403:
        return "You don't have access to do that.";
      case 404:
        return "That couldn't be found — it may have been deleted elsewhere.";
      default:
        return error.status >= 500
          ? 'Something went wrong on our end — please try again.'
          : 'That request failed — please try again.';
    }
  }
  return 'Something went wrong — check your connection and try again.';
}

/** Call from a QueryCache/MutationCache onError handler. */
export function notifyError(error: unknown) {
  currentShowToast?.(messageForError(error), 'error');
}
