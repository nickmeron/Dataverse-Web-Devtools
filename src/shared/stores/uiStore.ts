import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TreeNodeType } from '@/shared/types/dataverse';

export type TreeViewMode = 'byAssembly' | 'byEntity' | 'byMessage';
export type AppView = 'registrations' | 'traceLogs';

interface SelectedNode {
  id: string;
  type: TreeNodeType;
}

/** All dialogs that can be opened from anywhere in the app */
export type DialogType =
  | { type: 'registerStep'; pluginTypeId?: string; eventHandlerId?: string; eventHandlerName?: string }
  | { type: 'editStep'; stepId: string; data: Record<string, unknown> }
  | { type: 'uploadAssembly' }
  | { type: 'updateAssembly'; assemblyId: string; assemblyName: string }
  | { type: 'registerImage'; stepId: string }
  | { type: 'editImage'; imageId: string; data: Record<string, unknown> }
  | { type: 'registerWebhook'; templateData?: Record<string, unknown> }
  | { type: 'editWebhook'; endpointId: string; data: Record<string, unknown> }
  | { type: 'registerServiceEndpoint'; templateData?: Record<string, unknown> }
  | { type: 'editServiceEndpoint'; endpointId: string; data: Record<string, unknown> }
  | { type: 'sessionDetails' }
  | {
      type: 'confirm';
      title: string;
      message: string;
      onConfirm: () => void;
      variant?: 'danger' | 'default';
    };

interface UiState {
  // App-level view toggle
  activeView: AppView;
  setActiveView: (view: AppView) => void;

  // Selected node in tree
  selectedNode: SelectedNode | null;
  setSelectedNode: (node: SelectedNode | null) => void;

  // Tree view mode
  treeViewMode: TreeViewMode;
  setTreeViewMode: (mode: TreeViewMode) => void;

  // Tree search
  treeSearchQuery: string;
  setTreeSearchQuery: (query: string) => void;

  // Expanded tree nodes
  expandedNodes: Set<string>;
  toggleNodeExpanded: (id: string) => void;
  setNodeExpanded: (id: string, expanded: boolean) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Dialog management
  activeDialog: DialogType | null;
  openDialog: (dialog: DialogType) => void;
  closeDialog: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeView: 'registrations' as AppView,
      setActiveView: (view: AppView) => set({ activeView: view }),

      selectedNode: null,
      setSelectedNode: (node) => set({ selectedNode: node }),

      treeViewMode: 'byAssembly',
      setTreeViewMode: (mode) => set({ treeViewMode: mode }),

      treeSearchQuery: '',
      setTreeSearchQuery: (query) => set({ treeSearchQuery: query }),

      expandedNodes: new Set<string>(),
      toggleNodeExpanded: (id) =>
        set((state) => {
          const next = new Set(state.expandedNodes);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return { expandedNodes: next };
        }),
      setNodeExpanded: (id, expanded) =>
        set((state) => {
          const next = new Set(state.expandedNodes);
          if (expanded) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return { expandedNodes: next };
        }),
      expandAll: () => set({ expandedNodes: new Set<string>(['__all__']) }),
      collapseAll: () => set({ expandedNodes: new Set<string>() }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      theme: 'light',
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      activeDialog: null,
      openDialog: (dialog) => set({ activeDialog: dialog }),
      closeDialog: () => set({ activeDialog: null }),
    }),
    {
      name: 'dvdt-ui-store',
      partialize: (state) => ({
        treeViewMode: state.treeViewMode,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
);
