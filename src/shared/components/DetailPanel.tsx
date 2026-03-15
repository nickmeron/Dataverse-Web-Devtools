import { useUiStore } from '@/shared/stores/uiStore';
import { useTreeData } from '@/features/tree-view/hooks/useTreeData';
import { useToggleStep, useDeleteStep } from '@/features/steps/hooks/useStepMutations';
import { useDeleteAssembly } from '@/features/assemblies/hooks/useAssemblyMutations';
import { useDeleteImage } from '@/features/images/hooks/useImageMutations';
import { useTraceLogStore } from '@/features/trace-logs/stores/traceLogStore';
import { EmptyState } from './EmptyState';
import {
  MousePointerClick,
  Package,
  Plug,
  Zap,
  Image,
  Globe,
  Cloud,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Plus,
  Upload,
  Loader2,
  ScrollText,
} from 'lucide-react';
import {
  STAGE_LABELS,
  MODE_LABELS,
  ISOLATION_MODE_LABELS,
  SOURCE_TYPE_LABELS,
  SUPPORTED_DEPLOYMENT_LABELS,
  IMAGE_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
  AUTH_TYPE_LABELS,
  MESSAGE_FORMAT_LABELS,
} from '@/config/constants';
import type { TreeNode } from '@/shared/types/dataverse';

export function DetailPanel() {
  const { selectedNode, treeViewMode } = useUiStore();
  const { tree } = useTreeData(treeViewMode);

  if (!selectedNode) {
    return (
      <EmptyState
        icon={<MousePointerClick className="h-6 w-6" />}
        title="Select an item"
        description="Choose a plugin, step, or webhook from the tree to view its details"
      />
    );
  }

  const node = findNode(tree, selectedNode.id);
  if (!node) {
    return (
      <EmptyState
        icon={<MousePointerClick className="h-6 w-6" />}
        title="Item not found"
        description="The selected item may have been removed"
      />
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <NodeDetail node={node} />
    </div>
  );
}

function NodeDetail({ node }: { node: TreeNode }) {
  const data = node.data as unknown as Record<string, unknown>;
  const { openDialog, setActiveView } = useUiStore();
  const traceLogSetFilters = useTraceLogStore((s) => s.setFilters);
  const toggleStep = useToggleStep();
  const deleteStep = useDeleteStep();
  const deleteAssembly = useDeleteAssembly();
  const deleteImage = useDeleteImage();

  const handleViewTraceLogs = () => {
    // Filter trace logs by the plugin type name (step name starts with typename)
    const stepName = String(data.name ?? '');
    const typeName = stepName.includes(':')
      ? stepName.split(':')[0]!.trim()
      : stepName;
    traceLogSetFilters({ typeName });
    setActiveView('traceLogs');
  };

  const icon = {
    assembly: <Package className="h-5 w-5 text-surface-400" />,
    type: <Plug className="h-5 w-5 text-surface-400" />,
    step: (
      <Zap
        className={`h-5 w-5 ${node.isEnabled === false ? 'text-surface-500' : 'text-success'}`}
      />
    ),
    image: <Image className="h-5 w-5 text-surface-400" />,
    webhook: <Globe className="h-5 w-5 text-blue-400" />,
    serviceEndpoint: <Cloud className="h-5 w-5 text-purple-400" />,
  }[node.type];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-surface-100 break-words">
            {node.label}
          </h2>
          {node.sublabel && (
            <p className="mt-0.5 text-sm text-surface-500 break-all">
              {node.sublabel}
            </p>
          )}
        </div>
        {node.type === 'step' && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              node.isEnabled !== false
                ? 'bg-success/10 text-success'
                : 'bg-surface-700 text-surface-400'
            }`}
          >
            {node.isEnabled !== false ? 'Enabled' : 'Disabled'}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Step actions */}
        {node.type === 'step' && (
          <>
            <ActionButton
              icon={<Pencil className="h-3.5 w-3.5" />}
              label="Edit"
              onClick={() =>
                openDialog({ type: 'editStep', stepId: node.id, data })
              }
            />
            <ActionButton
              icon={
                node.isEnabled !== false ? (
                  <ToggleRight className="h-3.5 w-3.5" />
                ) : (
                  <ToggleLeft className="h-3.5 w-3.5" />
                )
              }
              label={node.isEnabled !== false ? 'Disable' : 'Enable'}
              isLoading={toggleStep.isPending}
              onClick={() =>
                toggleStep.mutate({
                  id: node.id,
                  enable: node.isEnabled === false,
                })
              }
            />
            <ActionButton
              icon={<Plus className="h-3.5 w-3.5" />}
              label="Add Image"
              onClick={() =>
                openDialog({ type: 'registerImage', stepId: node.id })
              }
            />
            <ActionButton
              icon={<ScrollText className="h-3.5 w-3.5" />}
              label="Trace Logs"
              onClick={handleViewTraceLogs}
            />
            <ActionButton
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="Delete"
              variant="danger"
              isLoading={deleteStep.isPending}
              onClick={() =>
                openDialog({
                  type: 'confirm',
                  title: 'Delete Step',
                  message: `Are you sure you want to delete "${node.label}"? This will also delete all associated images.`,
                  onConfirm: () => deleteStep.mutate(node.id),
                  variant: 'danger',
                })
              }
            />
          </>
        )}

        {/* Assembly actions */}
        {node.type === 'assembly' && !node.isManaged && (
          <>
            <ActionButton
              icon={<Upload className="h-3.5 w-3.5" />}
              label="Update Assembly"
              onClick={() =>
                openDialog({
                  type: 'updateAssembly',
                  assemblyId: node.id,
                  assemblyName: node.label,
                })
              }
            />
            <ActionButton
              icon={<Plus className="h-3.5 w-3.5" />}
              label="Register Step"
              onClick={() =>
                openDialog({ type: 'registerStep' })
              }
            />
            <ActionButton
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="Delete"
              variant="danger"
              isLoading={deleteAssembly.isPending}
              onClick={() =>
                openDialog({
                  type: 'confirm',
                  title: 'Delete Assembly',
                  message: `Are you sure you want to delete "${node.label}"? This will delete all plugin types, steps, and images within it.`,
                  onConfirm: () => deleteAssembly.mutate(node.id),
                  variant: 'danger',
                })
              }
            />
          </>
        )}

        {/* Plugin Type actions */}
        {node.type === 'type' && (
          <ActionButton
            icon={<Plus className="h-3.5 w-3.5" />}
            label="Register Step"
            onClick={() =>
              openDialog({
                type: 'registerStep',
                pluginTypeId: node.id,
              })
            }
          />
        )}

        {/* Image actions */}
        {node.type === 'image' && (
          <>
            <ActionButton
              icon={<Pencil className="h-3.5 w-3.5" />}
              label="Edit"
              onClick={() =>
                openDialog({ type: 'editImage', imageId: node.id, data })
              }
            />
            <ActionButton
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="Delete"
              variant="danger"
              isLoading={deleteImage.isPending}
              onClick={() =>
                openDialog({
                  type: 'confirm',
                  title: 'Delete Image',
                  message: `Are you sure you want to delete the image "${node.label}"?`,
                  onConfirm: () => deleteImage.mutate(node.id),
                  variant: 'danger',
                })
              }
            />
          </>
        )}
      </div>

      {/* Properties */}
      <div className="rounded-lg border border-surface-700/50 bg-surface-800/30">
        <div className="border-b border-surface-700/50 px-4 py-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            Properties
          </h3>
        </div>
        <div className="divide-y divide-surface-700/30">
          {node.type === 'assembly' && (
            <>
              <PropRow label="Name" value={str(data.name)} />
              <PropRow label="Version" value={str(data.version)} />
              <PropRow
                label="Isolation Mode"
                value={ISOLATION_MODE_LABELS[num(data.isolationmode)]}
              />
              <PropRow
                label="Source Type"
                value={SOURCE_TYPE_LABELS[num(data.sourcetype)]}
              />
              <PropRow
                label="Public Key Token"
                value={str(data.publickeytoken)}
              />
              <PropRow
                label="Culture"
                value={str(data.culture) || 'neutral'}
              />
              <PropRow
                label="Managed"
                value={data.ismanaged ? 'Yes' : 'No'}
              />
              <PropRow label="Description" value={str(data.description)} />
            </>
          )}
          {node.type === 'type' && (
            <>
              <PropRow label="Type Name" value={str(data.typename)} />
              <PropRow label="Name" value={str(data.name)} />
              {str(data.friendlyname) &&
                !isGuid(str(data.friendlyname)!) && (
                  <PropRow
                    label="Friendly Name"
                    value={str(data.friendlyname)}
                  />
                )}
              <PropRow label="Assembly" value={str(data.assemblyname)} />
              <PropRow label="Description" value={str(data.description)} />
            </>
          )}
          {node.type === 'step' && (
            <>
              <PropRow label="Name" value={str(data.name)} />
              <PropRow
                label="Stage"
                value={STAGE_LABELS[num(data.stage)]}
              />
              <PropRow label="Mode" value={MODE_LABELS[num(data.mode)]} />
              <PropRow label="Rank" value={String(data.rank ?? 1)} />
              <PropRow
                label="Supported Deployment"
                value={
                  SUPPORTED_DEPLOYMENT_LABELS[num(data.supporteddeployment)]
                }
              />
              <PropRow
                label="Filtering Attributes"
                value={str(data.filteringattributes)}
              />
              <PropRow
                label="Async Auto Delete"
                value={data.asyncautodelete ? 'Yes' : 'No'}
              />
              <PropRow label="Description" value={str(data.description)} />
              {data.configuration && (
                <PropRow
                  label="Unsecure Config"
                  value={str(data.configuration)}
                  mono
                />
              )}
            </>
          )}
          {node.type === 'image' && (
            <>
              <PropRow label="Name" value={str(data.name)} />
              <PropRow
                label="Image Type"
                value={IMAGE_TYPE_LABELS[num(data.imagetype)]}
              />
              <PropRow
                label="Entity Alias"
                value={str(data.entityalias)}
              />
              <PropRow label="Attributes" value={str(data.attributes)} />
              <PropRow
                label="Message Property"
                value={str(data.messagepropertyname)}
              />
              <PropRow
                label="Image ID"
                value={str(data.sdkmessageprocessingstepimageid)}
                mono
              />
            </>
          )}
          {(node.type === 'webhook' || node.type === 'serviceEndpoint') && (
            <>
              <PropRow label="Name" value={str(data.name)} />
              <PropRow
                label="Contract"
                value={CONTRACT_TYPE_LABELS[num(data.contract)]}
              />
              <PropRow label="URL" value={str(data.url)} />
              <PropRow
                label="Auth Type"
                value={AUTH_TYPE_LABELS[num(data.authtype)] ?? 'None'}
              />
              <PropRow
                label="Message Format"
                value={MESSAGE_FORMAT_LABELS[num(data.messageformat)]}
              />
              <PropRow label="Description" value={str(data.description)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
  isLoading = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
        isLoading
          ? 'cursor-not-allowed opacity-60'
          : variant === 'danger'
            ? 'text-danger hover:bg-danger/10'
            : 'text-surface-300 hover:bg-surface-700'
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        icon
      )}
      {isLoading ? `${label}...` : label}
    </button>
  );
}

function PropRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | undefined;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-4 px-4 py-2.5">
      <dt className="w-40 shrink-0 text-xs font-medium text-surface-400">
        {label}
      </dt>
      <dd
        className={`min-w-0 flex-1 text-sm text-surface-200 break-words ${mono ? 'font-mono text-xs bg-surface-900/50 rounded px-2 py-1' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

function str(val: unknown): string | undefined {
  if (val == null) return undefined;
  const s = String(val);
  return s === 'null' || s === '' ? undefined : s;
}

function num(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

function isGuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}
