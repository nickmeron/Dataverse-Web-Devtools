import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogFooter,
  FormField,
  FormInput,
  FormSelect,
} from '@/shared/components/Dialog';
import { useCreateImage, useUpdateImage } from '../hooks/useImageMutations';
import { useEntityAttributes } from '@/features/steps/hooks/useStepLookups';
import { useSteps } from '@/features/tree-view/hooks/useRegistrationData';
import {
  IMAGE_TYPE,
  IMAGE_TYPE_LABELS,
  STAGE,
} from '@/config/constants';
import { Search, X } from 'lucide-react';

interface ImageFormDialogProps {
  mode: 'create' | 'edit';
  stepId?: string;
  imageId?: string;
  initialData?: Record<string, unknown>;
  onClose: () => void;
}

interface ImageFormState {
  imageType: number;
  name: string;
  entityAlias: string;
  messagePropertyName: string;
  attributes: string;
}

export function ImageFormDialog({
  mode,
  stepId,
  imageId,
  initialData,
  onClose,
}: ImageFormDialogProps) {
  const [form, setForm] = useState<ImageFormState>(() => {
    if (mode === 'edit' && initialData) {
      return {
        imageType: Number(initialData.imagetype ?? IMAGE_TYPE.PRE_IMAGE),
        name: String(initialData.name ?? ''),
        entityAlias: String(initialData.entityalias ?? ''),
        messagePropertyName: String(
          initialData.messagepropertyname ?? 'Target',
        ),
        attributes: String(initialData.attributes ?? ''),
      };
    }
    return {
      imageType: IMAGE_TYPE.PRE_IMAGE,
      name: '',
      entityAlias: '',
      messagePropertyName: 'Target',
      attributes: '',
    };
  });

  const [attrSearch, setAttrSearch] = useState('');

  // Get the step's entity to load attributes
  const steps = useSteps();
  const step = useMemo(() => {
    const targetStepId =
      stepId ?? String(initialData?._sdkmessageprocessingstepid_value ?? '');
    return steps.data?.find(
      (s) => s.sdkmessageprocessingstepid === targetStepId,
    );
  }, [steps.data, stepId, initialData]);

  // Determine entity from step name (format: "Type: Message of Entity")
  const entityName = useMemo(() => {
    if (!step) return undefined;
    const match = step.name.match(/of\s+(\w+)/i);
    return match?.[1];
  }, [step]);

  const entityAttributes = useEntityAttributes(entityName);

  // Validate image type based on step stage
  const validImageTypes = useMemo(() => {
    if (!step) return Object.entries(IMAGE_TYPE_LABELS);
    const stage = step.stage;
    return Object.entries(IMAGE_TYPE_LABELS).filter(([val]) => {
      const type = Number(val);
      // Pre-validation doesn't support images
      if (stage === STAGE.PRE_VALIDATION) return false;
      // Pre-operation: only pre-images
      if (stage === STAGE.PRE_OPERATION)
        return type === IMAGE_TYPE.PRE_IMAGE;
      // Post-operation: all types
      return true;
    });
  }, [step]);

  const createImage = useCreateImage();
  const updateImage = useUpdateImage();
  const isSubmitting = createImage.isPending || updateImage.isPending;

  const selectedAttrs = useMemo(
    () => (form.attributes ? form.attributes.split(',').filter(Boolean) : []),
    [form.attributes],
  );

  const filteredAttributes = useMemo(() => {
    if (!entityAttributes.data) return [];
    if (!attrSearch.trim()) return entityAttributes.data;
    const q = attrSearch.toLowerCase();
    return entityAttributes.data.filter(
      (a) =>
        a.logicalName.toLowerCase().includes(q) ||
        a.displayName.toLowerCase().includes(q),
    );
  }, [entityAttributes.data, attrSearch]);

  const update = (partial: Partial<ImageFormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const toggleAttribute = (logicalName: string) => {
    const current = new Set(selectedAttrs);
    if (current.has(logicalName)) {
      current.delete(logicalName);
    } else {
      current.add(logicalName);
    }
    update({ attributes: Array.from(current).join(',') });
  };

  const handleSubmit = () => {
    if (!form.name || !form.entityAlias) return;

    if (mode === 'create' && stepId) {
      createImage.mutate(
        {
          imagetype: form.imageType,
          name: form.name,
          entityalias: form.entityAlias,
          messagepropertyname: form.messagePropertyName || 'Target',
          ...(form.attributes ? { attributes: form.attributes } : {}),
          'sdkmessageprocessingstepid@odata.bind': `/sdkmessageprocessingsteps(${stepId})`,
        },
        { onSuccess: onClose },
      );
    } else if (mode === 'edit' && imageId) {
      updateImage.mutate(
        {
          id: imageId,
          payload: {
            imagetype: form.imageType,
            name: form.name,
            entityalias: form.entityAlias,
            messagepropertyname: form.messagePropertyName || 'Target',
            attributes: form.attributes || null,
          },
        },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={mode === 'create' ? 'Register New Image' : 'Edit Image'}
      description={
        mode === 'create'
          ? 'Add a pre/post image to a step'
          : 'Update image configuration'
      }
    >
      <div className="space-y-4">
        {/* Image Type */}
        <FormField label="Image Type" required>
          <FormSelect
            value={form.imageType}
            onChange={(v) => update({ imageType: Number(v) })}
            options={validImageTypes.map(([val, label]) => ({
              label,
              value: val,
            }))}
          />
          {step && step.stage === STAGE.PRE_VALIDATION && (
            <p className="text-[11px] text-warning">
              Pre-validation steps do not support images
            </p>
          )}
        </FormField>

        {/* Name */}
        <FormField label="Name" required>
          <FormInput
            value={form.name}
            onChange={(v) => update({ name: v })}
            placeholder="e.g. PreImage, PostImage"
          />
        </FormField>

        {/* Entity Alias */}
        <FormField
          label="Entity Alias"
          required
          hint="The alias used to access this image in plugin code"
        >
          <FormInput
            value={form.entityAlias}
            onChange={(v) => update({ entityAlias: v })}
            placeholder="e.g. preImage, target"
          />
        </FormField>

        {/* Message Property Name */}
        <FormField
          label="Message Property Name"
          hint="Usually 'Target' for most messages"
        >
          <FormSelect
            value={form.messagePropertyName}
            onChange={(v) => update({ messagePropertyName: v })}
            options={[
              { label: 'Target', value: 'Target' },
              { label: 'Id', value: 'Id' },
            ]}
          />
        </FormField>

        {/* Attributes */}
        {entityName && (
          <FormField
            label="Attributes"
            hint="Select specific attributes or leave empty to include all"
          >
            <div className="space-y-1.5">
              {selectedAttrs.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedAttrs.map((attr) => (
                    <span
                      key={attr}
                      className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] text-accent"
                    >
                      {attr}
                      <button
                        type="button"
                        onClick={() => toggleAttribute(attr)}
                        className="hover:text-accent-hover"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1.5 rounded-md border border-surface-700 bg-surface-900 px-2.5 py-1">
                <Search className="h-3.5 w-3.5 text-surface-500" />
                <input
                  type="text"
                  value={attrSearch}
                  onChange={(e) => setAttrSearch(e.target.value)}
                  placeholder="Search attributes..."
                  className="flex-1 bg-transparent text-xs text-surface-200 placeholder:text-surface-500 outline-none"
                />
              </div>
              <div className="max-h-32 overflow-y-auto rounded-md border border-surface-700 bg-surface-900">
                {entityAttributes.isLoading ? (
                  <p className="px-3 py-2 text-xs text-surface-500">
                    Loading...
                  </p>
                ) : filteredAttributes.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-surface-500">
                    No attributes found
                  </p>
                ) : (
                  filteredAttributes.slice(0, 100).map((attr) => (
                    <label
                      key={attr.logicalName}
                      className="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs hover:bg-surface-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAttrs.includes(attr.logicalName)}
                        onChange={() => toggleAttribute(attr.logicalName)}
                        className="rounded border-surface-600"
                      />
                      <span className="text-surface-300">
                        {attr.logicalName}
                      </span>
                      {attr.displayName !== attr.logicalName && (
                        <span className="text-surface-500">
                          ({attr.displayName})
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          </FormField>
        )}
      </div>

      <DialogFooter
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitLabel={mode === 'create' ? 'Register' : 'Update'}
        isSubmitting={isSubmitting}
      />
    </Dialog>
  );
}
