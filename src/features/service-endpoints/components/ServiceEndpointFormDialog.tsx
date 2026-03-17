import { useState } from 'react';
import {
  Dialog,
  DialogFooter,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from '@/shared/components/Dialog';
import {
  useCreateServiceEndpoint,
  useUpdateServiceEndpoint,
} from '../hooks/useServiceEndpointMutations';
import {
  CONTRACT_TYPE,
  CONTRACT_TYPE_LABELS,
  AUTH_TYPE,
  MESSAGE_FORMAT,
  MESSAGE_FORMAT_LABELS,
  USER_CLAIM_LABELS,
} from '@/config/constants';

type Mode = 'create' | 'edit';

interface Props {
  mode: Mode;
  /** 'webhook' pre-selects contract=8; 'serviceEndpoint' shows full contract picker */
  variant: 'webhook' | 'serviceEndpoint';
  endpointId?: string;
  initialData?: Record<string, unknown>;
  onClose: () => void;
}

const WEBHOOK_CONTRACT_OPTIONS = [
  { label: 'Webhook', value: CONTRACT_TYPE.WEBHOOK },
];

const SERVICE_ENDPOINT_CONTRACT_OPTIONS = Object.entries(CONTRACT_TYPE_LABELS)
  .filter(([k]) => Number(k) !== CONTRACT_TYPE.WEBHOOK)
  .map(([value, label]) => ({ value: Number(value), label }));

/* Webhook auth options: HttpHeader, WebhookKey, HttpQueryString */
const WEBHOOK_AUTH_OPTIONS: { label: string; value: string }[] = [
  { label: 'None', value: '' },
  { label: 'Http Header', value: String(AUTH_TYPE.HTTP_HEADER) },
  { label: 'Webhook Key', value: String(AUTH_TYPE.WEBHOOK_KEY) },
  { label: 'Http Query String', value: String(AUTH_TYPE.HTTP_QUERY_STRING) },
];

/* Service Bus auth options: SASKey, SASToken */
const SERVICE_BUS_AUTH_OPTIONS: { label: string; value: string }[] = [
  { label: 'None', value: '' },
  { label: 'SAS Key', value: String(AUTH_TYPE.SAS_KEY) },
  { label: 'SAS Token', value: String(AUTH_TYPE.SAS_TOKEN) },
];

const MESSAGE_FORMAT_OPTIONS = Object.entries(MESSAGE_FORMAT_LABELS).map(
  ([value, label]) => ({ value: Number(value), label }),
);

const USER_CLAIM_OPTIONS = Object.entries(USER_CLAIM_LABELS).map(
  ([value, label]) => ({ value: Number(value), label }),
);

export function ServiceEndpointFormDialog({
  mode,
  variant,
  endpointId,
  initialData,
  onClose,
}: Props) {
  const isWebhook = variant === 'webhook';
  const createMutation = useCreateServiceEndpoint();
  const updateMutation = useUpdateServiceEndpoint();

  const [name, setName] = useState(
    mode === 'edit' ? String(initialData?.name ?? '') : '',
  );
  const [contract, setContract] = useState(
    mode === 'edit'
      ? Number(initialData?.contract ?? (isWebhook ? CONTRACT_TYPE.WEBHOOK : 1))
      : isWebhook
        ? CONTRACT_TYPE.WEBHOOK
        : 1,
  );
  const [url, setUrl] = useState(
    mode === 'edit' ? String(initialData?.url ?? '') : '',
  );
  const [authtype, setAuthtype] = useState<string>(
    mode === 'edit' && initialData?.authtype != null
      ? String(initialData.authtype)
      : '',
  );
  const [authvalue, setAuthvalue] = useState(
    mode === 'edit' ? String(initialData?.authvalue ?? '') : '',
  );
  const [messageformat, setMessageformat] = useState(
    mode === 'edit'
      ? Number(initialData?.messageformat ?? MESSAGE_FORMAT.JSON)
      : MESSAGE_FORMAT.JSON,
  );
  const [description, setDescription] = useState(
    mode === 'edit' ? String(initialData?.description ?? '') : '',
  );
  const [namespaceaddress, setNamespaceaddress] = useState(
    mode === 'edit' ? String(initialData?.namespaceaddress ?? '') : '',
  );
  const [path, setPath] = useState(
    mode === 'edit' ? String(initialData?.path ?? '') : '',
  );
  const [saskeyname, setSaskeyname] = useState(
    mode === 'edit' ? String(initialData?.saskeyname ?? '') : '',
  );
  const [saskey, setSaskey] = useState(
    mode === 'edit' ? String(initialData?.saskey ?? '') : '',
  );
  const [sastoken, setSastoken] = useState(
    mode === 'edit' ? String(initialData?.sastoken ?? '') : '',
  );
  const [userclaim, setUserclaim] = useState(
    mode === 'edit' ? Number(initialData?.userclaim ?? 0) : 0,
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Webhook & REST/EventGrid use URL + webhook auth; Service Bus types use namespace/path/SAS
  const showUrlFields =
    isWebhook || contract === CONTRACT_TYPE.REST || contract === CONTRACT_TYPE.EVENT_GRID;
  const showServiceBusFields =
    !isWebhook &&
    ([1, 2, 4, 5, 6, 7] as number[]).includes(contract);

  const authtypeNum = authtype ? Number(authtype) : null;
  const showSasKeyFields = showServiceBusFields && authtypeNum === AUTH_TYPE.SAS_KEY;
  const showSasTokenField = showServiceBusFields && authtypeNum === AUTH_TYPE.SAS_TOKEN;

  // Dynamic label for path based on contract type
  const pathLabel =
    contract === CONTRACT_TYPE.QUEUE || contract === CONTRACT_TYPE.PERSISTENT_QUEUE
      ? 'Queue Name'
      : contract === CONTRACT_TYPE.TOPIC
        ? 'Topic Name'
        : contract === CONTRACT_TYPE.EVENT_HUB
          ? 'Event Hub Name'
          : 'Path';

  const handleSubmit = () => {
    if (!name.trim()) return;

    const payload: Record<string, unknown> = {
      name: name.trim(),
      contract,
      messageformat,
      userclaim,
    };

    if (showUrlFields) {
      if (url.trim()) payload.url = url.trim();
      if (authtype) payload.authtype = Number(authtype);
      if (authvalue.trim()) payload.authvalue = authvalue.trim();
    }

    if (showServiceBusFields) {
      if (namespaceaddress.trim())
        payload.namespaceaddress = namespaceaddress.trim();
      if (path.trim()) payload.path = path.trim();
      if (authtype) payload.authtype = Number(authtype);
      if (showSasKeyFields) {
        if (saskeyname.trim()) payload.saskeyname = saskeyname.trim();
        if (saskey.trim()) payload.saskey = saskey.trim();
      }
      if (showSasTokenField) {
        if (sastoken.trim()) payload.sastoken = sastoken.trim();
      }
    }

    if (description.trim()) payload.description = description.trim();

    if (mode === 'edit' && endpointId) {
      updateMutation.mutate(
        { id: endpointId, data: payload },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(
        payload as unknown as Parameters<typeof createMutation.mutate>[0],
        { onSuccess: onClose },
      );
    }
  };

  const title =
    mode === 'edit'
      ? `Edit ${isWebhook ? 'Webhook' : 'Service Endpoint'}`
      : `Register New ${isWebhook ? 'Webhook' : 'Service Endpoint'}`;

  const description_text =
    mode === 'edit'
      ? `Update ${isWebhook ? 'webhook' : 'service endpoint'} configuration`
      : isWebhook
        ? 'Configure a webhook endpoint for receiving Dataverse events'
        : 'Configure a connection to Azure Service Bus for plug-in events';

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description={description_text}
    >
      <div className="space-y-4">
        {/* Name */}
        <FormField label="Name" required>
          <FormInput
            value={name}
            onChange={setName}
            placeholder={isWebhook ? 'e.g. My Webhook' : 'e.g. My Service Bus'}
          />
        </FormField>

        {/* Contract Type / Designation Type */}
        <FormField
          label={isWebhook ? 'Contract Type' : 'Designation Type'}
          required
        >
          <FormSelect
            value={contract}
            onChange={(v) => {
              setContract(Number(v));
              // Reset auth when switching contract types
              setAuthtype('');
              setAuthvalue('');
              setSaskeyname('');
              setSaskey('');
              setSastoken('');
            }}
            options={
              isWebhook
                ? WEBHOOK_CONTRACT_OPTIONS
                : SERVICE_ENDPOINT_CONTRACT_OPTIONS
            }
            disabled={isWebhook}
          />
        </FormField>

        {/* URL-based fields (Webhook, REST, Event Grid) */}
        {showUrlFields && (
          <>
            <FormField label="Endpoint URL" required>
              <FormInput
                value={url}
                onChange={setUrl}
                placeholder="https://example.com/api/webhook"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Authentication Type">
                <FormSelect
                  value={authtype}
                  onChange={(v) => {
                    setAuthtype(v);
                    setAuthvalue('');
                  }}
                  options={WEBHOOK_AUTH_OPTIONS}
                />
              </FormField>

              {authtype && (
                <FormField label="Authentication Value">
                  <FormInput
                    value={authvalue}
                    onChange={setAuthvalue}
                    placeholder="Enter key or token..."
                  />
                </FormField>
              )}
            </div>
          </>
        )}

        {/* Service Bus fields */}
        {showServiceBusFields && (
          <>
            <FormField
              label="Namespace Address"
              required
              hint="Azure Service Bus namespace URL"
            >
              <FormInput
                value={namespaceaddress}
                onChange={setNamespaceaddress}
                placeholder="sb://mynamespace.servicebus.windows.net/"
              />
            </FormField>

            <FormField label={pathLabel} hint={`${pathLabel} on the Service Bus`}>
              <FormInput
                value={path}
                onChange={setPath}
                placeholder={`e.g. my${pathLabel.toLowerCase().replace(' name', '')}`}
              />
            </FormField>

            {/* Authorization Type for Service Bus */}
            <FormField label="Authorization Type">
              <FormSelect
                value={authtype}
                onChange={(v) => {
                  setAuthtype(v);
                  setSaskeyname('');
                  setSaskey('');
                  setSastoken('');
                }}
                options={SERVICE_BUS_AUTH_OPTIONS}
              />
            </FormField>

            {/* SAS Key fields */}
            {showSasKeyFields && (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="SAS Key Name" required>
                  <FormInput
                    value={saskeyname}
                    onChange={setSaskeyname}
                    placeholder="e.g. RootManageSharedAccessKey"
                  />
                </FormField>
                <FormField label="SAS Key" required>
                  <FormInput
                    value={saskey}
                    onChange={setSaskey}
                    placeholder="Enter SAS key..."
                    type="password"
                  />
                </FormField>
              </div>
            )}

            {/* SAS Token field */}
            {showSasTokenField && (
              <FormField label="SAS Token" required>
                <FormTextarea
                  value={sastoken}
                  onChange={setSastoken}
                  placeholder="SharedAccessSignature sr=..."
                  rows={3}
                  mono
                />
              </FormField>
            )}
          </>
        )}

        {/* Message Format */}
        <FormField label="Message Format">
          <FormSelect
            value={messageformat}
            onChange={(v) => setMessageformat(Number(v))}
            options={MESSAGE_FORMAT_OPTIONS}
          />
        </FormField>

        {/* User Information Sent */}
        <FormField
          label="User Information Sent"
          hint="What user information to include with the message"
        >
          <FormSelect
            value={userclaim}
            onChange={(v) => setUserclaim(Number(v))}
            options={USER_CLAIM_OPTIONS}
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
        submitLabel={mode === 'edit' ? 'Update' : 'Register'}
        isSubmitting={isSubmitting}
      />
    </Dialog>
  );
}
