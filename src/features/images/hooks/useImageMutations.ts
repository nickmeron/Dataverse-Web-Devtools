import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataverseClient } from '@/shared/api/dataverseClient';
import { endpoints } from '@/shared/api/endpoints';
import toast from 'react-hot-toast';

interface CreateImagePayload {
  imagetype: number;
  name: string;
  entityalias: string;
  messagepropertyname: string;
  attributes?: string;
  'sdkmessageprocessingstepid@odata.bind': string;
}

interface UpdateImagePayload {
  imagetype?: number;
  name?: string;
  entityalias?: string;
  messagepropertyname?: string;
  attributes?: string | null;
}

export function useCreateImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateImagePayload) =>
      dataverseClient.post(endpoints.images.list, payload),
    onSuccess: () => {
      toast.success('Image registered successfully');
      qc.invalidateQueries({ queryKey: ['stepImages'] });
    },
    onError: (err) => {
      toast.error(`Failed to register image: ${err.message}`);
    },
  });
}

export function useUpdateImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateImagePayload;
    }) => dataverseClient.patch(endpoints.images.detail(id), payload),
    onSuccess: () => {
      toast.success('Image updated successfully');
      qc.invalidateQueries({ queryKey: ['stepImages'] });
    },
    onError: (err) => {
      toast.error(`Failed to update image: ${err.message}`);
    },
  });
}

export function useDeleteImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      dataverseClient.delete(endpoints.images.detail(id)),
    onSuccess: () => {
      toast.success('Image deleted');
      qc.invalidateQueries({ queryKey: ['stepImages'] });
    },
    onError: (err) => {
      toast.error(`Failed to delete image: ${err.message}`);
    },
  });
}
