"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TabSwitcher } from "@/components/custom/broadcast/Broadcast";
import { FilterBar } from "@/components/custom/broadcast/FilterBar";
import { UserTable } from "@/components/custom/broadcast/UserTable";
import {
  EmailForm,
  NotificationForm,
  TransactionForm,
} from "@/components/custom/broadcast/Forms";
import { SelectionBanner } from "@/components/custom/broadcast/SelectionBanner";
import { Pagination } from "@/components/custom/Pagination";

export type Tab = "email" | "notification" | "transaction";
export type NotifType = "info" | "success" | "warning" | "error";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface Filter {
  role: string;
  search: string;
  dateRange: "all" | "7d" | "30d" | "90d";
  activeOnly: boolean;
}

const PAGE_SIZE = 10;
const supabase = createClient();

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl
        border shadow-lg text-sm font-medium max-w-sm
        ${
          type === "success"
            ? "bg-white border-emerald-200 text-emerald-800"
            : "bg-white border-red-200 text-red-800"
        }`}
    >
      {type === "success" ? (
        <CheckCircle2
          className="w-4 h-4 text-emerald-500 shrink-0"
          aria-hidden="true"
        />
      ) : (
        <AlertCircle
          className="w-4 h-4 text-red-500 shrink-0"
          aria-hidden="true"
        />
      )}
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="ml-2 p-0.5 text-slate-400 hover:text-slate-700 rounded transition
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

const DEFAULT_FILTERS: Filter = {
  role: "",
  search: "",
  dateRange: "all",
  activeOnly: false,
};

const BroadcastPage = () => {
  const [tab, setTab] = useState<Tab>("email");
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filter>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, role, created_at")
          .eq("role", "USER")
          .order("created_at", { ascending: false });
        if (error) throw error;
        const fetched = (data as User[]) || [];
        setUsers(fetched);
        setRoles(
          Array.from(new Set(fetched.map((u) => u.role).filter(Boolean))),
        );
      } catch {
        setToast({ message: "Failed to load users", type: "error" });
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  useEffect(() => {
    let result = [...users];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.first_name?.toLowerCase().includes(q) ||
          u.last_name?.toLowerCase().includes(q),
      );
    }
    if (filters.role) result = result.filter((u) => u.role === filters.role);
    if (filters.dateRange !== "all") {
      const days = { "7d": 7, "30d": 30, "90d": 90 }[filters.dateRange];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter((u) => new Date(u.created_at) >= cutoff);
    }
    if (filters.activeOnly) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      result = result.filter(
        (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= cutoff,
      );
    }
    setFilteredUsers(result);
  }, [users, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage]);

  const handleFilterChange = (partial: Partial<Filter>) =>
    setFilters((f) => ({ ...f, ...partial }));

  const handleToggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const handleToggleAll = () => {
    if (paginatedUsers.every((u) => selected.has(u.id))) {
      setSelected((prev) => {
        const n = new Set(prev);
        paginatedUsers.forEach((u) => n.delete(u.id));
        return n;
      });
    } else {
      setSelected((prev) => {
        const n = new Set(prev);
        paginatedUsers.forEach((u) => n.add(u.id));
        return n;
      });
    }
  };

  const handleSelectAll = () =>
    setSelected(new Set(filteredUsers.map((u) => u.id)));
  const handleClear = () => setSelected(new Set());
  const selectedUsers = filteredUsers.filter((u) => selected.has(u.id));

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSendEmail = useCallback(
    async (subject: string, body: string) => {
      setSending(true);
      try {
        const recipients = selectedUsers.map((u) => ({
          id: u.id,
          email: u.email,
          name: `${u.first_name} ${u.last_name}`,
        }));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SMTP_URL}/send-bulk-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, body, recipients }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.message || `HTTP error! status: ${response.status}`,
          );
        }

        setToast({
          message: `Email sent to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}`,
          type: "success",
        });
        handleClear();
      } catch (err) {
        setToast({ message: "Failed to send email", type: "error" });
      } finally {
        setSending(false);
      }
    },
    [selectedUsers],
  );

  const handleSendNotification = useCallback(
    async (title: string, message: string, type: string, link: string) => {
      setSending(true);
      try {
        const rows = selectedUsers.map((u) => ({
          user_id: u.id,
          title,
          message,
          type,
          read: false,
          created_at: new Date().toISOString(),
        }));
        const { error } = await supabase.from("notifications").insert(rows);
        if (error) throw error;
        setToast({
          message: `Notification sent to ${rows.length} user${rows.length !== 1 ? "s" : ""}`,
          type: "success",
        });
        handleClear();
      } catch {
        setToast({ message: "Failed to send notification", type: "error" });
      } finally {
        setSending(false);
      }
    },
    [selectedUsers],
  );

  const composeHeading =
    tab === "email"
      ? "Compose Email"
      : tab === "notification"
        ? "Compose Notification"
        : "Record Transaction";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="space-y-6">
        {/* ── Page header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6900]">
              Admin Broadcast
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Broadcast
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Send emails, in-app notifications, or record transactions for
              selected users.
            </p>
          </div>
          <TabSwitcher
            active={tab}
            onChange={(t) => {
              setTab(t);
              handleClear();
            }}
          />
        </header>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          {/* Left — Recipients */}
          <section aria-labelledby="recipients-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                id="recipients-heading"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Select Recipients
              </h2>
              <span
                className="text-xs text-slate-400"
                aria-live="polite"
                aria-atomic="true"
              >
                {loadingUsers
                  ? "Loading…"
                  : `${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            <FilterBar
              filters={filters}
              roles={roles}
              onChange={handleFilterChange}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />

            <SelectionBanner
              count={selected.size}
              total={filteredUsers.length}
              onSelectAll={handleSelectAll}
              onClear={handleClear}
            />

            <UserTable
              users={paginatedUsers}
              selected={selected}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
              loading={loadingUsers}
            />

            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={PAGE_SIZE}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </section>

          {/* Right — Compose panel */}
          <aside
            aria-labelledby="compose-heading"
            className="xl:sticky xl:top-6"
          >
            <h2
              id="compose-heading"
              className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3"
            >
              {composeHeading}
            </h2>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              {selected.size === 0 && (
                <p
                  role="note"
                  className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border
                    border-slate-100 rounded-lg px-3 py-2.5 mb-5"
                >
                  <Info
                    className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400"
                    aria-hidden="true"
                  />
                  Select at least one recipient from the table.
                </p>
              )}

              {tab === "email" ? (
                <EmailForm
                  selectedUsers={selectedUsers}
                  onSend={handleSendEmail}
                  sending={sending}
                />
              ) : tab === "notification" ? (
                <NotificationForm
                  selectedUsers={selectedUsers}
                  onSend={handleSendNotification}
                  sending={sending}
                />
              ) : (
                // Transaction tab — TransactionForm manages its own sending state
                // and calls onSuccess/onError to surface toasts in the parent.
                <TransactionForm
                  selectedUsers={selectedUsers}
                  onSuccess={(msg) => {
                    setToast({ message: msg, type: "success" });
                    handleClear();
                  }}
                  onError={(msg) => setToast({ message: msg, type: "error" })}
                />
              )}
            </div>
          </aside>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default BroadcastPage;
