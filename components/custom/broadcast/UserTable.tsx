import { User } from "@/app/dashboard/broadcast/page";
import { fmtDate, getInitials } from "@/types/helpers";
import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

export function UserTable({
  users,
  selected,
  onToggle,
  onToggleAll,
  loading,
}: {
  users: User[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  loading: boolean;
}) {
  const allSelected =
    users.length > 0 && users.every((u) => selected.has(u.id));
  const someSelected = users.some((u) => selected.has(u.id)) && !allSelected;
  const headerCheckRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (headerCheckRef.current)
      headerCheckRef.current.indeterminate = someSelected;
  }, [someSelected]);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table
          className="w-full text-sm"
          aria-label="User list for recipient selection"
        >
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th scope="col" className="px-4 py-3 w-12 text-center">
                <input
                  ref={headerCheckRef}
                  type="checkbox"
                  aria-label={
                    allSelected ? "Deselect all" : "Select all on this page"
                  }
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer
                    focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                User
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell"
              >
                Role
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell"
              >
                Joined
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell"
              >
                Last active
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-4 py-3.5">
                    <div className="w-4 h-4 rounded bg-slate-200 animate-pulse mx-auto" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-28 bg-slate-200 rounded animate-pulse" />
                        <div className="h-2.5 w-40 bg-slate-100 rounded animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="h-5 w-14 bg-slate-200 rounded-full animate-pulse" />
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                  </td>
                  <td className="px-4 py-3.5 hidden xl:table-cell">
                    <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-14 text-center text-slate-400"
                >
                  <Search
                    className="w-8 h-8 mx-auto mb-2 text-slate-300"
                    aria-hidden="true"
                  />
                  <p className="text-sm">No users match the current filters.</p>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelected = selected.has(user.id);
                return (
                  <tr
                    key={user.id}
                    onClick={() => onToggle(user.id)}
                    className={`border-b border-slate-100 last:border-0 cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Select ${user.first_name || user.email}`}
                        checked={isSelected}
                        onChange={() => onToggle(user.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer
                          focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          aria-hidden="true"
                          className="shrink-0 w-8 h-8 rounded-full bg-slate-200 text-slate-600
                            flex items-center justify-center text-xs font-bold"
                        >
                          {getInitials(user)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate leading-tight">
                            {`${user.first_name} ${user.last_name}`}
                          </p>
                          <p className="text-slate-400 text-xs truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.role || "user"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-slate-500 text-xs">
                      {fmtDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-slate-500 text-xs">
                      {user.last_sign_in_at ? (
                        fmtDate(user.last_sign_in_at)
                      ) : (
                        <span className="text-slate-300">Never</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
