import { create } from 'zustand';

interface AuthState {
  /** Whether Xrm context was resolved successfully */
  isReady: boolean;

  /** Current user info from Xrm context */
  userId: string | null;
  userName: string | null;

  /** Environment info from Xrm context */
  orgName: string | null;
  orgId: string | null;
  clientUrl: string | null;
  version: string | null;

  /** Error if Xrm context is unavailable */
  contextError: string | null;

  /** Set all context info at once after Xrm resolves */
  setContext: (info: {
    userId: string;
    userName: string;
    orgName: string;
    orgId: string;
    clientUrl: string;
    version: string;
  }) => void;

  setContextError: (error: string) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isReady: false,
  userId: null,
  userName: null,
  orgName: null,
  orgId: null,
  clientUrl: null,
  version: null,
  contextError: null,

  setContext: (info) =>
    set({
      isReady: true,
      contextError: null,
      userId: info.userId,
      userName: info.userName,
      orgName: info.orgName,
      orgId: info.orgId,
      clientUrl: info.clientUrl,
      version: info.version,
    }),

  setContextError: (error) =>
    set({
      isReady: false,
      contextError: error,
    }),
}));
