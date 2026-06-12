import { useState } from 'react';
import {
  Dialog,
  DialogFooter,
  FormField,
  FormInput,
  FormTextarea,
} from '@/shared/components/Dialog';
import { useUpdatePluginType } from '../hooks/usePluginTypeMutations';

interface PluginTypeEditDialogProps {
  typeId: string;
  /** Current plugin type record, used to prefill editable properties */
  initialData?: Record<string, unknown>;
  onClose: () => void;
}

export function PluginTypeEditDialog({
  typeId,
  initialData,
  onClose,
}: PluginTypeEditDialogProps) {
  const [friendlyName, setFriendlyName] = useState(
    String(initialData?.friendlyname ?? ''),
  );
  const [description, setDescription] = useState(
    String(initialData?.description ?? ''),
  );

  const updateMutation = useUpdatePluginType();

  const handleSubmit = () => {
    updateMutation.mutate(
      {
        id: typeId,
        payload: {
          ...(friendlyName ? { friendlyname: friendlyName } : {}),
          description: description || null,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Edit Plugin Type"
      description={String(initialData?.typename ?? '')}
    >
      <div className="space-y-4">
        <FormField label="Type Name" hint="Defined by the assembly — read only">
          <FormInput
            value={String(initialData?.typename ?? '')}
            onChange={() => {}}
            disabled
          />
        </FormField>

        <FormField label="Friendly Name">
          <FormInput
            value={friendlyName}
            onChange={setFriendlyName}
            placeholder="Display name for this plugin type..."
          />
        </FormField>

        <FormField label="Description">
          <FormTextarea
            value={description}
            onChange={setDescription}
            placeholder="Optional description..."
            rows={2}
          />
        </FormField>
      </div>

      <DialogFooter
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitLabel="Save"
        isSubmitting={updateMutation.isPending}
      />
    </Dialog>
  );
}
