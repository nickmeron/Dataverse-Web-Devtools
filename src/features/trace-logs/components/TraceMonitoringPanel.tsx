import { useMemo, useState, useCallback, useRef } from 'react';
import type { PluginTraceLog } from '@/shared/types/dataverse';
import { Loader2, TrendingUp, AlertTriangle, Zap, Clock } from 'lucide-react';

// ─── Color tokens (Tailwind CSS variable values) ────────────────────────────
const COLORS = {
  success: 'var(--color-success)',
  danger: 'var(--color-danger)',
  accent: 'var(--color-accent)',
  warning: 'var(--color-warning)',
  muted: 'color-mix(in srgb, var(--color-surface-500) 60%, transparent)',
};

const BAR_PALETTE = [
  'var(--color-accent)',
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f43f5e', // rose
];

// ─── Helper: extract short class name from assembly-qualified typename ──────
function shortTypeName(typename: string | undefined): string {
  if (!typename) return 'Unknown';
  // typename may be assembly-qualified: "Namespace.Class, Version=1.0.0.0, ..."
  const beforeComma = typename.split(',')[0] ?? typename;
  return beforeComma.split('.').pop() ?? beforeComma;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface StatsData {
  totalCount: number;
  sampleSize: number;
  errorCount: number;
  successCount: number;
  errorRate: number;
  avgDuration: number;
  p95Duration: number;
  maxDuration: number;
  durationBuckets: { label: string; count: number; color: string }[];
  topPlugins: { name: string; count: number; errors: number }[];
  timeline: { label: string; count: number; errors: number }[];
}

// ─── Adaptive time bucketing for the timeline chart ─────────────────────────
function buildTimeline(
  logs: PluginTraceLog[],
): { label: string; count: number; errors: number }[] {
  if (logs.length === 0) return [];

  const groupBy = (keyFn: (d: Date) => string) => {
    const groups = new Map<string, { count: number; errors: number }>();
    for (const log of logs) {
      const d = new Date(log.createdon);
      const key = keyFn(d);
      const entry = groups.get(key) ?? { count: 0, errors: 0 };
      entry.count++;
      if (log.exceptiondetails) entry.errors++;
      groups.set(key, entry);
    }
    return [...groups.entries()]
      .map(([label, data]) => ({ label, ...data }))
      .reverse(); // oldest first
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  // Try hour-level grouping first
  const hourly = groupBy(
    (d) => `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:00`,
  );
  if (hourly.length >= 3) return hourly;

  // Fall back to 10-minute intervals
  const tenMin = groupBy(
    (d) =>
      `${pad(d.getHours())}:${pad(Math.floor(d.getMinutes() / 10) * 10)}`,
  );
  if (tenMin.length >= 3) return tenMin;

  // Fall back to 5-minute intervals
  const fiveMin = groupBy(
    (d) =>
      `${pad(d.getHours())}:${pad(Math.floor(d.getMinutes() / 5) * 5)}`,
  );
  if (fiveMin.length >= 3) return fiveMin;

  // Minute-level as final fallback
  return groupBy(
    (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  );
}

function computeStats(
  logs: PluginTraceLog[],
  totalCount: number,
): StatsData {
  const sampleSize = logs.length;
  const errorCount = logs.filter((l) => !!l.exceptiondetails).length;
  const successCount = sampleSize - errorCount;
  const errorRate = sampleSize > 0 ? (errorCount / sampleSize) * 100 : 0;

  const durations = logs
    .map((l) => l.performanceexecutionduration)
    .sort((a, b) => a - b);
  const avgDuration =
    sampleSize > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / sampleSize)
      : 0;
  const p95Duration =
    sampleSize > 0 ? durations[Math.floor(sampleSize * 0.95)] ?? 0 : 0;
  const maxDuration = sampleSize > 0 ? durations[sampleSize - 1] ?? 0 : 0;

  // Duration buckets
  const bucketDefs = [
    { label: '<100ms', max: 100, color: COLORS.success },
    { label: '100-500ms', max: 500, color: COLORS.accent },
    { label: '0.5-2s', max: 2000, color: COLORS.warning },
    { label: '>2s', max: Infinity, color: COLORS.danger },
  ];
  const durationBuckets = bucketDefs.map((b, i) => {
    const min = i === 0 ? 0 : bucketDefs[i - 1]!.max;
    return {
      label: b.label,
      count: logs.filter(
        (l) =>
          l.performanceexecutionduration >= min &&
          l.performanceexecutionduration < b.max,
      ).length,
      color: b.color,
    };
  });

  // Top plugins by count (using short typename)
  const pluginCounts = new Map<string, { count: number; errors: number }>();
  for (const log of logs) {
    const name = shortTypeName(log.typename);
    const entry = pluginCounts.get(name) ?? { count: 0, errors: 0 };
    entry.count++;
    if (log.exceptiondetails) entry.errors++;
    pluginCounts.set(name, entry);
  }
  const topPlugins = [...pluginCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([name, data]) => ({ name, ...data }));

  // Timeline with adaptive bucketing
  const timeline = buildTimeline(logs);

  return {
    totalCount,
    sampleSize,
    errorCount,
    successCount,
    errorRate,
    avgDuration,
    p95Duration,
    maxDuration,
    durationBuckets,
    topPlugins,
    timeline,
  };
}

// ─── Tooltip infrastructure ─────────────────────────────────────────────────
interface TooltipData {
  x: number;
  y: number;
  content: React.ReactNode;
}

function useChartTooltip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const show = useCallback(
    (e: React.MouseEvent, content: React.ReactNode) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        content,
      });
    },
    [],
  );

  const hide = useCallback(() => setTooltip(null), []);

  return { containerRef, tooltip, show, hide };
}

function ChartTooltip({ data }: { data: TooltipData | null }) {
  if (!data) return null;
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-md border border-surface-600 bg-surface-800/95 px-2.5 py-1.5 shadow-xl backdrop-blur-sm"
      style={{
        left: data.x,
        top: data.y,
        transform: 'translate(-50%, -100%) translateY(-8px)',
      }}
    >
      {data.content}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function TraceMonitoringPanel({
  logs,
  totalCount,
  isLoading,
}: {
  logs: PluginTraceLog[];
  totalCount: number;
  isLoading: boolean;
}) {
  const stats = useMemo(
    () => computeStats(logs, totalCount),
    [logs, totalCount],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center border-b border-surface-700/50 bg-surface-800/20 py-8">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  if (stats.sampleSize === 0) return null;

  return (
    <div className="border-b border-surface-700/50 bg-surface-800/20">
      {/* Stats cards row */}
      <div className="grid grid-cols-4 gap-px border-b border-surface-700/50 bg-surface-700/30">
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Total Logs"
          value={stats.totalCount.toLocaleString()}
          sub={`Sample: ${stats.sampleSize}`}
          color="text-accent"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Error Rate"
          value={`${stats.errorRate.toFixed(1)}%`}
          sub={`${stats.errorCount} of ${stats.sampleSize}`}
          color={stats.errorRate > 10 ? 'text-danger' : 'text-success'}
        />
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="Avg Duration"
          value={`${stats.avgDuration.toLocaleString()} ms`}
          sub={`P95: ${stats.p95Duration.toLocaleString()} ms`}
          color={
            stats.avgDuration > 2000
              ? 'text-danger'
              : stats.avgDuration > 500
                ? 'text-warning'
                : 'text-success'
          }
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Max Duration"
          value={`${stats.maxDuration.toLocaleString()} ms`}
          color={
            stats.maxDuration > 5000 ? 'text-danger' : 'text-surface-300'
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-4 gap-px bg-surface-700/30">
        <div className="bg-surface-900/60 p-3">
          <ChartTitle>Success / Error</ChartTitle>
          <DonutChart
            success={stats.successCount}
            errors={stats.errorCount}
          />
        </div>
        <div className="bg-surface-900/60 p-3">
          <ChartTitle>Duration Distribution</ChartTitle>
          <DurationHistogram
            buckets={stats.durationBuckets}
            total={stats.sampleSize}
          />
        </div>
        <div className="bg-surface-900/60 p-3">
          <ChartTitle>Top Plugins</ChartTitle>
          <TopPluginsChart plugins={stats.topPlugins} />
        </div>
        <div className="bg-surface-900/60 p-3">
          <ChartTitle>Execution Timeline</ChartTitle>
          <TimelineChart timeline={stats.timeline} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-surface-900/60 px-4 py-3">
      <div className={`${color} opacity-60`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-surface-500">
          {label}
        </p>
        <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
        {sub && (
          <p className="text-[10px] tabular-nums text-surface-500">{sub}</p>
        )}
      </div>
    </div>
  );
}

function ChartTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
      {children}
    </p>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function DonutChart({
  success,
  errors,
}: {
  success: number;
  errors: number;
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip();
  const total = success + errors;
  if (total === 0) return <EmptyChart />;

  const successPct = success / total;
  const errorPct = errors / total;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const successLen = successPct * circumference;
  const errorLen = circumference - successLen;

  const successTip = (
    <span className="text-[10px] tabular-nums text-surface-200">
      <span className="font-semibold text-green-400">Success:</span>{' '}
      {success} ({(successPct * 100).toFixed(1)}%)
    </span>
  );
  const errorTip = (
    <span className="text-[10px] tabular-nums text-surface-200">
      <span className="font-semibold text-red-400">Errors:</span> {errors} (
      {(errorPct * 100).toFixed(1)}%)
    </span>
  );

  return (
    <div ref={containerRef} className="relative flex items-center justify-center gap-4">
      <ChartTooltip data={tooltip} />
      <svg
        width="90"
        height="90"
        viewBox="0 0 100 100"
        onMouseLeave={hide}
      >
        {/* Error ring (background — full circle) */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={COLORS.danger}
          strokeWidth="12"
          className="cursor-pointer"
          onMouseMove={(e) => show(e, errorTip)}
        />
        {/* Success ring (foreground — partial arc) */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={COLORS.success}
          strokeWidth="12"
          strokeDasharray={`${successLen} ${errorLen}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          className="cursor-pointer"
          onMouseMove={(e) => show(e, successTip)}
        />
        <text
          x="50"
          y="48"
          textAnchor="middle"
          className="pointer-events-none fill-surface-200 text-[14px] font-bold"
        >
          {total}
        </text>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          className="pointer-events-none fill-surface-500 text-[8px]"
        >
          total
        </text>
      </svg>
      <div className="flex flex-col gap-1">
        <LegendItem color={COLORS.success} label="Success" value={success} />
        <LegendItem color={COLORS.danger} label="Errors" value={errors} />
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-surface-400">{label}</span>
      <span className="text-[10px] font-semibold tabular-nums text-surface-300">
        {value}
      </span>
    </div>
  );
}

// ─── Duration Histogram ──────────────────────────────────────────────────────
function DurationHistogram({
  buckets,
  total,
}: {
  buckets: { label: string; count: number; color: string }[];
  total: number;
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip();
  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div ref={containerRef} className="relative flex h-[90px] items-end gap-2">
      <ChartTooltip data={tooltip} />
      {buckets.map((b) => {
        const heightPct = (b.count / max) * 100;
        const pctOfTotal = total > 0 ? ((b.count / total) * 100).toFixed(1) : '0';
        const tip = (
          <span className="text-[10px] tabular-nums text-surface-200">
            <span className="font-semibold">{b.label}:</span> {b.count} logs (
            {pctOfTotal}%)
          </span>
        );
        return (
          <div
            key={b.label}
            className="flex flex-1 flex-col items-center gap-1"
            onMouseMove={(e) => show(e, tip)}
            onMouseLeave={hide}
          >
            <span className="text-[9px] font-semibold tabular-nums text-surface-300">
              {b.count}
            </span>
            <div
              className="relative w-full cursor-pointer"
              style={{ height: '55px' }}
            >
              <div
                className="absolute bottom-0 w-full rounded-t transition-all hover:opacity-100"
                style={{
                  height: `${Math.max(heightPct, 3)}%`,
                  backgroundColor: b.color,
                  opacity: 0.8,
                }}
              />
            </div>
            <span className="whitespace-nowrap text-[8px] text-surface-500">
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Top Plugins Chart ───────────────────────────────────────────────────────
function TopPluginsChart({
  plugins,
}: {
  plugins: { name: string; count: number; errors: number }[];
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip();
  if (plugins.length === 0) return <EmptyChart />;
  const max = plugins[0]?.count ?? 1;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <ChartTooltip data={tooltip} />
      {plugins.map((p, i) => {
        const pct = (p.count / max) * 100;
        const errorRate =
          p.count > 0 ? ((p.errors / p.count) * 100).toFixed(1) : '0';
        const tip = (
          <div className="flex flex-col gap-0.5 text-[10px] tabular-nums text-surface-200">
            <span className="font-semibold">{p.name}</span>
            <span>
              {p.count} execution{p.count !== 1 ? 's' : ''}
              {p.errors > 0 && (
                <span className="text-red-400">
                  {' '}
                  · {p.errors} error{p.errors !== 1 ? 's' : ''} ({errorRate}%)
                </span>
              )}
            </span>
          </div>
        );
        return (
          <div
            key={p.name}
            className="flex cursor-pointer items-center gap-2"
            onMouseMove={(e) => show(e, tip)}
            onMouseLeave={hide}
          >
            <span
              className="w-[90px] truncate text-[9px] text-surface-400"
              title={p.name}
            >
              {p.name}
            </span>
            <div className="relative h-3 flex-1 overflow-hidden rounded bg-surface-800">
              <div
                className="absolute left-0 top-0 h-full rounded transition-all"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  backgroundColor: BAR_PALETTE[i % BAR_PALETTE.length],
                  opacity: 0.75,
                }}
              />
              {p.errors > 0 && (
                <div
                  className="absolute right-0 top-0 h-full rounded-r"
                  style={{
                    width: `${Math.max((p.errors / max) * 100, 1)}%`,
                    backgroundColor: COLORS.danger,
                    opacity: 0.9,
                  }}
                />
              )}
            </div>
            <span className="w-7 text-right text-[9px] font-semibold tabular-nums text-surface-300">
              {p.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Timeline Chart (area sparkline) ─────────────────────────────────────────
function TimelineChart({
  timeline,
}: {
  timeline: { label: string; count: number; errors: number }[];
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip();

  if (timeline.length < 2) return <EmptyChart />;

  const max = Math.max(...timeline.map((t) => t.count), 1);
  const w = 280;
  const h = 70;
  const padY = 4;
  const usableH = h - padY * 2;

  const points = timeline.map((t, i) => {
    const x = (i / (timeline.length - 1)) * w;
    const y = padY + usableH - (t.count / max) * usableH;
    return { x, y, ...t };
  });

  // Build SVG path for area
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ');
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  // Error points
  const errorPoints = points.map((p) => {
    const ey = padY + usableH - (p.errors / max) * usableH;
    return { x: p.x, y: ey, errors: p.errors };
  });
  const errorLinePath = errorPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ');
  const errorAreaPath = `${errorLinePath} L${w},${h} L0,${h} Z`;

  // Width of each hover column
  const colW = timeline.length > 1 ? w / (timeline.length - 1) : w;

  return (
    <div ref={containerRef} className="relative flex flex-col">
      <ChartTooltip data={tooltip} />
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-[70px] w-full"
        preserveAspectRatio="none"
        onMouseLeave={hide}
      >
        <defs>
          <linearGradient id="tl-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.3" />
            <stop
              offset="100%"
              stopColor={COLORS.accent}
              stopOpacity="0.02"
            />
          </linearGradient>
          <linearGradient id="tl-err-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={COLORS.danger} stopOpacity="0.25" />
            <stop
              offset="100%"
              stopColor={COLORS.danger}
              stopOpacity="0.02"
            />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1="0"
            x2={w}
            y1={padY + usableH * (1 - pct)}
            y2={padY + usableH * (1 - pct)}
            stroke="var(--color-surface-700)"
            strokeOpacity="0.3"
            strokeDasharray="4 4"
          />
        ))}
        {/* Total area */}
        <path d={areaPath} fill="url(#tl-grad)" />
        <path
          d={linePath}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Error area */}
        {errorPoints.some((p) => p.errors > 0) && (
          <>
            <path d={errorAreaPath} fill="url(#tl-err-grad)" />
            <path
              d={errorLinePath}
              fill="none"
              stroke={COLORS.danger}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
        {/* Invisible hover columns for each data point */}
        {points.map((p, i) => (
          <rect
            key={i}
            x={p.x - colW / 2}
            y={0}
            width={colW}
            height={h}
            fill="transparent"
            className="cursor-crosshair"
            onMouseMove={(e) => {
              // Use native event clientX/Y through React synthetic event
              const tip = (
                <div className="flex flex-col gap-0.5 text-[10px] tabular-nums text-surface-200">
                  <span className="font-semibold">{p.label}</span>
                  <span>
                    {p.count} log{p.count !== 1 ? 's' : ''}
                    {p.errors > 0 && (
                      <span className="text-red-400">
                        {' '}
                        · {p.errors} error{p.errors !== 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </div>
              );
              show(e, tip);
            }}
          />
        ))}
        {/* Hover dot indicators (visible dots at each data point) */}
        {points.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r="3"
            fill={COLORS.accent}
            opacity="0"
            className="pointer-events-none transition-opacity"
          />
        ))}
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between px-0.5">
        <span className="text-[8px] text-surface-600">
          {timeline[0]?.label}
        </span>
        {timeline.length > 2 && (
          <span className="text-[8px] text-surface-600">
            {timeline[Math.floor(timeline.length / 2)]?.label}
          </span>
        )}
        <span className="text-[8px] text-surface-600">
          {timeline[timeline.length - 1]?.label}
        </span>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[90px] items-center justify-center">
      <span className="text-[10px] text-surface-600">No data</span>
    </div>
  );
}
