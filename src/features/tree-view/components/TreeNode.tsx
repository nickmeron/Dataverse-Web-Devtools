import { memo } from 'react';
import {
  ChevronRight,
  Package,
  Plug,
  Zap,
  Image,
  Globe,
  Cloud,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TreeNode as TreeNodeData } from '@/shared/types/dataverse';
import { useUiStore } from '@/shared/stores/uiStore';

const ICONS = {
  assembly: Package,
  type: Plug,
  step: Zap,
  image: Image,
  webhook: Globe,
  serviceEndpoint: Cloud,
} as const;

interface TreeNodeProps {
  node: TreeNodeData;
  depth: number;
}

export const TreeNodeComponent = memo(function TreeNodeComponent({
  node,
  depth,
}: TreeNodeProps) {
  const { selectedNode, setSelectedNode, expandedNodes, toggleNodeExpanded } =
    useUiStore();

  const isSelected = selectedNode?.id === node.id;
  const isExpanded = expandedNodes.has(node.id) || expandedNodes.has('__all__');
  const hasChildren = node.children.length > 0;
  const Icon = ICONS[node.type];

  const handleClick = () => {
    setSelectedNode({ id: node.id, type: node.type });
    if (hasChildren) {
      toggleNodeExpanded(node.id);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm transition-colors ${
          isSelected
            ? 'bg-accent/10 text-accent'
            : 'text-surface-300 hover:bg-surface-800'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand chevron */}
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {hasChildren ? (
            <ChevronRight
              className={`h-3.5 w-3.5 text-surface-500 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          ) : null}
        </span>

        {/* Icon */}
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${
            node.type === 'step'
              ? node.isEnabled === false
                ? 'text-surface-500'
                : 'text-success'
              : node.type === 'webhook'
                ? 'text-blue-400'
                : node.type === 'serviceEndpoint'
                  ? 'text-purple-400'
                  : 'text-surface-400'
          }`}
        />

        {/* Label */}
        <span className="min-w-0 flex-1 truncate">
          {node.label}
        </span>

        {/* Badge: child count */}
        {hasChildren && (
          <span className="shrink-0 rounded-full bg-surface-700/50 px-1.5 text-[10px] tabular-nums text-surface-500">
            {node.children.length}
          </span>
        )}

        {/* Disabled indicator */}
        {node.type === 'step' && node.isEnabled === false && (
          <span className="shrink-0 rounded-full bg-surface-700 px-1.5 text-[10px] text-surface-500">
            off
          </span>
        )}
      </button>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
