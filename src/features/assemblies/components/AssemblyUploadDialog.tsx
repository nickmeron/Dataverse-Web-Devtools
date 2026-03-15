import { useState, useRef } from 'react';
import {
  Dialog,
  DialogFooter,
  FormField,
  FormSelect,
  FormTextarea,
} from '@/shared/components/Dialog';
import { useUploadAssembly } from '../hooks/useAssemblyMutations';
import { ISOLATION_MODE_LABELS, SOURCE_TYPE_LABELS } from '@/config/constants';
import { Upload, FileCode } from 'lucide-react';

interface AssemblyUploadDialogProps {
  onClose: () => void;
}

export function AssemblyUploadDialog({ onClose }: AssemblyUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState('');
  const [isolationMode, setIsolationMode] = useState(2); // Sandbox
  const [sourceType, setSourceType] = useState(0); // Database
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadAssembly();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.dll')) {
      return;
    }

    setFile(selected);

    // Convert to base64
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

    uploadMutation.mutate(
      {
        content: base64,
        isolationmode: isolationMode,
        sourcetype: sourceType,
        ...(description ? { description } : {}),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Register New Assembly"
      description="Upload a plugin assembly (.dll) to Dataverse"
    >
      <div className="space-y-4">
        {/* File picker */}
        <FormField label="Assembly File" required>
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
                    Plugin assembly file
                  </p>
                </div>
              </>
            )}
          </button>
        </FormField>

        {/* Isolation Mode */}
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

        {/* Source Type */}
        <FormField label="Source Type">
          <FormSelect
            value={sourceType}
            onChange={(v) => setSourceType(Number(v))}
            options={Object.entries(SOURCE_TYPE_LABELS).map(
              ([val, label]) => ({ label, value: val }),
            )}
          />
        </FormField>

        {/* Description */}
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
        submitLabel="Upload"
        isSubmitting={uploadMutation.isPending}
      />
    </Dialog>
  );
}
