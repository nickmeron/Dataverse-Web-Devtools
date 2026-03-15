import {
  RefreshCw,
  Plus,
  ChevronDown,
  Sun,
  Moon,
  User,
  Settings,
  Zap,
  Package,
  Image,
  ScrollText,
  Puzzle,
  Globe,
  Cloud,
} from 'lucide-react';
import { useUiStore, type TreeViewMode } from '@/shared/stores/uiStore';
import { useAuthStore } from '@/shared/stores/authStore';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';

const VIEW_MODE_LABELS: Record<TreeViewMode, string> = {
  byAssembly: 'By Assembly',
  byEntity: 'By Entity',
  byMessage: 'By Message',
};

export function CommandBar() {
  const {
    theme,
    toggleTheme,
    treeViewMode,
    setTreeViewMode,
    openDialog,
    treeSearchQuery,
    setTreeSearchQuery,
    activeView,
    setActiveView,
  } = useUiStore();
  const { userName, orgName } = useAuthStore();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();

  const [showRegisterMenu, setShowRegisterMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const registerMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        registerMenuRef.current &&
        !registerMenuRef.current.contains(e.target as Node)
      ) {
        setShowRegisterMenu(false);
      }
      if (
        viewMenuRef.current &&
        !viewMenuRef.current.contains(e.target as Node)
      ) {
        setShowViewMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const isRegistrations = activeView === 'registrations';

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-surface-700/50 bg-surface-800/80 px-3 backdrop-blur-sm">
      {/* Left section: View toggle tabs */}
      <div className="flex items-center gap-0.5 rounded-md border border-surface-700/50 bg-surface-900/50 p-0.5">
        <button
          onClick={() => setActiveView('registrations')}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            isRegistrations
              ? 'bg-surface-700 text-surface-100'
              : 'text-surface-500 hover:text-surface-300'
          }`}
        >
          <Puzzle className="h-3.5 w-3.5" />
          Registrations
        </button>
        <button
          onClick={() => setActiveView('traceLogs')}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            !isRegistrations
              ? 'bg-surface-700 text-surface-100'
              : 'text-surface-500 hover:text-surface-300'
          }`}
        >
          <ScrollText className="h-3.5 w-3.5" />
          Trace Logs
        </button>
      </div>

      <div className="mx-1 h-4 w-px bg-surface-700" />

      {/* Registration-specific actions */}
      {isRegistrations && (
        <div className="flex items-center gap-1">
          {/* Register dropdown */}
          <div ref={registerMenuRef} className="relative">
            <button
              onClick={() => setShowRegisterMenu(!showRegisterMenu)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-surface-200 transition-colors hover:bg-surface-700"
              title="Register new..."
            >
              <Plus className="h-4 w-4" />
              Register
              <ChevronDown className="h-3 w-3 text-surface-400" />
            </button>
            {showRegisterMenu && (
              <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-surface-700 bg-surface-800 py-1 shadow-xl">
                <button
                  onClick={() => {
                    setShowRegisterMenu(false);
                    openDialog({ type: 'registerStep' });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-surface-300 transition-colors hover:bg-surface-700"
                >
                  <Zap className="h-4 w-4 text-success" />
                  New Step
                </button>
                <button
                  onClick={() => {
                    setShowRegisterMenu(false);
                    openDialog({ type: 'uploadAssembly' });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-surface-300 transition-colors hover:bg-surface-700"
                >
                  <Package className="h-4 w-4 text-surface-400" />
                  New Assembly
                </button>
                <div className="mx-2 my-1 border-t border-surface-700/50" />
                <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-surface-500">
                  Endpoints
                </p>
                <button
                  onClick={() => {
                    setShowRegisterMenu(false);
                    openDialog({ type: 'registerWebhook' });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-surface-300 transition-colors hover:bg-surface-700"
                >
                  <Globe className="h-4 w-4 text-blue-400" />
                  New Webhook
                </button>
                <button
                  onClick={() => {
                    setShowRegisterMenu(false);
                    openDialog({ type: 'registerServiceEndpoint' });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-surface-300 transition-colors hover:bg-surface-700"
                >
                  <Cloud className="h-4 w-4 text-purple-400" />
                  New Service Endpoint
                </button>
                <div className="mx-2 my-1 border-t border-surface-700/50" />
                <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-surface-500">
                  Context actions
                </p>
                <button
                  onClick={() => setShowRegisterMenu(false)}
                  disabled
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-surface-500 transition-colors"
                  title="Select a step first, then add an image from the detail panel"
                >
                  <Image className="h-4 w-4" />
                  New Image (select step first)
                </button>
              </div>
            )}
          </div>

          <div className="mx-1 h-4 w-px bg-surface-700" />

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="rounded-md p-1.5 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200"
            title="Refresh all data"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching > 0 ? 'animate-spin' : ''}`}
            />
          </button>

          <div className="mx-1 h-4 w-px bg-surface-700" />

          {/* View mode picker */}
          <div ref={viewMenuRef} className="relative">
            <button
              onClick={() => setShowViewMenu(!showViewMenu)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700"
            >
              View: {VIEW_MODE_LABELS[treeViewMode]}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showViewMenu && (
              <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-lg border border-surface-700 bg-surface-800 py-1 shadow-xl">
                {(
                  Object.entries(VIEW_MODE_LABELS) as [TreeViewMode, string][]
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setTreeViewMode(mode);
                      setShowViewMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-surface-700 ${
                      mode === treeViewMode
                        ? 'text-accent'
                        : 'text-surface-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trace Logs: refresh */}
      {!isRegistrations && (
        <button
          onClick={handleRefresh}
          className="rounded-md p-1.5 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200"
          title="Refresh trace logs"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching > 0 ? 'animate-spin' : ''}`}
          />
        </button>
      )}

      {/* Center: Functional search (registrations only) */}
      {isRegistrations && (
        <div className="mx-4 flex max-w-sm flex-1 items-center gap-2 rounded-md border border-surface-700/50 bg-surface-900/50 px-3 py-1.5">
          <svg
            className="h-3.5 w-3.5 text-surface-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={treeSearchQuery}
            onChange={(e) => setTreeSearchQuery(e.target.value)}
            placeholder="Search registrations..."
            className="flex-1 bg-transparent text-xs text-surface-200 placeholder:text-surface-500 outline-none"
          />
          {treeSearchQuery && (
            <button
              onClick={() => setTreeSearchQuery('')}
              className="text-surface-500 hover:text-surface-300"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Spacer for trace logs view */}
      {!isRegistrations && <div className="flex-1" />}

      {/* Right section: user info + settings */}
      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-md p-1.5 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Session Details */}
        <button
          onClick={() => openDialog({ type: 'sessionDetails' })}
          className="rounded-md p-1.5 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200"
          title="Session details"
        >
          <Settings className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-px bg-surface-700" />

        {/* User indicator */}
        <div className="flex items-center gap-2 pl-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="max-w-[140px] truncate text-xs font-medium text-surface-200">
              {userName ?? 'User'}
            </span>
            {orgName && (
              <span className="max-w-[140px] truncate text-[10px] text-surface-500">
                {orgName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
