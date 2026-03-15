import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Max width class. Default: max-w-lg */
  maxWidth?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-surface-700 bg-surface-800 shadow-2xl ${maxWidth}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-700/50 px-6 py-4">
            <div>
              <RadixDialog.Title className="text-base font-semibold text-surface-100">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-0.5 text-sm text-surface-400">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="rounded-md p-1 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200">
              <X className="h-4 w-4" />
            </RadixDialog.Close>
          </div>

          {/* Body */}
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            {children}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Standard form footer with cancel + submit buttons */
export function DialogFooter({
  onCancel,
  onSubmit,
  submitLabel = 'Save',
  isSubmitting = false,
  variant = 'default',
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  variant?: 'default' | 'danger';
}) {
  const submitClass =
    variant === 'danger'
      ? 'bg-danger hover:bg-danger-hover text-white'
      : 'bg-accent hover:bg-accent-hover text-white';

  return (
    <div className="flex items-center justify-end gap-2 border-t border-surface-700/50 px-6 py-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-700 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${submitClass}`}
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}

/** Reusable form field */
export function FormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-surface-300">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-surface-500">{hint}</p>
      )}
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}

/** Standard text input */
export function FormInput({
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-md border border-surface-700 bg-surface-900 px-3 py-1.5 text-sm text-surface-200 placeholder:text-surface-500 outline-none transition-colors focus:border-accent disabled:opacity-50"
    />
  );
}

/** Standard textarea */
export function FormTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  mono,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full rounded-md border border-surface-700 bg-surface-900 px-3 py-1.5 text-sm text-surface-200 placeholder:text-surface-500 outline-none transition-colors focus:border-accent resize-y ${mono ? 'font-mono text-xs' : ''}`}
    />
  );
}

/** Standard select */
export function FormSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string | number;
  onChange: (value: string) => void;
  options: { label: string; value: string | number }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-md border border-surface-700 bg-surface-900 px-3 py-1.5 text-sm text-surface-200 outline-none transition-colors focus:border-accent disabled:opacity-50"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
