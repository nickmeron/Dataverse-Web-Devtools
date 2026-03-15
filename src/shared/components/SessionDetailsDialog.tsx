import { useState, useEffect, useCallback } from 'react';
import { Dialog } from './Dialog';
import { useAuthStore } from '@/shared/stores/authStore';
import { dataverseClient } from '@/shared/api/dataverseClient';
import { endpoints } from '@/shared/api/endpoints';
import { getGlobalContext } from '@/features/auth/services/xrmContext';
import { Copy, Check } from 'lucide-react';

interface SessionDetailsDialogProps {
  onClose: () => void;
}

interface OrgDetails {
  tenantid?: string;
  name?: string;
  languagecode?: number;
  externalbaseurl?: string;
}

export function SessionDetailsDialog({ onClose }: SessionDetailsDialogProps) {
  const { userId, userName, orgName, orgId, clientUrl, version } =
    useAuthStore();

  const [orgDetails, setOrgDetails] = useState<OrgDetails | null>(null);
  const [clientType, setClientType] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Try to get extra context from Xrm
  useEffect(() => {
    try {
      const ctx = getGlobalContext();
      if (ctx.client?.getClient) {
        setClientType(ctx.client.getClient());
      }
    } catch {
      // not available
    }
  }, []);

  // Fetch org record for tenant ID
  useEffect(() => {
    if (!orgId) return;
    dataverseClient
      .get<{ value: OrgDetails[] }>(
        `${endpoints.batch.replace('/$batch', '')}/organizations?$select=tenantid,name,languagecode,externalbaseurl&$top=1`,
      )
      .then((result) => {
        if (result.value?.[0]) {
          setOrgDetails(result.value[0]);
        }
      })
      .catch(() => {
        // non-critical
      });
  }, [orgId]);

  const timestamp = new Date().toISOString();
  const instanceUrl = clientUrl ?? window.location.origin;

  const details = [
    { label: 'Timestamp', value: timestamp },
    { label: 'User ID', value: userId },
    { label: 'User Name', value: userName },
    ...(orgDetails?.tenantid
      ? [{ label: 'Tenant ID', value: orgDetails.tenantid }]
      : []),
    { label: 'Organization ID', value: orgId },
    { label: 'Unique Name', value: orgName },
    ...(orgDetails?.name ? [{ label: 'Display Name', value: orgDetails.name }] : []),
    { label: 'Instance URL', value: instanceUrl },
    { label: 'Dataverse Version', value: version },
    ...(clientType ? [{ label: 'Client', value: clientType }] : []),
    {
      label: 'User Agent',
      value: navigator.userAgent,
    },
  ].filter((d) => d.value);

  const detailsText = details
    .map((d) => `${d.label}: ${d.value}`)
    .join('\n');

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(detailsText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [detailsText]);

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Session Details"
      description="Environment and session information"
    >
      <div className="rounded-lg border border-surface-700/50 bg-surface-900/80 p-4 font-mono text-xs leading-relaxed text-surface-300">
        {details.map((d) => (
          <div key={d.label} className="flex gap-2 py-0.5">
            <span className="shrink-0 text-surface-500">{d.label}:</span>
            <span className="break-all text-surface-200">{d.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Details
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-surface-700 px-4 py-2 text-sm font-medium text-surface-200 transition-colors hover:bg-surface-600"
        >
          Close
        </button>
      </div>
    </Dialog>
  );
}
