import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataverseClient } from '@/shared/api/dataverseClient';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/queryKeys';
import { useUiStore } from '@/shared/stores/uiStore';
import toast from 'react-hot-toast';

interface UpdatePluginTypePayload {
  friendlyname?: string;
  description?: string | null;
  workflowactivitygroupname?: string | null;
}

export function useUpdatePluginType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePluginTypePayload;
    }) => dataverseClient.patch(endpoints.pluginTypes.detail(id), payload),
    onSuccess: () => {
      toast.success('Plugin type updated');
      qc.invalidateQueries({ queryKey: ['pluginTypes'] });
    },
    onError: (err) => {
      toast.error(`Failed to update plugin type: ${err.message}`);
    },
  });
}

export function useDeletePluginType() {
  const qc = useQueryClient();
  const { selectedNode, setSelectedNode } = useUiStore();

  return useMutation({
    mutationFn: (id: string) =>
      dataverseClient.delete(endpoints.pluginTypes.detail(id)),
    onSuccess: (_, typeId) => {
      toast.success('Plugin type unregistered');
      qc.invalidateQueries({ queryKey: ['pluginTypes'] });
      qc.invalidateQueries({ queryKey: queryKeys.steps.all });
      if (selectedNode?.id === typeId) {
        setSelectedNode(null);
      }
    },
    onError: (err) => {
      toast.error(`Failed to unregister plugin type: ${err.message}`);
    },
  });
}
