import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataverseClient } from '@/shared/api/dataverseClient';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/queryKeys';
import toast from 'react-hot-toast';

interface CreateServiceEndpointPayload {
  name: string;
  contract: number;
  url?: string;
  authtype?: number | null;
  authvalue?: string;
  messageformat: number;
  description?: string;
  namespaceaddress?: string;
  path?: string;
  saskeyname?: string;
  saskey?: string;
  sastoken?: string;
  userclaim?: number;
}

interface UpdateServiceEndpointPayload {
  id: string;
  data: Partial<CreateServiceEndpointPayload>;
}

export function useCreateServiceEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateServiceEndpointPayload) =>
      dataverseClient.post(endpoints.serviceEndpoints.list, payload),
    onSuccess: () => {
      toast.success('Service endpoint registered');
      qc.invalidateQueries({ queryKey: queryKeys.serviceEndpoints.all });
      qc.invalidateQueries({ queryKey: queryKeys.webhooks.all });
    },
    onError: (err) => {
      toast.error(`Failed to register: ${err.message}`);
    },
  });
}

export function useUpdateServiceEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateServiceEndpointPayload) =>
      dataverseClient.patch(endpoints.serviceEndpoints.detail(id), data),
    onSuccess: () => {
      toast.success('Service endpoint updated');
      qc.invalidateQueries({ queryKey: queryKeys.serviceEndpoints.all });
      qc.invalidateQueries({ queryKey: queryKeys.webhooks.all });
    },
    onError: (err) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });
}

export function useDeleteServiceEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      dataverseClient.delete(endpoints.serviceEndpoints.detail(id)),
    onSuccess: () => {
      toast.success('Service endpoint deleted');
      qc.invalidateQueries({ queryKey: queryKeys.serviceEndpoints.all });
      qc.invalidateQueries({ queryKey: queryKeys.webhooks.all });
    },
    onError: (err) => {
      toast.error(`Failed to delete: ${err.message}`);
    },
  });
}
