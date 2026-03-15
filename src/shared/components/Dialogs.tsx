import { useUiStore } from '@/shared/stores/uiStore';
import { Dialog, DialogFooter } from './Dialog';
import { StepFormDialog } from '@/features/steps/components/StepFormDialog';
import { AssemblyUploadDialog } from '@/features/assemblies/components/AssemblyUploadDialog';
import { AssemblyUpdateDialog } from '@/features/assemblies/components/AssemblyUpdateDialog';
import { ImageFormDialog } from '@/features/images/components/ImageFormDialog';
import { SessionDetailsDialog } from './SessionDetailsDialog';
import { AlertTriangle } from 'lucide-react';

/**
 * Central dialog host. Renders the currently active dialog based on uiStore.activeDialog.
 * Placed at the App level so any component can trigger dialogs.
 */
export function Dialogs() {
  const { activeDialog, closeDialog } = useUiStore();

  if (!activeDialog) return null;

  switch (activeDialog.type) {
    case 'registerStep':
      return (
        <StepFormDialog
          mode="create"
          pluginTypeId={activeDialog.pluginTypeId}
          onClose={closeDialog}
        />
      );

    case 'editStep':
      return (
        <StepFormDialog
          mode="edit"
          stepId={activeDialog.stepId}
          initialData={activeDialog.data}
          onClose={closeDialog}
        />
      );

    case 'uploadAssembly':
      return <AssemblyUploadDialog onClose={closeDialog} />;

    case 'updateAssembly':
      return (
        <AssemblyUpdateDialog
          assemblyId={activeDialog.assemblyId}
          assemblyName={activeDialog.assemblyName}
          onClose={closeDialog}
        />
      );

    case 'registerImage':
      return (
        <ImageFormDialog
          mode="create"
          stepId={activeDialog.stepId}
          onClose={closeDialog}
        />
      );

    case 'editImage':
      return (
        <ImageFormDialog
          mode="edit"
          imageId={activeDialog.imageId}
          initialData={activeDialog.data}
          onClose={closeDialog}
        />
      );

    case 'sessionDetails':
      return <SessionDetailsDialog onClose={closeDialog} />;

    case 'confirm':
      return (
        <ConfirmDialog
          title={activeDialog.title}
          message={activeDialog.message}
          onConfirm={activeDialog.onConfirm}
          onCancel={closeDialog}
          variant={activeDialog.variant}
        />
      );

    default:
      return null;
  }
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  variant = 'default',
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()} title={title}>
      <div className="flex items-start gap-3 py-2">
        {variant === 'danger' && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-5 w-5 text-danger" />
          </div>
        )}
        <p className="text-sm text-surface-300">{message}</p>
      </div>
      <DialogFooter
        onCancel={onCancel}
        onSubmit={() => {
          onConfirm();
          onCancel();
        }}
        submitLabel={variant === 'danger' ? 'Delete' : 'Confirm'}
        variant={variant}
      />
    </Dialog>
  );
}
