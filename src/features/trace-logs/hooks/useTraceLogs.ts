import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataverseClient } from '@/shared/api/dataverseClient';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/queryKeys';
import type {
  PluginTraceLog,
  ODataCollectionResponse,
} from '@/shared/types/dataverse';
import {
  type TraceLogFilters,
  type SortField,
  type SortDirection,
  getFromDate,
} from '../stores/traceLogStore';
import toast from 'react-hot-toast';

const LIST_SELECT =
  'plugintracelogid,typename,messagename,primaryentity,mode,operationtype,depth,createdon,performanceexecutionduration,exceptiondetails,correlationid';

const DETAIL_SELECT =
  'plugintracelogid,typename,messagename,primaryentity,mode,operationtype,depth,createdon,performanceexecutionstarttime,performanceexecutionduration,performanceconstructorduration,messageblock,exceptiondetails,configuration,correlationid,requestid';

const STATS_SELECT =
  'plugintracelogid,typename,exceptiondetails,performanceexecutionduration,createdon,mode';

function buildFilterString(filters: TraceLogFilters): string {
  const clauses: string[] = [];

  const fromDate = getFromDate(filters.datePreset);
  if (fromDate) clauses.push(`createdon ge ${fromDate}`);

  if (filters.typeName.trim())
    clauses.push(`contains(typename,'${filters.typeName.trim()}')`);
  if (filters.messageName.trim())
    clauses.push(`contains(messagename,'${filters.messageName.trim()}')`);
  if (filters.primaryEntity.trim())
    clauses.push(`contains(primaryentity,'${filters.primaryEntity.trim()}')`);

  if (filters.mode !== null) clauses.push(`mode eq ${filters.mode}`);
  if (filters.errorsOnly)
    clauses.push("exceptiondetails ne null and exceptiondetails ne ''");

  return clauses.length > 0 ? clauses.join(' and ') : '';
}

/**
 * Paginated trace log list query.
 * Uses cursor-based paging via @odata.nextLink because Dataverse
 * does NOT support $skip on the plugintracelogs entity.
 */
export function useTraceLogs(
  filters: TraceLogFilters,
  pageIndex: number,
  pageSize: number,
  pageCursors: string[],
  sortField: SortField = 'createdon',
  sortDirection: SortDirection = 'desc',
) {
  return useQuery({
    queryKey: queryKeys.traceLogs.list({
      ...filters,
      pageIndex,
      pageSize,
      sortField,
      sortDirection,
    }),
    queryFn: async () => {
      let url: string;

      if (pageIndex > 0 && pageCursors[pageIndex - 1]) {
        // Subsequent pages: use the @odata.nextLink URL from the previous page
        url = pageCursors[pageIndex - 1]!;
      } else {
        // First page: build the OData query from scratch (no $skip)
        const filterStr = buildFilterString(filters);
        const parts = [
          `$select=${LIST_SELECT}`,
          `$orderby=${encodeURIComponent(`${sortField} ${sortDirection}`)}`,
          `$top=${pageSize}`,
          `$count=true`,
        ];
        if (filterStr) parts.push(`$filter=${encodeURIComponent(filterStr)}`);
        url = `${endpoints.traceLogs.list}?${parts.join('&')}`;
      }

      const result = await dataverseClient.get<
        ODataCollectionResponse<PluginTraceLog>
      >(url);

      return {
        logs: result.value,
        totalCount: result['@odata.count'] ?? 0,
        nextLink: result['@odata.nextLink'] ?? null,
      };
    },
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

/** Single trace log detail (includes messageblock) */
export function useTraceLogDetail(id: string | null) {
  return useQuery({
    queryKey: ['traceLogs', 'detail', id],
    queryFn: () =>
      dataverseClient.get<PluginTraceLog>(
        `${endpoints.traceLogs.detail(id!)}?$select=${DETAIL_SELECT}`,
      ),
    enabled: !!id,
  });
}

/** Delete a single trace log */
export function useDeleteTraceLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      dataverseClient.delete(endpoints.traceLogs.detail(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.traceLogs.all });
      toast.success('Trace log deleted');
    },
    onError: (err) =>
      toast.error(`Failed to delete: ${(err as Error).message}`),
  });
}

/** Read organization trace log setting */
export function useTraceSettings() {
  return useQuery({
    queryKey: ['traceSettings'],
    queryFn: async () => {
      const result = await dataverseClient.get<{
        value: Array<{
          organizationid: string;
          plugintracelogsetting: number;
        }>;
      }>(
        `${endpoints.organizations.list}?$select=organizationid,plugintracelogsetting&$top=1`,
      );
      return result.value[0] ?? null;
    },
    staleTime: 30_000,
  });
}

/** Fetch a larger sample for stats/charts (top 250 with minimal fields) */
export function useTraceLogStats(filters: TraceLogFilters) {
  return useQuery({
    queryKey: queryKeys.traceLogs.list({ ...filters, _stats: true }),
    queryFn: async () => {
      const filterStr = buildFilterString(filters);
      const parts = [
        `$select=${STATS_SELECT}`,
        `$orderby=${encodeURIComponent('createdon desc')}`,
        '$top=250',
        '$count=true',
      ];
      if (filterStr) parts.push(`$filter=${encodeURIComponent(filterStr)}`);

      const result = await dataverseClient.get<
        ODataCollectionResponse<PluginTraceLog>
      >(`${endpoints.traceLogs.list}?${parts.join('&')}`);

      return {
        logs: result.value,
        totalCount: result['@odata.count'] ?? 0,
      };
    },
    staleTime: 15_000,
  });
}

/** Update organization trace log setting */
export function useUpdateTraceSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orgId,
      setting,
    }: {
      orgId: string;
      setting: number;
    }) => {
      await dataverseClient.patch(endpoints.organizations.detail(orgId), {
        plugintracelogsetting: setting,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traceSettings'] });
      toast.success('Trace setting updated');
    },
    onError: (err) =>
      toast.error(`Failed to update: ${(err as Error).message}`),
  });
}
