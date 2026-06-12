import { useState, useRef } from 'react';
import {
  Dialog,
  DialogFooter,
  FormField,
  FormSelect,
  FormTextarea,
} from '@/shared/components/Dialog';
import { useUpdateAssembly } from '../hooks/useAssemblyMutations';
import { ISOLATION_MODE_LABELS, SOURCE_TYPE_LABELS } from '@/config/constants';
import { Upload, FileCode, X } from 'lucide-react';

interface AssemblyUpdateDialogProps {
  assemblyId: string;
  assemblyName: string;
  /** Current assembly record, used to prefill editable properties */
  initialData?: Record<string, unknown>;
  onClose: () => void;
}

export function AssemblyUpdateDialog({
  assemblyId,
  assemblyName,
  initialData,
  onClose,
}: AssemblyUpdateDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState('');
  const [isolationMode, setIsolationMode] = useState(
    Number(initialData?.isolationmode ?? 2),
  );
  const [sourceType, setSourceType] = useState(
    Number(initialData?.sourcetype ?? 0),
  );
  const [description, setDescription] = useState(
    String(initialData?.description ?? ''),
  );
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

  const clearFile = () => {
    setFile(null);
    setBase64('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    updateMutation.mutate(
      {
        id: assemblyId,
        payload: {
          ...(base64 ? { content: base64 } : {}),
          isolationmode: isolationMode,
          sourcetype: sourceType,
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
      title="Update Assembly"
      description={`Update "${assemblyName}" — replace the binary, change properties, or both`}
    >
      <div className="space-y-4">
        <FormField
          label="New Assembly File (.dll)"
          hint="Optional — leave empty to keep the current binary and only update properties"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".dll"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="relative">
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
            {file && (
              <button
                type="button"
                onClick={clearFile}
                title="Clear selected file"
                className="absolute right-2 top-2 rounded-md p-1 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </FormField>

        <FormField
          label="Isolation Mode"
          hint="Sandbox is required for Dataverse Online"
        >
          <FormSelect
            value={isolationMode}
            onChange={(v) => setIsolationMode(Number(v))}
            options={Object.entries(ISOLATION_MODE_LABELS).map(
              ([val, label]) => ({ label, value: val }),
            )}
          />
        </FormField>

        <FormField label="Source Type">
          <FormSelect
            value={sourceType}
            onChange={(v) => setSourceType(Number(v))}
            options={Object.entries(SOURCE_TYPE_LABELS).map(
              ([val, label]) => ({ label, value: val }),
            )}
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

        {file && (
          <div className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
            This will replace the assembly binary. Existing plugin types and
            step registrations will be preserved.
          </div>
        )}
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
