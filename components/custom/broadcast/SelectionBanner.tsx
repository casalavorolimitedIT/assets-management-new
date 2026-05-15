import { Users, X } from "lucide-react";

export function SelectionBanner({
  count,
  total,
  onSelectAll,
  onClear,
}: {
  count: number;
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm"
    >
      <Users className="w-4 h-4 text-blue-500 shrink-0" aria-hidden="true" />
      <span className="text-blue-800 font-semibold">{count} selected</span>
      {count < total && (
        <>
          <span className="text-blue-300" aria-hidden="true">
            ·
          </span>
          <button
            onClick={onSelectAll}
            className="text-blue-600 hover:text-blue-900 underline underline-offset-2 transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Select all {total}
          </button>
        </>
      )}
      <button
        onClick={onClear}
        aria-label="Clear selection"
        className="ml-auto p-0.5 text-blue-400 hover:text-blue-700 rounded transition
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
