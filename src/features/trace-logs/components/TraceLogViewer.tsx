import type { TraceLogFilters } from '../stores/traceLogStore';
import {
  useTraceLogs,
  useTraceLogDetail,
  useTraceLogStats,
  useDeleteTraceLog,
  useTraceSettings,
  useUpdateTraceSetting,
} from '../hooks/useTraceLogs';
import { TraceMonitoringPanel } from './TraceMonitoringPanel';
import {
  useTraceLogStore,
  type DatePreset,
  type SortField,
  type SortDirection,
} from '../stores/traceLogStore';
import {
  MODE_LABELS,
  OPERATION_TYPE_LABELS,
  TRACE_SETTING,
  TRACE_SETTING_LABELS,
} from '@/config/constants';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Clock,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  '1h': 'Last Hour',
  '24h': 'Last 24h',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  all: 'All Time',
};

export function TraceLogViewer() {
  const {
    filters,
    setFilters,
    resetFilters,
    selectedLogId,
    setSelectedLogId,
    pageIndex,
    pageSize,
    pageCursors,
    setPageCursor,
    goNextPage,
    goPrevPage,
    sortField,
    sortDirection,
    setSort,
  } = useTraceLogStore();

  const { data, isLoading, isFetching, isError, error } = useTraceLogs(
    filters,
    pageIndex,
    pageSize,
    pageCursors,
    sortField,
    sortDirection,
  );
  const {
    data: statsData,
    isLoading: statsLoading,
  } = useTraceLogStats(filters);

  // Store the @odata.nextLink cursor when data loads
  useEffect(() => {
    if (data?.nextLink) {
      setPageCursor(pageIndex, data.nextLink);
    }
  }, [data?.nextLink, pageIndex, setPageCursor]);

  const logs = data?.logs ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Trace Setting Banner + Filters */}
      <TraceSettingBanner />
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        totalCount={totalCount}
        isFetching={isFetching}
      />

      {/* Query error banner */}
      {isError && (
        <div className="flex items-center gap-2 border-b border-danger/20 bg-danger/5 px-4 py-2">
          <XCircle className="h-4 w-4 shrink-0 text-danger" />
          <span className="text-xs text-danger">
            Failed to load trace logs: {(error as Error)?.message ?? 'Unknown error'}
          </span>
        </div>
      )}

      {/* Monitoring dashboard */}
      <TraceMonitoringPanel
        logs={statsData?.logs ?? []}
        totalCount={statsData?.totalCount ?? totalCount}
        isLoading={statsLoading}
      />

      {/* Main content: table + detail */}
      <div className="flex min-h-0 flex-1">
        {/* Table */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TraceTable
            logs={logs}
            isLoading={isLoading}
            selectedId={selectedLogId}
            onSelect={setSelectedLogId}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={setSort}
          />
          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between border-t border-surface-700/50 bg-surface-800/60 px-4 py-2">
              <span className="text-xs text-surface-500">
                {pageIndex * pageSize + 1}–
                {Math.min((pageIndex + 1) * pageSize, totalCount)} of{' '}
                {totalCount.toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={goPrevPage}
                  disabled={pageIndex === 0}
                  className="rounded p-1 text-surface-400 transition-colors hover:bg-surface-700 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-xs tabular-nums text-surface-400">
                  {pageIndex + 1} / {totalPages}
                </span>
                <button
                  onClick={goNextPage}
                  disabled={!data?.nextLink}
                  className="rounded p-1 text-surface-400 transition-colors hover:bg-surface-700 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedLogId && (
          <div className="w-[420px] shrink-0 border-l border-surface-700/50">
            <TraceDetail
              logId={selectedLogId}
              onClose={() => setSelectedLogId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Trace Setting Banner ---------- */
function TraceSettingBanner() {
  const { data: settings } = useTraceSettings();
  const updateSetting = useUpdateTraceSetting();

  if (!settings) return null;

  const isOff = settings.plugintracelogsetting === TRACE_SETTING.OFF;

  return (
    <div
      className={`flex items-center gap-3 border-b px-4 py-2 ${
        isOff
          ? 'border-warning/20 bg-warning/5'
          : 'border-surface-700/50 bg-surface-800/40'
      }`}
    >
      {isOff && <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
      <span className="text-xs text-surface-300">
        Trace logging:{' '}
        <span
          className={`font-semibold ${isOff ? 'text-warning' : 'text-success'}`}
        >
          {TRACE_SETTING_LABELS[settings.plugintracelogsetting]}
        </span>
        {isOff && ' — enable tracing to capture plugin execution logs'}
      </span>
      <div className="ml-auto flex items-center gap-1">
        {Object.entries(TRACE_SETTING_LABELS).map(([val, label]) => (
          <button
            key={val}
            onClick={() =>
              updateSetting.mutate({
                orgId: settings.organizationid,
                setting: Number(val),
              })
            }
            disabled={updateSetting.isPending}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              settings.plugintracelogsetting === Number(val)
                ? 'bg-accent text-white'
                : 'text-surface-400 hover:bg-surface-700 hover:text-surface-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Filter Bar ---------- */
function FilterBar({
  filters,
  setFilters,
  resetFilters,
  totalCount,
  isFetching,
}: {
  filters: TraceLogFilters;
  setFilters: (partial: Partial<TraceLogFilters>) => void;
  resetFilters: () => void;
  totalCount: number;
  isFetching: boolean;
}) {
  const hasFilters =
    filters.typeName ||
    filters.messageName ||
    filters.primaryEntity ||
    filters.mode !== null ||
    filters.errorsOnly;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-surface-700/50 bg-surface-800/30 px-4 py-2">
      {/* Date presets */}
      <div className="flex items-center gap-0.5 rounded-md border border-surface-700/50 bg-surface-900/50 p-0.5">
        {(Object.entries(DATE_PRESET_LABELS) as [DatePreset, string][]).map(
          ([preset, label]) => (
            <button
              key={preset}
              onClick={() => setFilters({ datePreset: preset })}
              className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                filters.datePreset === preset
                  ? 'bg-surface-700 text-surface-100'
                  : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {/* Text filters */}
      <FilterInput
        value={filters.typeName}
        onChange={(v) => setFilters({ typeName: v })}
        placeholder="Type name..."
      />
      <FilterInput
        value={filters.messageName}
        onChange={(v) => setFilters({ messageName: v })}
        placeholder="Message..."
      />
      <FilterInput
        value={filters.primaryEntity}
        onChange={(v) => setFilters({ primaryEntity: v })}
        placeholder="Entity..."
      />

      {/* Mode */}
      <select
        value={filters.mode === null ? '' : String(filters.mode)}
        onChange={(e) =>
          setFilters({
            mode: e.target.value === '' ? null : Number(e.target.value),
          })
        }
        className="rounded-md border border-surface-700/50 bg-surface-900/50 px-2 py-1 text-[11px] text-surface-300 outline-none"
      >
        <option value="">All Modes</option>
        <option value="0">Sync</option>
        <option value="1">Async</option>
      </select>

      {/* Errors only */}
      <label className="flex items-center gap-1.5 text-[11px] text-surface-400">
        <input
          type="checkbox"
          checked={filters.errorsOnly}
          onChange={(e) => setFilters({ errorsOnly: e.target.checked })}
          className="rounded border-surface-600"
        />
        Errors only
      </label>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-[11px] text-surface-500 hover:text-surface-300"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      )}

      <span className="ml-auto flex items-center gap-2 text-[11px] tabular-nums text-surface-500">
        {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
        {totalCount.toLocaleString()} logs
      </span>
    </div>
  );
}

function FilterInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-surface-700/50 bg-surface-900/50 px-2 py-1">
      <Search className="h-3 w-3 text-surface-600" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-20 bg-transparent text-[11px] text-surface-200 placeholder:text-surface-600 outline-none"
      />
      {value && (
        <button onClick={() => onChange('')} className="text-surface-500">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ---------- Sortable Column Header ---------- */
function SortHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  align,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  align?: 'right';
}) {
  const isActive = sortField === field;
  return (
    <th
      className={`cursor-pointer select-none px-3 py-2 font-medium transition-colors hover:text-surface-300 ${
        align === 'right' ? 'text-right' : ''
      } ${isActive ? 'text-surface-200' : ''}`}
      onClick={() => onSort(field)}
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {label}
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/th:opacity-50" />
        )}
      </span>
    </th>
  );
}

/* ---------- Trace Table ---------- */
function TraceTable({
  logs,
  isLoading,
  selectedId,
  onSelect,
  sortField,
  sortDirection,
  onSort,
}: {
  logs: import('@/shared/types/dataverse').PluginTraceLog[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="text-sm text-surface-500">
            Loading trace logs...
          </span>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <Clock className="h-8 w-8 text-surface-600" />
          <p className="text-sm font-medium text-surface-400">
            No trace logs found
          </p>
          <p className="text-xs text-surface-600">
            Try adjusting your filters or ensure tracing is enabled
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 z-10 bg-surface-800 text-surface-500">
          <tr className="border-b border-surface-700/50">
            <th className="w-8 px-3 py-2" />
            <SortHeader label="Time" field="createdon" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Plugin Type" field="typename" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Message" field="messagename" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Entity" field="primaryentity" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Mode" field="mode" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
            <SortHeader label="Duration" field="performanceexecutionduration" sortField={sortField} sortDirection={sortDirection} onSort={onSort} align="right" />
            <SortHeader label="Depth" field="depth" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const hasError = !!log.exceptiondetails;
            const isSelected = log.plugintracelogid === selectedId;
            const shortType =
              (log.typename?.split(',')[0] ?? log.typename)?.split('.').pop() ?? log.typename;

            return (
              <tr
                key={log.plugintracelogid}
                onClick={() => onSelect(log.plugintracelogid)}
                className={`cursor-pointer border-b border-surface-700/20 transition-colors ${
                  isSelected
                    ? 'bg-accent/10'
                    : hasError
                      ? 'bg-danger/5 hover:bg-danger/10'
                      : 'hover:bg-surface-800/50'
                }`}
              >
                <td className="px-3 py-2">
                  {hasError ? (
                    <XCircle className="h-3.5 w-3.5 text-danger" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-surface-400">
                  {formatTime(log.createdon)}
                </td>
                <td
                  className="max-w-[200px] truncate px-3 py-2 font-medium text-surface-200"
                  title={log.typename}
                >
                  {shortType}
                </td>
                <td className="px-3 py-2 text-surface-300">
                  {log.messagename}
                </td>
                <td className="px-3 py-2 text-surface-400">
                  {log.primaryentity || '—'}
                </td>
                <td className="px-3 py-2 text-surface-500">
                  {MODE_LABELS[log.mode] ?? '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-surface-300">
                  <DurationBadge ms={log.performanceexecutionduration} />
                </td>
                <td className="px-3 py-2 tabular-nums text-surface-500">
                  {log.depth}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DurationBadge({ ms }: { ms: number }) {
  let color = 'text-success';
  if (ms > 2000) color = 'text-danger';
  else if (ms > 500) color = 'text-warning';

  return <span className={color}>{ms.toLocaleString()} ms</span>;
}

/* ---------- Trace Detail ---------- */
function TraceDetail({
  logId,
  onClose,
}: {
  logId: string;
  onClose: () => void;
}) {
  const { data: log, isLoading } = useTraceLogDetail(logId);
  const deleteLog = useDeleteTraceLog();
  const [copiedBlock, setCopiedBlock] = useState(false);

  if (isLoading || !log) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  const hasError = !!log.exceptiondetails;

  const handleCopyBlock = () => {
    const text = log.messageblock || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBlock(true);
      setTimeout(() => setCopiedBlock(false), 2000);
    });
  };

  const handleDelete = () => {
    deleteLog.mutate(logId, { onSuccess: onClose });
  };

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-700/50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-surface-100">
            {(log.typename?.split(',')[0] ?? log.typename)?.split('.').pop() ?? log.typename}
          </h3>
          <p className="text-xs text-surface-500">{log.typename}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={deleteLog.isPending}
            className="rounded p-1 text-surface-500 transition-colors hover:bg-danger/10 hover:text-danger"
            title="Delete this trace log"
          >
            {deleteLog.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-surface-500 transition-colors hover:bg-surface-700 hover:text-surface-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status indicator */}
      <div
        className={`flex items-center gap-2 px-4 py-2 ${
          hasError ? 'bg-danger/5' : 'bg-success/5'
        }`}
      >
        {hasError ? (
          <XCircle className="h-4 w-4 text-danger" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-success" />
        )}
        <span
          className={`text-xs font-medium ${hasError ? 'text-danger' : 'text-success'}`}
        >
          {hasError ? 'Failed with Exception' : 'Completed Successfully'}
        </span>
        <span className="ml-auto text-xs tabular-nums text-surface-500">
          {log.performanceexecutionduration.toLocaleString()} ms
        </span>
      </div>

      {/* Metadata */}
      <div className="space-y-0 border-b border-surface-700/50">
        <DetailRow label="Message" value={log.messagename} />
        <DetailRow label="Entity" value={log.primaryentity || '—'} />
        <DetailRow label="Mode" value={MODE_LABELS[log.mode] ?? '—'} />
        <DetailRow
          label="Operation"
          value={OPERATION_TYPE_LABELS[log.operationtype] ?? '—'}
        />
        <DetailRow label="Depth" value={String(log.depth)} />
        <DetailRow
          label="Created"
          value={new Date(log.createdon).toLocaleString()}
        />
        <DetailRow
          label="Execution Start"
          value={
            log.performanceexecutionstarttime
              ? new Date(log.performanceexecutionstarttime).toLocaleString()
              : '—'
          }
        />
        <DetailRow
          label="Exec Duration"
          value={`${log.performanceexecutionduration.toLocaleString()} ms`}
        />
        <DetailRow
          label="Constructor"
          value={`${log.performanceconstructorduration?.toLocaleString() ?? 0} ms`}
        />
        {log.correlationid && (
          <DetailRow label="Correlation ID" value={log.correlationid} mono />
        )}
        {log.requestid && (
          <DetailRow label="Request ID" value={log.requestid} mono />
        )}
      </div>

      {/* Exception */}
      {hasError && (
        <div className="border-b border-surface-700/50">
          <div className="flex items-center gap-2 px-4 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-danger" />
            <span className="text-xs font-semibold text-danger">
              Exception Details
            </span>
          </div>
          <pre className="max-h-48 overflow-auto bg-danger/5 px-4 py-2 font-mono text-[11px] leading-relaxed text-danger/80">
            {log.exceptiondetails}
          </pre>
        </div>
      )}

      {/* Message Block (trace output) */}
      {log.messageblock && (
        <div className="min-h-0 flex-1">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs font-semibold text-surface-400">
              Trace Output
            </span>
            <button
              onClick={handleCopyBlock}
              className="flex items-center gap-1 text-[11px] text-surface-500 hover:text-surface-300"
            >
              {copiedBlock ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="overflow-auto px-4 pb-4 font-mono text-[11px] leading-relaxed text-surface-300">
            {log.messageblock}
          </pre>
        </div>
      )}

      {/* Unsecure Config */}
      {log.configuration && (
        <div className="border-t border-surface-700/50">
          <div className="px-4 py-2">
            <span className="text-xs font-semibold text-surface-400">
              Unsecure Configuration
            </span>
          </div>
          <pre className="overflow-auto px-4 pb-4 font-mono text-[11px] text-surface-400">
            {log.configuration}
          </pre>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 px-4 py-1.5">
      <span className="w-28 shrink-0 text-[11px] text-surface-500">
        {label}
      </span>
      <span
        className={`min-w-0 flex-1 break-all text-[11px] text-surface-200 ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ---------- Helpers ---------- */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  // Today: show time only
  if (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  ) {
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  // Within 7 days: show day + time
  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Older: show full date
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
