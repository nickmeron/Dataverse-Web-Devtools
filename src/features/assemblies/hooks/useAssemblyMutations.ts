import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataverseClient } from '@/shared/api/dataverseClient';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/queryKeys';
import toast from 'react-hot-toast';

interface UploadAssemblyPayload {
  content: string; // base64 DLL bytes
  isolationmode: number;
  sourcetype: number;
  description?: string;
}

export function useUploadAssembly() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadAssemblyPayload) =>
      dataverseClient.post(endpoints.assemblies.list, payload),
    onSuccess: () => {
      toast.success('Assembly uploaded successfully');
      qc.invalidateQueries({ queryKey: queryKeys.assemblies.all });
      qc.invalidateQueries({ queryKey: ['pluginTypes'] });
    },
    onError: (err) => {
      toast.error(`Failed to upload assembly: ${err.message}`);
    },
  });
}

interface UpdateAssemblyPayload {
  /** base64 DLL bytes — only sent when replacing the binary */
  content?: string;
  isolationmode?: number;
  sourcetype?: number;
  description?: string | null;
}

export function useUpdateAssembly() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAssemblyPayload }) =>
      dataverseClient.patch(endpoints.assemblies.detail(id), payload),
    onSuccess: () => {
      toast.success('Assembly updated successfully');
      qc.invalidateQueries({ queryKey: queryKeys.assemblies.all });
      qc.invalidateQueries({ queryKey: ['pluginTypes'] });
    },
    onError: (err) => {
      toast.error(`Failed to update assembly: ${err.message}`);
    },
  });
}

export function useDeleteAssembly() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      dataverseClient.delete(endpoints.assemblies.detail(id)),
    onSuccess: () => {
      toast.success('Assembly deleted');
      qc.invalidateQueries({ queryKey: queryKeys.assemblies.all });
      qc.invalidateQueries({ queryKey: ['pluginTypes'] });
      qc.invalidateQueries({ queryKey: queryKeys.steps.all });
    },
    onError: (err) => {
      toast.error(`Failed to delete assembly: ${err.message}`);
    },
  });
}
