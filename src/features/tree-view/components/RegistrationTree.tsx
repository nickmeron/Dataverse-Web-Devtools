import { useTreeData } from '@/features/tree-view/hooks/useTreeData';
import { TreeNodeComponent } from './TreeNode';
import { useUiStore } from '@/shared/stores/uiStore';
import { Search, AlertCircle, Inbox, ChevronDown, ChevronRight, Package, Globe, Cloud } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { TreeNode } from '@/shared/types/dataverse';

type TypeFilter = 'assembly' | 'webhook' | 'serviceEndpoint';

export function RegistrationTree() {
  const { treeViewMode, treeSearchQuery, setTreeSearchQuery, expandAll, collapseAll } =
    useUiStore();
  const { tree, isLoading, error } = useTreeData(treeViewMode);
  const [activeFilters, setActiveFilters] = useState<Set<TypeFilter>>(new Set());

  const toggleFilter = (f: TypeFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let nodes = tree;

    // Type filter — only active when at least one type is selected
    if (activeFilters.size > 0) {
      nodes = nodes.filter((n) => {
        if (n.type === 'assembly') return activeFilters.has('assembly');
        if (n.type === 'webhook') return activeFilters.has('webhook');
        if (n.type === 'serviceEndpoint') return activeFilters.has('serviceEndpoint');
        return true;
      });
    }

    if (!treeSearchQuery.trim()) return nodes;
    return filterTree(nodes, treeSearchQuery.toLowerCase());
  }, [tree, treeSearchQuery, activeFilters]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <AlertCircle className="h-8 w-8 text-danger" />
        <p className="text-sm font-medium text-surface-200">Failed to load data</p>
        <p className="text-xs text-surface-500">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search + controls */}
      <div className="shrink-0 border-b border-surface-700/50 p-2 space-y-1.5">
        <div className="flex items-center gap-1.5 rounded-md border border-surface-700/50 bg-surface-800 px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-surface-500" />
          <input
            type="text"
            value={treeSearchQuery}
            onChange={(e) => setTreeSearchQuery(e.target.value)}
            placeholder="Filter tree..."
            className="flex-1 bg-transparent text-xs text-surface-200 placeholder:text-surface-500 outline-none"
          />
        </div>

        {/* Type filter toggles */}
        <div className="flex items-center gap-1">
          <FilterToggle
            active={activeFilters.has('assembly')}
            onClick={() => toggleFilter('assembly')}
            icon={<Package className="h-3 w-3" />}
            label="Plugins"
            color="text-surface-400"
          />
          <FilterToggle
            active={activeFilters.has('webhook')}
            onClick={() => toggleFilter('webhook')}
            icon={<Globe className="h-3 w-3" />}
            label="Webhooks"
            color="text-blue-400"
          />
          <FilterToggle
            active={activeFilters.has('serviceEndpoint')}
            onClick={() => toggleFilter('serviceEndpoint')}
            icon={<Cloud className="h-3 w-3" />}
            label="Endpoints"
            color="text-purple-400"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-surface-500 hover:bg-surface-800 hover:text-surface-300"
          >
            <ChevronDown className="h-3 w-3" />
            Expand
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-surface-500 hover:bg-surface-800 hover:text-surface-300"
          >
            <ChevronRight className="h-3 w-3" />
            Collapse
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-1">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded bg-surface-700 animate-pulse" />
                <div
                  className="h-3 rounded bg-surface-700 animate-pulse"
                  style={{ width: `${60 + (i * 17) % 80}px` }}
                />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <Inbox className="h-8 w-8 text-surface-600" />
            <p className="text-xs text-surface-500">
              {treeSearchQuery || activeFilters.size > 0
                ? 'No matches found'
                : 'No registrations found'}
            </p>
          </div>
        ) : (
          filtered.map((node) => (
            <TreeNodeComponent key={node.id} node={node} depth={0} />
          ))
        )}
      </div>
    </div>
  );
}

function FilterToggle({
  active,
  onClick,
  icon,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors ${
        active
          ? 'bg-surface-700 text-surface-100'
          : `text-surface-500 hover:bg-surface-800 hover:text-surface-300`
      } ${active ? color : ''}`}
    >
      {icon}
      {label}
    </button>
  );
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const result: TreeNode[] = [];
  for (const node of nodes) {
    const matchesSelf =
      node.label.toLowerCase().includes(query) ||
      (node.sublabel?.toLowerCase().includes(query) ?? false);
    const filteredChildren = filterTree(node.children, query);
    if (matchesSelf || filteredChildren.length > 0) {
      result.push({ ...node, children: matchesSelf ? node.children : filteredChildren });
    }
  }
  return result;
}
