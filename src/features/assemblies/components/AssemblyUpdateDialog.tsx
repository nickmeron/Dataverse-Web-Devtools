import { useState, useRef } from 'react';
import { Dialog, DialogFooter, FormField } from '@/shared/components/Dialog';
import { useUpdateAssembly } from '../hooks/useAssemblyMutations';
import { Upload, FileCode } from 'lucide-react';

interface AssemblyUpdateDialogProps {
  assemblyId: string;
  assemblyName: string;
  onClose: () => void;
}

export function AssemblyUpdateDialog({
  assemblyId,
  assemblyName,
  onClose,
}: AssemblyUpdateDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useUpdateAssembly();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);

    const buffer = await selected.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    setBase64(btoa(binary));
  };

  const handleSubmit = () => {
    if (!base64) return;
    updateMutation.mutate(
      { id: assemblyId, content: base64 },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Update Assembly"
      description={`Upload a new version of "${assemblyName}"`}
    >
      <div className="space-y-4">
        <FormField label="New Assembly File (.dll)" required>
          <input
            ref={fileInputRef}
            type="file"
            accept=".dll"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-surface-700 bg-surface-900/50 px-4 py-6 text-sm transition-colors hover:border-accent/50 hover:bg-surface-900"
          >
            {file ? (
              <>
                <FileCode className="h-8 w-8 text-accent" />
                <div className="text-left">
                  <p className="font-medium text-surface-200">{file.name}</p>
                  <p className="text-xs text-surface-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-surface-500" />
                <div className="text-left">
                  <p className="font-medium text-surface-300">
                    Click to select a .dll file
                  </p>
                  <p className="text-xs text-surface-500">
                    Replace the existing assembly binary
                  </p>
                </div>
              </>
            )}
          </button>
        </FormField>

        <div className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
          This will replace the assembly binary. Existing plugin types and step
          registrations will be preserved.
        </div>
      </div>

      <DialogFooter
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitLabel="Update Assembly"
        isSubmitting={updateMutation.isPending}
      />
    </Dialog>
  );
}
