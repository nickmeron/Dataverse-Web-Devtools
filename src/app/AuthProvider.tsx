import { type ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/shared/stores/authStore';
import {
  getClientUrl,
  getUserId,
  getUserName,
  getOrgName,
  getOrgId,
  getVersion,
  isXrmAvailable,
} from '@/features/auth/services/xrmContext';
import { AlertTriangle } from 'lucide-react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isReady, contextError, setContext, setContextError } = useAuthStore();

  useEffect(() => {
    try {
      if (!isXrmAvailable()) {
        setContextError(
          'Xrm context not found. This app must run as a web resource inside a Dynamics 365 / Model-Driven App.',
        );
        return;
      }

      setContext({
        userId: getUserId(),
        userName: getUserName(),
        orgName: getOrgName(),
        orgId: getOrgId(),
        clientUrl: getClientUrl(),
        version: getVersion(),
      });
    } catch (err) {
      setContextError(
        err instanceof Error ? err.message : 'Failed to resolve Xrm context',
      );
    }
  }, [setContext, setContextError]);

  if (contextError) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-900 p-4">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-warning/20 bg-surface-800/50 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-surface-100">
            Context Unavailable
          </h2>
          <p className="text-sm text-surface-400">{contextError}</p>
          <div className="mt-2 rounded-lg bg-surface-900 p-4 text-left text-xs text-surface-500">
            <p className="font-medium text-surface-300">To use this tool:</p>
            <ol className="mt-2 list-inside list-decimal space-y-1">
              <li>Upload it as a Web Resource in your Dataverse solution</li>
              <li>Add it to a Model-Driven App page or dashboard</li>
              <li>Open it from within Dynamics 365</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-surface-400">
            Connecting to Dataverse...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
