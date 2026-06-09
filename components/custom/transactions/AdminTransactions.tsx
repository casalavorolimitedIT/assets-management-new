"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  Download,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { normalizeRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import type { Compliance, InvestmentPlan, UserProfile } from "@/types";
import type { Transaction, TxStatus } from "./UserTransactions";
import { Pagination } from "../Pagination";
import {
  generateStatement,
  generateReceipt,
  type TxForPdf,
} from "@/lib/pdf/transactions";

interface AdminTransaction extends Transaction {
  user?: UserProfile;
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

const PAGE_SIZE = 10;

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

function getUserName(user?: UserProfile) {
  if (!user) return "Unknown investor";
  return (
    [user.title, user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.email
  );
}

function getInitials(user?: UserProfile) {
  if (!user) return "U";
  return (
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
    "U"
  );
}

function isMetamapVerified(status?: string | null) {
  if (!status) return false;
  return ["approved", "verified", "completed"].includes(
    status.trim().toLowerCase(),
  );
}

function parseCompliance(compliance: unknown): Partial<Compliance> | null {
  if (!compliance) return null;
  if (typeof compliance !== "string") return compliance as Partial<Compliance>;

  try {
    return JSON.parse(compliance) as Partial<Compliance>;
  } catch {
    return null;
  }
}

function getInvestmentPlans(compliance: unknown): InvestmentPlan[] {
  const parsed = parseCompliance(compliance);
  if (Array.isArray(parsed?.investment_plans)) return parsed.investment_plans;
  return parsed?.investment_plan ? [parsed.investment_plan] : [];
}

function getMonthlyPlanAmount(plan: InvestmentPlan) {
  return Number(plan.monthly_amount_figures ?? 0) || 0;
}

function buildApprovalEmailBody(tx: AdminTransaction, planLabel: string) {
  const investorName = getUserName(tx.user);
  const paymentMode = tx.mode_of_payment ?? "Not specified";
  const tenor = tx.tenor ?? "N/A";
  const transactionDate = fmtDate(tx.created_at);
  const amount = fmt(tx.amount);

  return `
    <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; padding: 32px 16px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);">
        <div style="background: linear-gradient(90deg, #ff6900 0%, #ff9f5a 100%); padding: 28px 32px; text-align: center; color: #ffffff;">
          <p style="font-size: 14px; letter-spacing: 0.2em; margin: 0; text-transform: uppercase; opacity: 0.9;">Casalavoro Limited</p>
          <h1 style="font-size: 28px; font-weight: 800; margin: 12px 0 0;">Payment Approved</h1>
        </div>

        <div style="padding: 32px; color: #111827;">
          <p style="font-size: 16px; margin: 0 0 20px;">Hi ${investorName},</p>
          <p style="font-size: 16px; margin: 0 0 24px; color: #334155;">Your payment for the <strong>${planLabel}</strong> investment plan has been approved and is now active. We have updated your account and you can view the investment details in your dashboard.</p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 16px; font-weight: 700; margin: 0 0 16px; color: #0f172a;">Payment summary</h2>
            <table style="width: 100%; border-collapse: collapse; color: #334155; font-size: 15px;">
              <tbody>
                <tr>
                  <td style="padding: 10px 0; width: 170px; color: #64748b;">Transaction ID</td>
                  <td style="padding: 10px 0;">${tx.id.toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b;">Plan</td>
                  <td style="padding: 10px 0;">${planLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b;">Amount</td>
                  <td style="padding: 10px 0;">${amount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b;">Tenor</td>
                  <td style="padding: 10px 0;">${tenor}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b;">Payment mode</td>
                  <td style="padding: 10px 0;">${paymentMode}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b;">Date</td>
                  <td style="padding: 10px 0;">${transactionDate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style="font-size: 16px; margin: 0 0 20px; color: #475569;">If you have any questions, reply to this email and our support team will assist you promptly.</p>
          <p style="font-size: 16px; margin: 0 0 4px; color: #0f172a;">Thank you for investing with us.</p>
          <p style="font-size: 16px; color: #64748b; margin: 0;">Casalavoro Limited</p>
        </div>

        <div style="background: #f8fafc; padding: 20px 32px; text-align: center; color: #475569; font-size: 14px;">
          <p style="margin: 0;">Visit your dashboard to manage your investments and track performance in real time.</p>
        </div>
      </div>
    </div>
  `;
}

async function sendApprovalEmail(
  tx: AdminTransaction,
  planLabel: string,
): Promise<Error | null> {
  const smtpUrl = process.env.NEXT_PUBLIC_SMTP_URL;
  if (!smtpUrl) return new Error("SMTP server URL is not configured.");
  if (!tx.user?.email) return new Error("User email is not available.");

  const subject = `Your ${planLabel} payment is approved`;
  const body = buildApprovalEmailBody(tx, planLabel);
  const recipients = [
    {
      id: tx.user.id,
      email: tx.user.email,
      name: getUserName(tx.user),
    },
  ];

  try {
    const response = await fetch(`${smtpUrl}/send-bulk-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, recipients }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Error(
        errorData?.message ||
          `SMTP request failed with status ${response.status}`,
      );
    }

    return null;
  } catch (error) {
    return error instanceof Error
      ? error
      : new Error("Failed to send approval email.");
  }
}

function StatusBadge({ status }: { status: TxStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.classes}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

const TX_TYPE_META: Partial<
  Record<string, { icon: React.ElementType; gradient: string; label: string }>
> = {
  payout: {
    icon: ArrowDownToLine,
    gradient: "from-emerald-400 to-emerald-600",
    label: "Payout",
  },
  debit: {
    icon: ArrowUpFromLine,
    gradient: "from-red-400 to-rose-600",
    label: "Debit",
  },
};

function TxRow({
  tx,
  index,
  approving,
  onApprove,
}: {
  tx: AdminTransaction;
  index: number;
  approving: boolean;
  onApprove: (tx: AdminTransaction) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeMeta = TX_TYPE_META[tx.type];
  const plan = PLAN_META[tx.plan] ?? PLAN_META.premium;
  const Icon = typeMeta?.icon ?? plan.icon;
  const rowGradient = typeMeta?.gradient ?? plan.gradient;
  const typeLabel =
    typeMeta?.label ?? tx.type.charAt(0).toUpperCase() + tx.type.slice(1);

  return (
    <div
      className="group border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50/80"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="grid w-full gap-4 px-5 py-4 text-left lg:grid-cols-[minmax(280px,1.2fr)_minmax(220px,1fr)_140px] lg:items-center"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${rowGradient}`}
          >
            <Icon className="size-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {tx.description}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
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
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-xs font-bold text-[#ff6900]">
            {getInitials(tx.user)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {getUserName(tx.user)}
            </p>
            <p className="truncate text-xs text-zinc-400">
              {tx.user?.email ?? tx.user_id}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
          <p
            className={`text-sm font-black tabular-nums ${
              tx.type === "debit"
                ? "text-red-600"
                : tx.type === "payout"
                  ? "text-emerald-600"
                  : "text-zinc-900"
            }`}
          >
            {tx.type === "debit" ? "−" : tx.type === "payout" ? "+" : ""}
            {fmt(tx.amount)}
          </p>
          <StatusBadge status={tx.status} />
        </div>
      </button>

      {expanded && (
        <div className="mx-5 mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">
            {[
              {
                label: "Transaction ID",
                value: tx.id.slice(0, 8).toUpperCase(),
              },
              { label: "Investor", value: getUserName(tx.user) },
              { label: "Plan", value: plan.label },
              { label: "Type", value: typeLabel },
              tx.mode_of_payment && {
                label: "Payment Mode",
                value: tx.mode_of_payment,
              },
              tx.tenor && { label: "Tenor", value: tx.tenor },
              tx.amount_words && {
                label: "Amount in Words",
                value: tx.amount_words,
              },
              tx.user?.metamap_status && {
                label: "MetaMap",
                value: tx.user.metamap_status,
              },
            ]
              .filter((row): row is { label: string; value: string } =>
                Boolean(row),
              )
              .map((row) => (
                <div key={row.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {row.label}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold capitalize text-zinc-700">
                    {row.value}
                  </p>
                </div>
              ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const txForPdf: TxForPdf = {
                  ...tx,
                  investorName: getUserName(tx.user),
                  investorEmail: tx.user?.email,
                };
                generateReceipt(txForPdf, getUserName(tx.user));
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:border-zinc-300"
            >
              <FileText className="size-3.5 text-[#ff6900]" />
              Download Receipt
            </button>
            {tx.status === "pending" && (
              <button
                onClick={() => onApprove(tx)}
                disabled={approving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {approving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                Approve Payment
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-zinc-100">
        <Wallet className="size-6 text-zinc-400" />
      </div>
      <p className="text-base font-bold text-zinc-900">
        {filtered ? "No matching transactions" : "No transactions yet"}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        {filtered
          ? "Try adjusting your search or filters"
          : "Investment activity will appear here"}
      </p>
    </div>
  );
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TxStatus | "all">("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterVerification, setFilterVerification] = useState<
    "all" | "verified" | "pending"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setFetchError(null);
    try {
      const supabase = createClient();
      const [
        { data: txData, error: txError },
        { data: profileData, error: profileError },
      ] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
      ]);

      if (txError) throw txError;
      if (profileError) throw profileError;

      const users = ((profileData ?? []) as UserProfile[]).filter(
        (profile) => normalizeRole(profile.role) !== "ADMIN",
      );
      const userById = new Map(users.map((user) => [user.id, user]));

      const joined = ((txData ?? []) as Transaction[])
        .filter((tx) => userById.has(tx.user_id))
        .map((tx) => ({ ...tx, user: userById.get(tx.user_id) }));

      setTransactions(joined);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load transactions.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterPlan, filterVerification]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((tx) => {
      const userName = getUserName(tx.user);
      const searchable = [
        tx.description,
        tx.plan,
        tx.type,
        tx.status,
        tx.amount_words,
        tx.mode_of_payment,
        tx.tenor,
        userName,
        tx.user?.email,
        tx.user?.phone,
        tx.user?.metamap_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = !query || searchable.includes(query);
      const matchStatus = filterStatus === "all" || tx.status === filterStatus;
      const matchPlan = filterPlan === "all" || tx.plan === filterPlan;
      const verified = isMetamapVerified(tx.user?.metamap_status);
      const matchVerification =
        filterVerification === "all" ||
        (filterVerification === "verified" && verified) ||
        (filterVerification === "pending" && !verified);

      return matchSearch && matchStatus && matchPlan && matchVerification;
    });
  }, [filterPlan, filterStatus, filterVerification, search, transactions]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filtered.slice(start, end);
  }, [filtered, currentPage]);

  const grouped = paginatedTransactions.reduce<
    Record<string, AdminTransaction[]>
  >((acc, tx) => {
    const day = new Date(tx.created_at).toLocaleDateString("en-NG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    (acc[day] ??= []).push(tx);
    return acc;
  }, {});

  const filteredPlanKeys = new Set(
    filtered.map((tx) => `${tx.user_id}:${tx.plan}`),
  );
  const filteredUsers = new Map(
    filtered
      .filter((tx) => tx.user)
      .map((tx) => [tx.user_id, tx.user as UserProfile]),
  );
  const totalInvested = Array.from(filteredUsers.entries()).reduce(
    (userSum, [userId, user]) =>
      userSum +
      getInvestmentPlans(user.compliance).reduce((planSum, plan) => {
        if (!filteredPlanKeys.has(`${userId}:${plan.plan}`)) return planSum;
        const amount = getMonthlyPlanAmount(plan);
        return amount > 0 ? planSum + amount : planSum;
      }, 0),
    0,
  );
  const pendingCount = filtered.filter((tx) => tx.status === "pending").length;
  const activeCount = filtered.filter((tx) => tx.status === "active").length;

  const isFiltered =
    search !== "" ||
    filterStatus !== "all" ||
    filterPlan !== "all" ||
    filterVerification !== "all";

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchTransactions();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const approvePayment = async (tx: AdminTransaction) => {
    setApprovingId(tx.id);
    setActionError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("transactions")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tx.id)
        .select("*")
        .single();

      if (error) throw error;

      setTransactions((current) =>
        current.map((item) =>
          item.id === tx.id
            ? ({
                ...(data as Transaction),
                user: item.user,
              } as AdminTransaction)
            : item,
        ),
      );

      const planLabels: Record<string, string> = {
        premium_plus: "Premium Plus",
        premium: "Premium",
        reif: "REIF",
      };
      const planLabel = planLabels[tx.plan] ?? tx.plan;

      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: tx.user_id,
        title: "Payment Approved",
        message: `Your ${planLabel} investment payment has been approved and is now active.`,
        type: "success",
        read: false,
        forAdmin: false,
      });

      if (notifErr) {
        console.error(
          "Failed to send approval notification:",
          notifErr.message,
        );
      }

      const emailErr = await sendApprovalEmail(tx, planLabel);
      if (emailErr) {
        console.error("Failed to send approval email:", emailErr.message);
      }

      setNotice(
        `Payment approved and transaction marked active.${
          emailErr ? " Email delivery failed." : " User notified by email."
        }`,
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to approve payment.",
      );
    } finally {
      setApprovingId(null);
    }
  };

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
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          <RefreshCw
            className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6900]">
            Admin Transactions
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">
            Transactions
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Monitor investment activity across every investor account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <button
              onClick={() => {
                const txsForPdf: TxForPdf[] = transactions.map((tx) => ({
                  ...tx,
                  investorName: getUserName(tx.user),
                  investorEmail: tx.user?.email,
                }));
                generateStatement(txsForPdf, "All Investors", true);
              }}
              className="flex items-center gap-2 rounded-xl bg-[#ff6900] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#e55f00]"
            >
              <Download className="size-3.5" />
              Download Statement
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
          >
            <RefreshCw
              className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {actionError}
        </div>
      )}

      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" />
          {notice}
        </div>
      )}

      <div className="mb-6 grid lg:grid-cols-2 gap-3">
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
            value: filtered.length.toString(),
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
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
          >
            <div
              className={`mb-2 flex size-7 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}
            >
              {stat.icon}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {stat.label}
            </p>
            <p className={`mt-1 text-lg font-black tabular-nums ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transactions, users, plans, status..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-sm text-zinc-800 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-[#ff6900] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
            <Filter className="ml-2 size-3.5 shrink-0 text-zinc-400" />
            {(["all", "pending", "active", "failed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  filterStatus === status
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {(["all", "premium_plus", "premium", "reif"] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => setFilterPlan(plan)}
              className={`whitespace-nowrap shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterPlan === plan
                  ? "bg-[#ff6900] text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {plan === "all" ? "All Plans" : PLAN_META[plan].label}
            </button>
          ))}
          {(["all", "verified", "pending"] as const).map((verification) => (
            <button
              key={verification}
              onClick={() => setFilterVerification(verification)}
              className={`whitespace-nowrap shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                filterVerification === verification
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {verification === "all" ? "All KYC" : verification}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
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
                  {txs.map((tx, index) => (
                    <TxRow
                      key={tx.id}
                      tx={tx}
                      index={index}
                      approving={approvingId === tx.id}
                      onApprove={approvePayment}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Component */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
