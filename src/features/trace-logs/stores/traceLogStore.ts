import { create } from 'zustand';

export type DatePreset = '1h' | '24h' | '7d' | '30d' | 'all';

export type SortField =
  | 'createdon'
  | 'typename'
  | 'messagename'
  | 'primaryentity'
  | 'mode'
  | 'performanceexecutionduration'
  | 'depth';

export type SortDirection = 'asc' | 'desc';

export interface TraceLogFilters {
  datePreset: DatePreset;
  typeName: string;
  messageName: string;
  primaryEntity: string;
  mode: number | null; // null = all, 0 = sync, 1 = async
  errorsOnly: boolean;
}

const DEFAULT_FILTERS: TraceLogFilters = {
  datePreset: '24h',
  typeName: '',
  messageName: '',
  primaryEntity: '',
  mode: null,
  errorsOnly: false,
};

interface TraceLogState {
  filters: TraceLogFilters;
  setFilters: (partial: Partial<TraceLogFilters>) => void;
  resetFilters: () => void;

  selectedLogId: string | null;
  setSelectedLogId: (id: string | null) => void;

  /** Cursor-based pagination (Dataverse doesn't support $skip on plugintracelogs) */
  pageIndex: number;
  pageSize: number;
  /** pageCursors[i] holds the @odata.nextLink URL that fetches page i+1 */
  pageCursors: string[];
  setPageCursor: (forPageIndex: number, cursor: string) => void;
  goNextPage: () => void;
  goPrevPage: () => void;

  sortField: SortField;
  sortDirection: SortDirection;
  setSort: (field: SortField) => void;
}

export const useTraceLogStore = create<TraceLogState>()((set) => ({
  filters: { ...DEFAULT_FILTERS },
  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
      pageIndex: 0,
      pageCursors: [],
      selectedLogId: null,
    })),
  resetFilters: () =>
    set({
      filters: { ...DEFAULT_FILTERS },
      pageIndex: 0,
      pageCursors: [],
      selectedLogId: null,
    }),

  selectedLogId: null,
  setSelectedLogId: (id) => set({ selectedLogId: id }),

  pageIndex: 0,
  pageSize: 50,
  pageCursors: [],
  setPageCursor: (forPageIndex, cursor) =>
    set((state) => {
      const cursors = [...state.pageCursors];
      cursors[forPageIndex] = cursor;
      return { pageCursors: cursors };
    }),
  goNextPage: () =>
    set((state) => {
      // Only advance if we have a cursor for the next page
      if (state.pageCursors[state.pageIndex]) {
        return { pageIndex: state.pageIndex + 1, selectedLogId: null };
      }
      return {};
    }),
  goPrevPage: () =>
    set((state) => ({
      pageIndex: Math.max(0, state.pageIndex - 1),
      selectedLogId: null,
    })),

  sortField: 'createdon',
  sortDirection: 'desc',
  setSort: (field) =>
    set((state) => ({
      sortField: field,
      sortDirection:
        state.sortField === field
          ? state.sortDirection === 'desc'
            ? 'asc'
            : 'desc'
          : field === 'createdon'
            ? 'desc'
            : 'asc',
      pageIndex: 0,
      pageCursors: [],
    })),
}));

/** Convert a date preset to an ISO date string for OData filtering */
export function getFromDate(preset: DatePreset): string | null {
  const now = new Date();
  switch (preset) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case 'all':
      return null;
  }
}
