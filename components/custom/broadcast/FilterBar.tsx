import { Filter } from "@/app/dashboard/broadcast/page";
import { ChevronDown, RotateCcw, Search } from "lucide-react";

export function FilterBar({
  filters,
  roles,
  onChange,
  onReset,
}: {
  filters: Filter;
  roles: string[];
  onChange: (f: Partial<Filter>) => void;
  onReset: () => void;
}) {
  const hasActive =
    !!filters.search ||
    !!filters.role ||
    filters.dateRange !== "all" ||
    filters.activeOnly;

  return (
    <fieldset className="border-0 p-0 m-0 mb-4">
      <legend className="sr-only">Filter users</legend>
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-50">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="user-search"
            type="search"
            placeholder="Search name or email…"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            aria-label="Search users by name or email"
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm
              text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:border-transparent transition"
          />
        </div>

        {/* Date range */}
        <div className="relative">
          <label htmlFor="date-filter" className="sr-only">
            Filter by join date
          </label>
          <select
            id="date-filter"
            value={filters.dateRange}
            onChange={(e) =>
              onChange({ dateRange: e.target.value as Filter["dateRange"] })
            }
            className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm
              text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
          >
            <option value="all">Any join date</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <ChevronDown
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Reset */}
        {hasActive && (
          <button
            onClick={onReset}
            aria-label="Reset all filters"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-800
              hover:bg-slate-100 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>
    </fieldset>
  );
}
