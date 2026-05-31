import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'An unexpected error occurred.';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-xs">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} className="text-destructive" />
        </div>
        <p className="text-base font-bold text-foreground mb-1">Something went wrong</p>
        <p className="text-xs text-muted-foreground mb-5">{message}</p>
        <button
          onClick={() => { navigate('/'); window.location.reload(); }}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
