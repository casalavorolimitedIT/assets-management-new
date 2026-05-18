"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Crown,
  Star,
  Zap,
  Filter,
  Search,
  TrendingUp,
  Wallet,
  AlertCircle,
  Loader2,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Pagination } from "../Pagination";

export type TxStatus = "pending" | "active" | "completed" | "failed";
export type TxType = "investment" | "return" | "withdrawal";

export interface Transaction {
  id: string;
  user_id: string;
  plan: string;
  type: TxType;
  amount: number;
  amount_words?: string;
  tenor?: string;
  status: TxStatus;
  description: string;
  mode_of_payment?: string;
  created_at: string;
  updated_at: string;
}

const PLAN_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; gradient: string }
> = {
  premium_plus: {
    label: "Premium Plus",
    icon: Crown,
    color: "#ff6900",
    gradient: "from-amber-500 via-orange-500 to-[#ff6900]",
  },
  premium: {
    label: "Premium",
    icon: Star,
    color: "#6366f1",
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
  },
  reif: {
    label: "REIF",
    icon: Zap,
    color: "#10b981",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
  },
};

const STATUS_META: Record<
  TxStatus,
  { label: string; icon: React.ElementType; classes: string; dot: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    classes: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-400",
  },
  active: {
    label: "Active",
    icon: TrendingUp,
    classes: "bg-blue-50 text-blue-600 border-blue-200",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-600 border-emerald-200",
    dot: "bg-emerald-500",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    classes: "bg-red-50 text-red-500 border-red-200",
    dot: "bg-red-400",
  },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const fmtTime = (s: string) =>
  new Date(s).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

function StatusBadge({ status }: { status: TxStatus }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${m.classes}`}
    >
      <span className={`size-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function TxRow({ tx, index }: { tx: Transaction; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const plan = PLAN_META[tx.plan] ?? PLAN_META.premium;
  const Icon = plan.icon;

  return (
    <div
      className="group border-b border-zinc-100 last:border-0 transition-colors hover:bg-zinc-50/80"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        {/* Icon */}
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${plan.gradient}`}
        >
          <Icon className="size-4 text-white" />
        </div>

        {/* Description */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate">
            {tx.description}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Calendar className="size-3 text-zinc-400" />
            <span className="text-xs text-zinc-400">
              {fmtDate(tx.created_at)} · {fmtTime(tx.created_at)}
            </span>
            {tx.tenor && (
              <>
                <span className="size-1 rounded-full bg-zinc-300" />
                <span className="text-xs text-zinc-400">{tx.tenor}</span>
              </>
            )}
          </div>
        </div>

        {/* Amount + status */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <p className="text-sm font-black text-zinc-900 tabular-nums">
            {fmt(tx.amount)}
          </p>
          <StatusBadge status={tx.status} />
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="mx-5 mb-4 rounded-xl bg-zinc-50 border border-zinc-200 p-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
            {[
              {
                label: "Transaction ID",
                value: tx.id.slice(0, 8).toUpperCase(),
              },
              { label: "Plan", value: plan.label },
              {
                label: "Type",
                value: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
              },
              tx.mode_of_payment && {
                label: "Payment Mode",
                value: tx.mode_of_payment,
              },
              tx.tenor && { label: "Tenor", value: tx.tenor },
              tx.amount_words && {
                label: "Amount in Words",
                value: tx.amount_words,
              },
            ]
              .filter(Boolean)
              .map((row: any) => (
                <div key={row.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {row.label}
                  </p>
                  <p className="text-xs font-semibold text-zinc-700 mt-0.5 capitalize">
                    {row.value}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-zinc-100">
        <Wallet className="size-6 text-zinc-400" />
      </div>
      <p className="text-base font-bold text-zinc-900">
        {filtered ? "No matching transactions" : "No transactions yet"}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        {filtered
          ? "Try adjusting your filters"
          : "Your investment activity will appear here"}
      </p>
    </div>
  );
}

export default function UserTransactions() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TxStatus | "all">("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      setAllTransactions(data ?? []);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load transactions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Apply filters
  const filteredTransactions = allTransactions.filter((tx) => {
    const matchSearch =
      !search ||
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.plan.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || tx.status === filterStatus;
    const matchPlan = filterPlan === "all" || tx.plan === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  // Pagination calculations
  const totalFiltered = filteredTransactions.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterPlan]);

  // Calculate summary stats from all transactions (not paginated)
  const totalInvested = allTransactions
    .filter((t) => t.type === "investment")
    .reduce((s, t) => s + t.amount, 0);

  const pendingCount = allTransactions.filter(
    (t) => t.status === "pending",
  ).length;
  const activeCount = allTransactions.filter(
    (t) => t.status === "active",
  ).length;

  const isFiltered =
    search !== "" || filterStatus !== "all" || filterPlan !== "all";

  // Group current page transactions by date
  const grouped = currentTransactions.reduce<Record<string, Transaction[]>>(
    (acc, tx) => {
      const day = new Date(tx.created_at).toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      (acc[day] ??= []).push(tx);
      return acc;
    },
    {},
  );

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="size-7 animate-spin text-[#ff6900]" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="size-7 text-red-400" />
        <p className="text-sm text-zinc-500">{fetchError}</p>
        <button
          onClick={fetchTransactions}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          <RefreshCw className="size-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-10">
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Transactions</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            All your investment activity in one place
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 transition-colors"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Summary strip ── */}
      {allTransactions.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total Invested",
              value: fmt(totalInvested),
              icon: <Wallet className="size-4" />,
              color: "text-[#ff6900]",
              bg: "bg-[#fff1e6]",
            },
            {
              label: "Transactions",
              value: allTransactions.length.toString(),
              icon: <ArrowUpRight className="size-4" />,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Pending",
              value: pendingCount.toString(),
              icon: <Clock className="size-4" />,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Active",
              value: activeCount.toString(),
              icon: <TrendingUp className="size-4" />,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
            >
              <div
                className={`mb-2 flex size-7 items-center justify-center rounded-lg ${s.bg} ${s.color}`}
              >
                {s.icon}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {s.label}
              </p>
              <p className={`mt-1 text-lg font-black tabular-nums ${s.color}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      {allTransactions.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-[#ff6900] focus:outline-none transition-colors shadow-sm"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
            <Filter className="ml-2 size-3.5 text-zinc-400" />
            {(["all", "pending", "active", "completed", "failed"] as const).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                    filterStatus === s
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {s}
                </button>
              ),
            )}
          </div>

          {/* Plan filter */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
            {(["all", "premium_plus", "premium", "reif"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilterPlan(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterPlan === p
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {p === "all" ? "All Plans" : PLAN_META[p].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Transaction list ── */}
      {filteredTransactions.length === 0 ? (
        <EmptyState filtered={isFiltered} />
      ) : (
        <>
          <div className="space-y-4">
            {Object.entries(grouped).map(([day, txs]) => (
              <div key={day}>
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {day}
                </p>
                <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
                  {txs.map((tx, i) => (
                    <TxRow key={tx.id} tx={tx} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          <div className="mt-6">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={totalFiltered}
              pageSize={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
