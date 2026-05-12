"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  Landmark,
  PiggyBank,
  Building2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: React.ReactNode;
  sub: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: "credit" | "debit";
  date: string;
  status: "completed" | "pending" | "failed";
  category: string;
}

interface PortfolioItem {
  name: string;
  value: string;
  percent: number;
  color: string;
  change: string;
  changeType: "up" | "down";
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    description: "Premium Plus — Monthly Return",
    amount: "₦85,000",
    type: "credit",
    date: "Today, 9:41 AM",
    status: "completed",
    category: "Return",
  },
  {
    id: "2",
    description: "REIF Unit Purchase",
    amount: "₦100,000",
    type: "debit",
    date: "Yesterday, 2:15 PM",
    status: "completed",
    category: "Investment",
  },
  {
    id: "3",
    description: "Premium — Monthly Contribution",
    amount: "₦50,000",
    type: "debit",
    date: "May 28, 10:00 AM",
    status: "completed",
    category: "Investment",
  },
  {
    id: "4",
    description: "Premium Plus — Interest Payment",
    amount: "₦42,500",
    type: "credit",
    date: "May 25, 3:30 PM",
    status: "pending",
    category: "Return",
  },
  {
    id: "5",
    description: "Premium — Monthly Contribution",
    amount: "₦50,000",
    type: "debit",
    date: "Apr 28, 10:00 AM",
    status: "completed",
    category: "Investment",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCardItem({ card }: { card: StatCard }) {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Subtle gradient accent */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#ff6900]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {card.label}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-semibold text-zinc-900 tabular-nums">
              {hidden ? "••••••" : card.value}
            </p>
            <button
              onClick={() => setHidden((h) => !h)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              {hidden ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            {card.changeType === "up" && (
              <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="size-3" />
                {card.change}
              </span>
            )}
            {card.changeType === "down" && (
              <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
                <ArrowDownRight className="size-3" />
                {card.change}
              </span>
            )}
            {card.changeType === "neutral" && (
              <span className="text-xs font-medium text-zinc-500">
                {card.change}
              </span>
            )}
            <span className="text-xs text-zinc-400">{card.sub}</span>
          </div>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff1e6] text-[#ff6900]">
          {card.icon}
        </div>
      </div>
    </div>
  );
}

function PortfolioBar({ items }: { items: PortfolioItem[] }) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      {items.map((item, i) => (
        <div
          key={i}
          style={{ width: `${item.percent}%`, backgroundColor: item.color }}
          className="transition-all duration-500 first:rounded-l-full last:rounded-r-full"
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardContent({
  firstName,
  profile,
  isVerified,
  compliance,
}: {
  firstName: string;
  isVerified: boolean;
  profile: any;
  compliance: any;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const inv = compliance?.investment_plan ?? null;

  // ── Derive real values ──────────────────────────────────────────────────────

  const PLAN_LABELS: Record<string, string> = {
    premium: "Premium",
    premium_plus: "Premium Plus",
    reif: "REIF",
  };
  const PLAN_COLORS: Record<string, string> = {
    premium: "#ff9f5a",
    premium_plus: "#ff6900",
    reif: "#ffd4b3",
  };
  const PLAN_RATES: Record<string, string> = {
    premium: "15% p.a.",
    premium_plus: "17% p.a.",
    reif: "12% p.a.",
  };

  const planKey: string = inv?.plan ?? "";
  const planLabel = PLAN_LABELS[planKey] ?? "—";
  const planColor = PLAN_COLORS[planKey] ?? "#e5e7eb";
  const planRate = PLAN_RATES[planKey] ?? "—";

  const monthlyFigures: number | null = inv?.monthly_amount_figures ?? null;
  const amountFigures: number | null = inv?.amount_figures ?? null;
  const totalFigures: number | null = inv?.total_figures ?? null;

  const investmentAmount = monthlyFigures
    ? `₦${monthlyFigures.toLocaleString("en-NG")}`
    : amountFigures
      ? `₦${amountFigures.toLocaleString("en-NG")}`
      : totalFigures
        ? `₦${totalFigures.toLocaleString("en-NG")}`
        : "—";

  const nextPayment = inv?.monthly_payment_date
    ? new Date(inv.monthly_payment_date).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  // ── Stats built from real data ──────────────────────────────────────────────

  const STATS: StatCard[] = [
    {
      label: "Investment Amount",
      value: investmentAmount,
      change:
        inv?.monthly_amount_words ??
        inv?.amount_words ??
        inv?.total_words ??
        "",
      changeType: "neutral",
      icon: <Wallet className="size-5" />,
      sub: planLabel !== "—" ? `${planLabel} plan` : "No plan yet",
    },
    {
      label: "Investment Plan",
      value: planLabel,
      change: planRate,
      changeType: "neutral",
      icon: <TrendingUp className="size-5" />,
      sub: "interest rate",
    },
    {
      label: "Tenor",
      value: inv?.tenor ?? "—",
      change: "",
      changeType: "neutral",
      icon: <PiggyBank className="size-5" />,
      sub: "investment duration",
    },
    {
      label: "Next Payment",
      value: nextPayment,
      change: "",
      changeType: "neutral",
      icon: <Landmark className="size-5" />,
      sub: "scheduled date",
    },
  ];

  // ── Portfolio: one entry per active plan ────────────────────────────────────
  // Currently only one plan exists; extend this array when multiple plans are supported.

  const PORTFOLIO: PortfolioItem[] = planKey
    ? [
        {
          name: planLabel,
          value: investmentAmount,
          percent: 100,
          color: planColor,
          change: planRate,
          changeType: "up",
        },
      ]
    : [];
  return (
    <div className="space-y-6">
      {/* ── Hero greeting ── */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-linear-to-l from-[#fff1e6] to-transparent" />
        <div className="pointer-events-none absolute -right-8 -top-8 size-48 rounded-full bg-[#ff6900]/10 blur-3xl" />
        <div className="relative">
          <p className="text-sm text-zinc-500">{greeting},</p>
          <h1 className="mt-0.5 text-2xl font-semibold text-zinc-900 capitalize">
            {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Here's what's happening with your investments today.
          </p>

          {!isVerified && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <ShieldAlert className="size-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700">
                Your account is not verified.{" "}
                <Link
                  href="/verification"
                  className="font-medium underline underline-offset-2 hover:text-amber-900 transition-colors"
                >
                  Complete verification
                </Link>{" "}
                to unlock all features.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((card: any) => (
          <StatCardItem key={card.label} card={card} />
        ))}
      </div>

      {/* ── Middle row: Portfolio + Quick Actions ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Portfolio Allocation
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Across all investment plans
              </p>
            </div>
          </div>

          <PortfolioBar items={PORTFOLIO} />

          <div className="mt-5 space-y-3">
            {PORTFOLIO.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-zinc-50 transition-colors cursor-default"
              >
                <div
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-900">
                      {item.name}
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                      {item.value}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="h-1.5 flex-1 mr-4 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-zinc-400">
                        {item.percent}%
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          item.changeType === "up"
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        {item.change}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900 mb-5">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/verification"
              className="group flex items-center gap-3 rounded-xl border border-zinc-200 p-4 hover:border-[#ff6900]/40 hover:bg-[#fff1e6] transition-all duration-150"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#fff1e6] text-[#ff6900] group-hover:bg-[#ff6900] group-hover:text-white transition-colors">
                <Building2 className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  New Investment
                </p>
                <p className="text-xs text-zinc-500">Start a new plan</p>
              </div>
              <ArrowRight className="size-4 text-zinc-400 group-hover:text-[#ff6900] group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/dashboard/transactions"
              className="group flex items-center gap-3 rounded-xl border border-zinc-200 p-4 hover:border-[#ff6900]/40 hover:bg-[#fff1e6] transition-all duration-150"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 group-hover:bg-[#ff6900] group-hover:text-white transition-colors">
                <Wallet className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  Fund Account
                </p>
                <p className="text-xs text-zinc-500">Top up your balance</p>
              </div>
              <ArrowRight className="size-4 text-zinc-400 group-hover:text-[#ff6900] group-hover:translate-x-0.5 transition-all" />
            </Link>

            {!profile.isVerified && (
              <Link
                href="/verification"
                className="group flex items-center gap-3 rounded-xl border border-zinc-200 p-4 hover:border-[#ff6900]/40 hover:bg-[#fff1e6] transition-all duration-150"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 group-hover:bg-[#ff6900] group-hover:text-white transition-colors">
                  <ShieldAlert className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">
                    Verify Account
                  </p>
                  <p className="text-xs text-zinc-500">Complete KYC</p>
                </div>
                <ArrowRight className="size-4 text-zinc-400 group-hover:text-[#ff6900] group-hover:translate-x-0.5 transition-all" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Recent Transactions
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Your latest investment activity
            </p>
          </div>
          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-1 text-xs font-medium text-[#ff6900] hover:underline underline-offset-2 transition-colors"
          >
            View all
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-100">
          {TRANSACTIONS.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors"
            >
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                  tx.type === "credit"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {tx.type === "credit" ? (
                  <ArrowDownRight className="size-4" />
                ) : (
                  <ArrowUpRight className="size-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {tx.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-400">{tx.date}</span>
                  <span className="size-1 rounded-full bg-zinc-300" />
                  <span className="text-xs text-zinc-400">{tx.category}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    tx.type === "credit" ? "text-emerald-600" : "text-zinc-900"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}
                  {tx.amount}
                </p>
                <div className="mt-0.5 flex justify-end">
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-900">
            Investment Plans
          </h2>
          <Link
            href="/verification"
            className="flex items-center gap-1.5 rounded-lg bg-[#ff6900] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#e55f00] transition-colors"
          >
            + New Plan
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              name: "Premium Plus",
              amount: "₦2,500,000",
              tenor: "12 Months",
              rate: "17% p.a.",
              status: "Active",
              maturity: "Dec 2025",
              color: "#ff6900",
            },
            {
              name: "Premium",
              amount: "₦50,000/mo",
              tenor: "24 Months",
              rate: "15% p.a.",
              status: "Active",
              maturity: "Jun 2026",
              color: "#ff9f5a",
            },
            {
              name: "REIF",
              amount: "₦550,000",
              tenor: "10 Units",
              rate: "12% p.a.",
              status: "Active",
              maturity: "Mar 2026",
              color: "#ffd4b3",
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className="group relative overflow-hidden rounded-xl border border-zinc-200 p-4 hover:border-[#ff6900]/30 hover:shadow-sm transition-all duration-200 cursor-default"
            >
              <div
                className="absolute top-0 left-0 h-1 w-full rounded-t-xl"
                style={{ backgroundColor: plan.color }}
              />
              <div className="mt-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">
                    {plan.name}
                  </p>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    {plan.status}
                  </span>
                </div>
                <p className="mt-2 text-xl font-bold text-zinc-900 tabular-nums">
                  {plan.amount}
                </p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Tenor</span>
                    <span className="font-medium text-zinc-700">
                      {plan.tenor}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Rate</span>
                    <span className="font-medium text-emerald-600">
                      {plan.rate}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Maturity</span>
                    <span className="font-medium text-zinc-700">
                      {plan.maturity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}
