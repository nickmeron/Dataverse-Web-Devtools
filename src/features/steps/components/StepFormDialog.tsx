import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogFooter,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from '@/shared/components/Dialog';
import {
  useMessages,
  useAllMessageFilters,
  useMessageFilters,
  useEntityAttributes,
  useSystemUsers,
} from '../hooks/useStepLookups';
import { useCreateStep, useUpdateStep } from '../hooks/useStepMutations';
import { usePluginTypes } from '@/features/tree-view/hooks/useRegistrationData';
import {
  STAGE,
  STAGE_LABELS,
  MODE,
  MODE_LABELS,
  SUPPORTED_DEPLOYMENT_LABELS,
} from '@/config/constants';
import { Search, X, Check } from 'lucide-react';

interface StepFormDialogProps {
  mode: 'create' | 'edit';
  pluginTypeId?: string;
  stepId?: string;
  initialData?: Record<string, unknown>;
  onClose: () => void;
}

interface StepFormState {
  pluginTypeId: string;
  messageId: string;
  messageName: string;
  filterId: string;
  entityName: string;
  stage: number;
  executionMode: number;
  rank: number;
  supportedDeployment: number;
  filteringAttributes: string;
  asyncAutoDelete: boolean;
  unsecureConfig: string;
  description: string;
  impersonatingUserId: string;
}

const INITIAL_STATE: StepFormState = {
  pluginTypeId: '',
  messageId: '',
  messageName: '',
  filterId: '',
  entityName: '',
  stage: STAGE.PRE_OPERATION,
  executionMode: MODE.SYNCHRONOUS,
  rank: 1,
  supportedDeployment: 0,
  filteringAttributes: '',
  asyncAutoDelete: false,
  unsecureConfig: '',
  description: '',
  impersonatingUserId: '',
};

export function StepFormDialog({
  mode,
  pluginTypeId,
  stepId,
  initialData,
  onClose,
}: StepFormDialogProps) {
  const [form, setForm] = useState<StepFormState>(() => {
    if (mode === 'edit' && initialData) {
      return {
        pluginTypeId: String(initialData._plugintypeid_value ?? ''),
        messageId: String(initialData._sdkmessageid_value ?? ''),
        messageName: '',
        filterId: String(initialData._sdkmessagefilterid_value ?? ''),
        entityName: '',
        stage: Number(initialData.stage ?? STAGE.PRE_OPERATION),
        executionMode: Number(initialData.mode ?? MODE.SYNCHRONOUS),
        rank: Number(initialData.rank ?? 1),
        supportedDeployment: Number(initialData.supporteddeployment ?? 0),
        filteringAttributes: String(initialData.filteringattributes ?? ''),
        asyncAutoDelete: Boolean(initialData.asyncautodelete),
        unsecureConfig: String(initialData.configuration ?? ''),
        description: String(initialData.description ?? ''),
        impersonatingUserId: String(
          initialData._impersonatinguserid_value ?? '',
        ),
      };
    }
    return { ...INITIAL_STATE, pluginTypeId: pluginTypeId ?? '' };
  });

  const [attrSearch, setAttrSearch] = useState('');

  // Lookups
  const pluginTypes = usePluginTypes();
  const messages = useMessages();
  const allFilters = useAllMessageFilters();
  const messageFilters = useMessageFilters(form.messageId || undefined);
  const entityAttributes = useEntityAttributes(
    form.entityName || undefined,
  );
  const users = useSystemUsers();

  // Build entity count per message from all filters
  const msgEntityCounts = useMemo(() => {
    if (!allFilters.data) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const f of allFilters.data) {
      if (f.primaryobjecttypecode && f.primaryobjecttypecode !== 'none') {
        counts.set(
          f._sdkmessageid_value,
          (counts.get(f._sdkmessageid_value) ?? 0) + 1,
        );
      }
    }
    return counts;
  }, [allFilters.data]);

  // Mutations
  const createStep = useCreateStep();
  const updateStep = useUpdateStep();
  const isSubmitting = createStep.isPending || updateStep.isPending;

  // Resolve message name + entity from filters when editing
  useEffect(() => {
    if (mode === 'edit' && messages.data && form.messageId) {
      const msg = messages.data.find((m) => m.sdkmessageid === form.messageId);
      if (msg && !form.messageName) {
        setForm((prev) => ({ ...prev, messageName: msg.name }));
      }
    }
  }, [messages.data, form.messageId, form.messageName, mode]);

  useEffect(() => {
    if (mode === 'edit' && messageFilters.data && form.filterId) {
      const filter = messageFilters.data.find(
        (f) => f.sdkmessagefilterid === form.filterId,
      );
      if (filter && !form.entityName) {
        setForm((prev) => ({
          ...prev,
          entityName: filter.primaryobjecttypecode,
        }));
      }
    }
  }, [messageFilters.data, form.filterId, form.entityName, mode]);

  // Entities available for the selected message
  const availableEntities = useMemo(() => {
    if (!messageFilters.data) return [];
    return messageFilters.data
      .map((f) => ({
        filterId: f.sdkmessagefilterid,
        entity: f.primaryobjecttypecode,
      }))
      .filter((e) => e.entity !== 'none')
      .sort((a, b) => a.entity.localeCompare(b.entity));
  }, [messageFilters.data]);

  // Filtered entity attributes for the multi-select
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

  const selectedAttrs = useMemo(
    () =>
      form.filteringAttributes
        ? form.filteringAttributes.split(',').filter(Boolean)
        : [],
    [form.filteringAttributes],
  );

  // Async mode is only valid for Post-operation
  const canBeAsync = form.stage === STAGE.POST_OPERATION;
  useEffect(() => {
    if (!canBeAsync && form.executionMode === MODE.ASYNCHRONOUS) {
      setForm((prev) => ({ ...prev, executionMode: MODE.SYNCHRONOUS }));
    }
  }, [canBeAsync, form.executionMode]);

  const update = (partial: Partial<StepFormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const handleMessageChange = (messageId: string) => {
    const msg = messages.data?.find((m) => m.sdkmessageid === messageId);
    update({
      messageId,
      messageName: msg?.name ?? '',
      filterId: '',
      entityName: '',
      filteringAttributes: '',
    });
  };

  const handleEntityChange = (entity: string) => {
    const filter = messageFilters.data?.find(
      (f) => f.primaryobjecttypecode === entity,
    );
    update({
      entityName: entity,
      filterId: filter?.sdkmessagefilterid ?? '',
      filteringAttributes: '',
    });
  };

  const toggleAttribute = (logicalName: string) => {
    const current = new Set(selectedAttrs);
    if (current.has(logicalName)) {
      current.delete(logicalName);
    } else {
      current.add(logicalName);
    }
    update({ filteringAttributes: Array.from(current).join(',') });
  };

  const buildStepName = () => {
    const pt = pluginTypes.data?.find(
      (t) => t.plugintypeid === form.pluginTypeId,
    );
    const typeName = pt?.typename ?? 'Plugin';
    const msgName = form.messageName || 'Message';
    const entity = form.entityName || '';
    return entity
      ? `${typeName}: ${msgName} of ${entity}`
      : `${typeName}: ${msgName}`;
  };

  const handleSubmit = () => {
    if (!form.pluginTypeId || !form.messageId) return;

    if (mode === 'create') {
      const payload: Record<string, unknown> = {
        name: buildStepName(),
        stage: form.stage,
        mode: form.executionMode,
        rank: form.rank,
        supporteddeployment: form.supportedDeployment,
        asyncautodelete: form.asyncAutoDelete,
        'plugintypeid@odata.bind': `/plugintypes(${form.pluginTypeId})`,
        'sdkmessageid@odata.bind': `/sdkmessages(${form.messageId})`,
      };
      if (form.filterId) {
        payload['sdkmessagefilterid@odata.bind'] =
          `/sdkmessagefilters(${form.filterId})`;
      }
      if (form.filteringAttributes) {
        payload.filteringattributes = form.filteringAttributes;
      }
      if (form.unsecureConfig) {
        payload.configuration = form.unsecureConfig;
      }
      if (form.description) {
        payload.description = form.description;
      }
      if (form.impersonatingUserId) {
        payload['impersonatinguserid@odata.bind'] =
          `/systemusers(${form.impersonatingUserId})`;
      }

      createStep.mutate(payload as never, { onSuccess: onClose });
    } else if (mode === 'edit' && stepId) {
      const payload: Record<string, unknown> = {
        name: buildStepName(),
        stage: form.stage,
        mode: form.executionMode,
        rank: form.rank,
        supporteddeployment: form.supportedDeployment,
        asyncautodelete: form.asyncAutoDelete,
        filteringattributes: form.filteringAttributes || null,
        configuration: form.unsecureConfig || null,
        description: form.description || null,
        'sdkmessageid@odata.bind': `/sdkmessages(${form.messageId})`,
      };
      if (form.filterId) {
        payload['sdkmessagefilterid@odata.bind'] =
          `/sdkmessagefilters(${form.filterId})`;
      }
      if (form.impersonatingUserId) {
        payload['impersonatinguserid@odata.bind'] =
          `/systemusers(${form.impersonatingUserId})`;
      } else {
        payload['impersonatinguserid@odata.bind'] = null;
      }

      updateStep.mutate(
        { id: stepId, payload: payload as never },
        { onSuccess: onClose },
      );
    }
  };

  // Message search
  const [msgSearch, setMsgSearch] = useState('');
  const filteredMessages = useMemo(() => {
    if (!messages.data) return [];
    if (!msgSearch.trim()) return messages.data;
    const q = msgSearch.toLowerCase();
    return messages.data.filter((m) => m.name.toLowerCase().includes(q));
  }, [messages.data, msgSearch]);

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={mode === 'create' ? 'Register New Step' : 'Edit Step'}
      description={
        mode === 'create'
          ? 'Configure a new SDK message processing step'
          : 'Update step configuration'
      }
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Plugin Type */}
        <FormField label="Plugin Type" required>
          <FormSelect
            value={form.pluginTypeId}
            onChange={(v) => update({ pluginTypeId: v })}
            placeholder="Select a plugin type..."
            disabled={mode === 'edit'}
            options={
              pluginTypes.data?.map((pt) => ({
                label: pt.typename,
                value: pt.plugintypeid,
              })) ?? []
            }
          />
        </FormField>

        {/* Message */}
        <FormField label="Message" required>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 rounded-md border border-surface-700 bg-surface-900 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-surface-500" />
              <input
                type="text"
                value={msgSearch}
                onChange={(e) => setMsgSearch(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 bg-transparent text-sm text-surface-200 placeholder:text-surface-500 outline-none"
              />
              {msgSearch && (
                <button
                  type="button"
                  onClick={() => setMsgSearch('')}
                  className="text-surface-500 hover:text-surface-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="text-[10px] text-surface-500 tabular-nums">
                {filteredMessages.length}
                {messages.data
                  ? ` / ${messages.data.length}`
                  : ''}
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-md border border-surface-700 bg-surface-900">
              {messages.isLoading ? (
                <p className="px-3 py-4 text-center text-xs text-surface-500">
                  Loading messages...
                </p>
              ) : filteredMessages.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-surface-500">
                  No messages found
                </p>
              ) : (
                filteredMessages.map((m) => {
                  const isSelected = m.sdkmessageid === form.messageId;
                  const entityCount = msgEntityCounts.get(m.sdkmessageid);
                  const isCustom =
                    m.customizationlevel != null && m.customizationlevel > 0;
                  return (
                    <button
                      key={m.sdkmessageid}
                      type="button"
                      onClick={() => handleMessageChange(m.sdkmessageid)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-accent/10 text-accent'
                          : 'text-surface-300 hover:bg-surface-800'
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span
                        className={`text-sm font-medium ${isSelected ? '' : 'ml-[22px]'}`}
                      >
                        {m.name}
                      </span>
                      <span className="ml-auto flex shrink-0 items-center gap-1.5">
                        {isCustom && (
                          <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                            Custom
                          </span>
                        )}
                        {entityCount != null && (
                          <span className="rounded bg-surface-700/60 px-1.5 py-0.5 text-[10px] tabular-nums text-surface-400">
                            {entityCount}{' '}
                            {entityCount === 1 ? 'entity' : 'entities'}
                          </span>
                        )}
                        {m.isvalidforexecuteasync === true && (
                          <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] text-success">
                            Async
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </FormField>

        {/* Entity */}
        {availableEntities.length > 0 && (
          <FormField label="Primary Entity">
            <FormSelect
              value={form.entityName}
              onChange={handleEntityChange}
              placeholder="Select entity..."
              options={availableEntities.map((e) => ({
                label: e.entity,
                value: e.entity,
              }))}
            />
          </FormField>
        )}

        {/* Stage + Mode */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Stage" required>
            <FormSelect
              value={form.stage}
              onChange={(v) => update({ stage: Number(v) })}
              options={Object.entries(STAGE_LABELS).map(([val, label]) => ({
                label,
                value: val,
              }))}
            />
          </FormField>
          <FormField
            label="Execution Mode"
            required
            hint={!canBeAsync ? 'Async requires Post-operation stage' : undefined}
          >
            <FormSelect
              value={form.executionMode}
              onChange={(v) => update({ executionMode: Number(v) })}
              options={Object.entries(MODE_LABELS).map(([val, label]) => ({
                label:
                  !canBeAsync && Number(val) === MODE.ASYNCHRONOUS
                    ? `${label} (Post-operation only)`
                    : label,
                value: val,
              }))}
            />
          </FormField>
        </div>

        {/* Rank + Deployment */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Execution Order (Rank)">
            <FormInput
              type="number"
              value={String(form.rank)}
              onChange={(v) => update({ rank: Number(v) || 1 })}
            />
          </FormField>
          <FormField label="Supported Deployment">
            <FormSelect
              value={form.supportedDeployment}
              onChange={(v) => update({ supportedDeployment: Number(v) })}
              options={Object.entries(SUPPORTED_DEPLOYMENT_LABELS).map(
                ([val, label]) => ({ label, value: val }),
              )}
            />
          </FormField>
        </div>

        {/* Filtering Attributes (only shown when entity selected) */}
        {form.entityName && form.entityName !== 'none' && (
          <FormField
            label="Filtering Attributes"
            hint="Leave empty to trigger on all attributes. Only applies to Update message."
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
                    Loading attributes...
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

        {/* Async auto-delete */}
        {form.executionMode === MODE.ASYNCHRONOUS && (
          <label className="flex items-center gap-2 text-sm text-surface-300">
            <input
              type="checkbox"
              checked={form.asyncAutoDelete}
              onChange={(e) =>
                update({ asyncAutoDelete: e.target.checked })
              }
              className="rounded border-surface-600"
            />
            Delete async job on completion
          </label>
        )}

        {/* Impersonating User */}
        <FormField
          label="Run in User's Context"
          hint="Leave empty to use the calling user's context"
        >
          <FormSelect
            value={form.impersonatingUserId}
            onChange={(v) => update({ impersonatingUserId: v })}
            placeholder="(Calling User)"
            options={[
              { label: '(Calling User)', value: '' },
              ...(users.data?.map((u) => ({
                label: u.fullname,
                value: u.systemuserid,
              })) ?? []),
            ]}
          />
        </FormField>

        {/* Unsecure Configuration */}
        <FormField label="Unsecure Configuration">
          <FormTextarea
            value={form.unsecureConfig}
            onChange={(v) => update({ unsecureConfig: v })}
            placeholder="Configuration data visible to all..."
            mono
          />
        </FormField>

        {/* Description */}
        <FormField label="Description">
          <FormTextarea
            value={form.description}
            onChange={(v) => update({ description: v })}
            placeholder="Optional description..."
            rows={2}
          />
        </FormField>
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
