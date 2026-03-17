import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataverseClient } from '@/shared/api/dataverseClient';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/queryKeys';
import { useUiStore } from '@/shared/stores/uiStore';
import toast from 'react-hot-toast';

interface CreateStepPayload {
  name: string;
  stage: number;
  mode: number;
  rank: number;
  supporteddeployment: number;
  filteringattributes?: string;
  asyncautodelete: boolean;
  configuration?: string;
  description?: string;
  /** Bind to plugin type: /plugintypes(guid) — required for plugin steps */
  'plugintypeid@odata.bind'?: string;
  /** Bind to service endpoint (webhook/service bus): /serviceendpoints(guid) — required for endpoint steps */
  'eventhandler@odata.bind'?: string;
  /** Bind to message: /sdkmessages(guid) */
  'sdkmessageid@odata.bind': string;
  /** Bind to message filter: /sdkmessagefilters(guid) */
  'sdkmessagefilterid@odata.bind'?: string;
  /** Bind to impersonation user: /systemusers(guid) */
  'impersonatinguserid@odata.bind'?: string;
  /** Bind to secure config: /sdkmessageprocessingstepsecureconfigs(guid) */
  'sdkmessageprocessingstepsecureconfigid@odata.bind'?: string;
}

interface UpdateStepPayload {
  name?: string;
  stage?: number;
  mode?: number;
  rank?: number;
  supporteddeployment?: number;
  filteringattributes?: string | null;
  asyncautodelete?: boolean;
  configuration?: string | null;
  description?: string | null;
  'sdkmessageid@odata.bind'?: string;
  'sdkmessagefilterid@odata.bind'?: string | null;
  'impersonatinguserid@odata.bind'?: string | null;
  'sdkmessageprocessingstepsecureconfigid@odata.bind'?: string | null;
}

export function useCreateStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStepPayload) =>
      dataverseClient.post(endpoints.steps.list, payload),
    onSuccess: () => {
      toast.success('Step registered successfully');
      qc.invalidateQueries({ queryKey: queryKeys.steps.all });
      qc.invalidateQueries({ queryKey: queryKeys.webhooks.all });
    },
    onError: (err) => {
      toast.error(`Failed to register step: ${err.message}`);
    },
  });
}

export function useUpdateStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStepPayload }) =>
      dataverseClient.patch(endpoints.steps.detail(id), payload),
    onSuccess: () => {
      toast.success('Step updated successfully');
      qc.invalidateQueries({ queryKey: queryKeys.steps.all });
      qc.invalidateQueries({ queryKey: queryKeys.webhooks.all });
    },
    onError: (err) => {
      toast.error(`Failed to update step: ${err.message}`);
    },
  });
}

export function useDeleteStep() {
  const qc = useQueryClient();
  const { selectedNode, setSelectedNode } = useUiStore();

  return useMutation({
    mutationFn: (id: string) =>
      dataverseClient.delete(endpoints.steps.detail(id)),
    onSuccess: (_, stepId) => {
      toast.success('Step deleted');

      // Immediately remove the deleted step from the cache for instant UI update
      qc.setQueryData(queryKeys.steps.all, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter(
          (step: any) => step.sdkmessageprocessingstepid !== stepId,
        );
      });

      qc.setQueryData(queryKeys.webhooks.all, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter(
          (step: any) => step.sdkmessageprocessingstepid !== stepId,
        );
      });

      // Also remove associated step images immediately
      qc.setQueryData(['stepImages'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter(
          (img: any) => img._sdkmessageprocessingstepid_value !== stepId,
        );
      });

      // Clear selected node if the deleted step was selected
      if (selectedNode?.id === stepId) {
        setSelectedNode(null);
      }
    },
    onError: (err) => {
      toast.error(`Failed to delete step: ${err.message}`);
    },
  });
}

export function useToggleStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      dataverseClient.patch(endpoints.steps.detail(id), {
        statecode: enable ? 0 : 1,
        statuscode: enable ? 1 : 2,
      }),
    onSuccess: (_, { enable }) => {
      toast.success(enable ? 'Step enabled' : 'Step disabled');
      qc.invalidateQueries({ queryKey: queryKeys.steps.all });
      qc.invalidateQueries({ queryKey: queryKeys.webhooks.all });
    },
    onError: (err) => {
      toast.error(`Failed to toggle step: ${err.message}`);
    },
  });
}
