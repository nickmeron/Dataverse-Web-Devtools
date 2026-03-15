import { useQuery } from '@tanstack/react-query';
import { dataverseClient } from '@/shared/api/dataverseClient';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/queryKeys';
import type {
  SdkMessage,
  SdkMessageFilter,
  SystemUser,
} from '@/shared/types/dataverse';

/**
 * Fetch all SDK messages that allow custom processing steps.
 * Used for the Message picker in Step Registration.
 */
export function useMessages() {
  return useQuery({
    queryKey: queryKeys.messages.all,
    queryFn: () =>
      dataverseClient.getCollection<SdkMessage>(
        `${endpoints.messages.list}?$select=sdkmessageid,name,availability,customizationlevel,isvalidforexecuteasync,workflowsdkstepenabled&$filter=isprivate eq false&$orderby=name`,
      ),
    staleTime: 5 * 60_000, // messages rarely change
  });
}

/**
 * Fetch all message filters that allow custom processing steps.
 * Used to show entity counts per message in the picker.
 */
export function useAllMessageFilters() {
  return useQuery({
    queryKey: ['messageFilters', 'all'],
    queryFn: () =>
      dataverseClient.getCollection<SdkMessageFilter>(
        `${endpoints.messageFilters.list}?$select=_sdkmessageid_value,primaryobjecttypecode&$filter=iscustomprocessingstepallowed eq true`,
      ),
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch message filters for a specific message.
 * Tells us which entities are valid for that message.
 */
export function useMessageFilters(messageId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages.filters(messageId ?? ''),
    queryFn: () =>
      dataverseClient.getCollection<SdkMessageFilter>(
        `${endpoints.messageFilters.list}?$filter=_sdkmessageid_value eq ${messageId} and iscustomprocessingstepallowed eq true&$select=sdkmessagefilterid,primaryobjecttypecode,secondaryobjecttypecode,_sdkmessageid_value`,
      ),
    enabled: !!messageId,
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch entity attributes for the attribute picker (filtering attributes).
 */
export function useEntityAttributes(entityLogicalName: string | undefined) {
  return useQuery({
    queryKey: queryKeys.entities.attributes(entityLogicalName ?? ''),
    queryFn: async () => {
      const data = await dataverseClient.get<{
        value: Array<{
          LogicalName: string;
          DisplayName: { UserLocalizedLabel?: { Label: string } };
          AttributeType: string;
        }>;
      }>(endpoints.entityMetadata.attributes(entityLogicalName!));
      return data.value
        .filter((a) => a.AttributeType !== 'Virtual')
        .map((a) => ({
          logicalName: a.LogicalName,
          displayName:
            a.DisplayName?.UserLocalizedLabel?.Label ?? a.LogicalName,
        }))
        .sort((a, b) => a.logicalName.localeCompare(b.logicalName));
    },
    enabled: !!entityLogicalName && entityLogicalName !== 'none',
    staleTime: 10 * 60_000,
  });
}

/**
 * Fetch system users for impersonation picker.
 */
export function useSystemUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () =>
      dataverseClient.getCollection<SystemUser>(
        `${endpoints.users.list}?$select=systemuserid,fullname,internalemailaddress&$filter=isdisabled eq false and accessmode ne 3&$orderby=fullname&$top=500`,
      ),
    staleTime: 5 * 60_000,
  });
}
