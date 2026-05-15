"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Wallet,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
  Landmark,
  PiggyBank,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface StatCard {
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: React.ReactNode;
  sub: string;
}

interface PortfolioItem {
  name: string;
  value: string;
  percent: number;
  color: string;
  change: string;
  changeType: "up" | "down";
}

const PLAN_LABELS: Record<string, string> = {
  premium: "Premium",
  premium_plus: "Premium Plus",
  reif: "REIF",
};
const PLAN_COLORS: Record<string, string> = {
  premium: "#6366f1",
  premium_plus: "#ff6900",
  reif: "#10b981",
};
const PLAN_RATES: Record<string, string> = {
  premium: "15% p.a.",
  premium_plus: "17% p.a.",
  reif: "12% p.a.",
};

function deriveStats(inv: any): StatCard[] {
  const planKey: string = inv?.plan ?? "";
  const planLabel = PLAN_LABELS[planKey] ?? "—";
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

  return [
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
}

function derivePortfolio(plans: any[]): PortfolioItem[] {
  if (!plans.length) return [];
  const total = plans.reduce((sum, inv) => {
    return (
      sum +
      (inv?.monthly_amount_figures ??
        inv?.amount_figures ??
        inv?.total_figures ??
        0)
    );
  }, 0);

  return plans.map((inv) => {
    const planKey = inv?.plan ?? "";
    const amount =
      inv?.monthly_amount_figures ??
      inv?.amount_figures ??
      inv?.total_figures ??
      0;
    return {
      name: PLAN_LABELS[planKey] ?? planKey,
      value: `₦${amount.toLocaleString("en-NG")}`,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: PLAN_COLORS[planKey] ?? "#e5e7eb",
      change: PLAN_RATES[planKey] ?? "—",
      changeType: "up",
    };
  });
}

function StatCardItem({ card }: { card: StatCard }) {
  const [hidden, setHidden] = useState(false);
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
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

    const allPlans: any[] = compliance?.investment_plans?.length
    ? compliance.investment_plans
    : compliance?.investment_plan
      ? [compliance.investment_plan]
      : [];

  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const hasMultiplePlans = allPlans.length > 1;
  const activePlan = allPlans[activePlanIndex] ?? null;

  const stats = activePlan ? deriveStats(activePlan) : [];
  const portfolio = derivePortfolio(allPlans);

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

      {/* ── Total portfolio value ── */}
      {allPlans.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-linear-to-br from-[#ff6900] to-orange-400 p-5 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-8 right-16 size-24 rounded-full bg-white/5" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                Total Portfolio Value
              </p>
              <p className="mt-1.5 text-3xl font-black tabular-nums tracking-tight">
                ₦
                {allPlans
                  .reduce((sum, inv) => {
                    return (
                      sum +
                      (inv?.monthly_amount_figures ??
                        inv?.amount_figures ??
                        inv?.total_figures ??
                        0)
                    );
                  }, 0)
                  .toLocaleString("en-NG")}
              </p>
              <p className="mt-1 text-xs text-white/60">
                Across {allPlans.length} active plan
                {allPlans.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <TrendingUp className="size-6 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* ── Plan toggle (only shown when multiple plans exist) ── */}
      {allPlans.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Plan Overview
            </h2>
            {hasMultiplePlans && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {activePlanIndex + 1} of {allPlans.length} plans
              </p>
            )}
          </div>

          {hasMultiplePlans && (
            <div className="flex items-center gap-1">
              {/* Dot indicators */}
              <div className="flex items-center gap-1 mr-2">
                {allPlans.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePlanIndex(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === activePlanIndex
                        ? "w-5 h-2 bg-[#ff6900]"
                        : "size-2 bg-zinc-300 hover:bg-zinc-400"
                    }`}
                  />
                ))}
              </div>
              {/* Prev / Next */}
              <button
                onClick={() => setActivePlanIndex((i) => Math.max(0, i - 1))}
                disabled={activePlanIndex === 0}
                className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() =>
                  setActivePlanIndex((i) =>
                    Math.min(allPlans.length - 1, i + 1),
                  )
                }
                disabled={activePlanIndex === allPlans.length - 1}
                className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Stat cards ── */}
      {stats.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((card: any) => (
            <StatCardItem key={card.label} card={card} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-12 text-center">
          <TrendingUp className="size-8 text-zinc-300 mb-3" />
          <p className="text-sm font-semibold text-zinc-500">
            No investment plan yet
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Add a plan to see your overview here
          </p>
        </div>
      )}

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
          {portfolio.length > 0 ? (
            <>
              <PortfolioBar items={portfolio} />
              <div className="mt-5 space-y-3">
                {portfolio.map((item) => (
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
                          <span className="text-xs font-medium text-emerald-600">
                            {item.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-zinc-400">No portfolio data yet</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900 mb-5">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/investments"
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
                  Account Details
                </p>
                <p className="text-xs text-zinc-500">View your recent transactions</p>
              </div>
              <ArrowRight className="size-4 text-zinc-400 group-hover:text-[#ff6900] group-hover:translate-x-0.5 transition-all" />
            </Link>

            {!profile?.metamap_status && (
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
    </div>
  );
}
