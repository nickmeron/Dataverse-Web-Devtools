import { useMemo } from 'react';
import {
  useAssemblies,
  usePluginTypes,
  useSteps,
  useStepImages,
  useServiceEndpoints,
  useWebhookSteps,
} from './useRegistrationData';
import type {
  TreeNode,
  PluginAssembly,
  PluginType,
  SdkMessageProcessingStep,
  SdkMessageProcessingStepImage,
  ServiceEndpoint,
} from '@/shared/types/dataverse';
import { STAGE_LABELS, MODE_LABELS, IMAGE_TYPE_LABELS, CONTRACT_TYPE } from '@/config/constants';
import type { TreeViewMode } from '@/shared/stores/uiStore';

export function useTreeData(viewMode: TreeViewMode) {
  const assemblies = useAssemblies();
  const pluginTypes = usePluginTypes();
  const steps = useSteps();
  const images = useStepImages();
  const serviceEndpoints = useServiceEndpoints();
  const webhookSteps = useWebhookSteps();

  const isLoading =
    assemblies.isLoading ||
    pluginTypes.isLoading ||
    steps.isLoading ||
    images.isLoading ||
    serviceEndpoints.isLoading ||
    webhookSteps.isLoading;

  const error =
    assemblies.error ||
    pluginTypes.error ||
    steps.error ||
    images.error ||
    serviceEndpoints.error ||
    webhookSteps.error;

  const tree = useMemo(() => {
    if (
      !assemblies.data ||
      !pluginTypes.data ||
      !steps.data ||
      !images.data ||
      !serviceEndpoints.data ||
      !webhookSteps.data
    )
      return [];

    if (viewMode === 'byAssembly') {
      return buildByAssemblyTree(
        assemblies.data,
        pluginTypes.data,
        steps.data,
        images.data,
        serviceEndpoints.data,
        webhookSteps.data,
      );
    }
    if (viewMode === 'byEntity') {
      return buildByEntityTree(steps.data, images.data);
    }
    return buildByMessageTree(steps.data, images.data);
  }, [
    assemblies.data,
    pluginTypes.data,
    steps.data,
    images.data,
    serviceEndpoints.data,
    webhookSteps.data,
    viewMode,
  ]);

  return { tree, isLoading, error };
}

// Use `as unknown as TreeNode['data']` for all data assignments since
// TreeNode['data'] is a union and the API returns partial shapes

function imageNodes(
  stepId: string,
  allImages: SdkMessageProcessingStepImage[],
): TreeNode[] {
  return allImages
    .filter((img) => img._sdkmessageprocessingstepid_value === stepId)
    .map((img) => ({
      id: img.sdkmessageprocessingstepimageid,
      type: 'image' as const,
      label: img.name || img.entityalias,
      sublabel: IMAGE_TYPE_LABELS[img.imagetype] ?? 'Image',
      children: [],
      data: img as unknown as TreeNode['data'],
    }));
}

function stepLabel(step: { name: string; stage: number; mode: number }): string {
  const stage = STAGE_LABELS[step.stage] ?? `Stage ${step.stage}`;
  const mode = MODE_LABELS[step.mode] ?? '';
  return `${step.name || 'Step'} [${mode} ${stage}]`;
}

function buildByAssemblyTree(
  assemblies: PluginAssembly[],
  pluginTypes: PluginType[],
  steps: SdkMessageProcessingStep[],
  images: SdkMessageProcessingStepImage[],
  serviceEndpoints: ServiceEndpoint[],
  webhookSteps: SdkMessageProcessingStep[],
): TreeNode[] {
  const tree: TreeNode[] = [];

  for (const asm of assemblies) {
    const typesForAsm = pluginTypes.filter(
      (t) => t._pluginassemblyid_value === asm.pluginassemblyid,
    );

    const typeNodes: TreeNode[] = typesForAsm.map((pt) => {
      const stepsForType = steps.filter(
        (s) => s._plugintypeid_value === pt.plugintypeid,
      );

      const stepNodes: TreeNode[] = stepsForType.map((s) => ({
        id: s.sdkmessageprocessingstepid,
        type: 'step' as const,
        label: stepLabel(s),
        isEnabled: s.statecode === 0,
        children: imageNodes(s.sdkmessageprocessingstepid, images),
        data: s as unknown as TreeNode['data'],
      }));

      return {
        id: pt.plugintypeid,
        type: 'type' as const,
        label: pt.typename.split('.').pop() ?? pt.typename,
        sublabel: pt.typename,
        children: stepNodes,
        data: pt as unknown as TreeNode['data'],
      };
    });

    tree.push({
      id: asm.pluginassemblyid,
      type: 'assembly' as const,
      label: `${asm.name} v${asm.version}`,
      isManaged: asm.ismanaged,
      children: typeNodes,
      data: asm as unknown as TreeNode['data'],
    });
  }

  for (const ep of serviceEndpoints) {
    const epSteps = webhookSteps.filter(
      (s) => s._eventhandler_value === ep.serviceendpointid,
    );
    const isWebhook = ep.contract === CONTRACT_TYPE.WEBHOOK;

    const stepNodes: TreeNode[] = epSteps.map((s) => ({
      id: s.sdkmessageprocessingstepid,
      type: 'step' as const,
      label: stepLabel(s),
      isEnabled: s.statecode === 0,
      children: [],
      data: s as unknown as TreeNode['data'],
    }));

    tree.push({
      id: ep.serviceendpointid,
      type: isWebhook ? ('webhook' as const) : ('serviceEndpoint' as const),
      label: ep.name,
      sublabel: isWebhook ? 'Webhook' : 'Service Endpoint',
      children: stepNodes,
      data: ep as unknown as TreeNode['data'],
    });
  }

  return tree;
}

function buildByEntityTree(
  steps: SdkMessageProcessingStep[],
  images: SdkMessageProcessingStepImage[],
): TreeNode[] {
  const byEntity = new Map<string, SdkMessageProcessingStep[]>();

  for (const step of steps) {
    const match = step.name.match(/of\s+(\w+)/i);
    const entity = match?.[1] ?? 'none';
    if (!byEntity.has(entity)) byEntity.set(entity, []);
    byEntity.get(entity)!.push(step);
  }

  return Array.from(byEntity.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([entity, entitySteps]) => ({
      id: `entity-${entity}`,
      type: 'assembly' as const,
      label: entity,
      sublabel: `${entitySteps.length} step${entitySteps.length !== 1 ? 's' : ''}`,
      children: entitySteps.map((s) => ({
        id: s.sdkmessageprocessingstepid,
        type: 'step' as const,
        label: stepLabel(s),
        isEnabled: s.statecode === 0,
        children: imageNodes(s.sdkmessageprocessingstepid, images),
        data: s as unknown as TreeNode['data'],
      })),
      data: entitySteps[0] as unknown as TreeNode['data'],
    }));
}

function buildByMessageTree(
  steps: SdkMessageProcessingStep[],
  images: SdkMessageProcessingStepImage[],
): TreeNode[] {
  const byMessage = new Map<string, SdkMessageProcessingStep[]>();

  for (const step of steps) {
    const match = step.name.match(/:\s*(\w+)/);
    const message = match?.[1] ?? 'Unknown';
    if (!byMessage.has(message)) byMessage.set(message, []);
    byMessage.get(message)!.push(step);
  }

  return Array.from(byMessage.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([message, msgSteps]) => ({
      id: `message-${message}`,
      type: 'assembly' as const,
      label: message,
      sublabel: `${msgSteps.length} step${msgSteps.length !== 1 ? 's' : ''}`,
      children: msgSteps.map((s) => ({
        id: s.sdkmessageprocessingstepid,
        type: 'step' as const,
        label: stepLabel(s),
        isEnabled: s.statecode === 0,
        children: imageNodes(s.sdkmessageprocessingstepid, images),
        data: s as unknown as TreeNode['data'],
      })),
      data: msgSteps[0] as unknown as TreeNode['data'],
    }));
}
