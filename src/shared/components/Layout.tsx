import { CommandBar } from './CommandBar';
import { SplitPane } from './SplitPane';
import { RegistrationTree } from '@/features/tree-view/components/RegistrationTree';
import { DetailPanel } from './DetailPanel';
import { TraceLogViewer } from '@/features/trace-logs/components/TraceLogViewer';
import { useUiStore } from '@/shared/stores/uiStore';

export function AppLayout() {
  const activeView = useUiStore((s) => s.activeView);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <CommandBar />
      <div className="min-h-0 flex-1">
        {activeView === 'registrations' ? (
          <SplitPane
            left={
              <div className="flex h-full flex-col overflow-hidden border-r border-surface-700/50 bg-surface-900">
                <RegistrationTree />
              </div>
            }
            right={
              <div className="h-full overflow-auto bg-surface-900/50">
                <DetailPanel />
              </div>
            }
          />
        ) : (
          <div className="h-full bg-surface-900/50">
            <TraceLogViewer />
          </div>
        )}
      </div>
      <div className="flex h-6 shrink-0 items-center justify-end border-t border-surface-700/50 bg-surface-800/60 px-3">
        <span className="text-[10px] text-surface-500">
          Built by Nir Meron
        </span>
      </div>
    </div>
  );
}
