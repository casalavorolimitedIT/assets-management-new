"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Wallet,
  Clock,
  Calendar,
  BadgeCheck,
  Crown,
  Star,
  Zap,
  ChevronDown,
  ArrowUpRight,
  PiggyBank,
  BarChart3,
  Layers,
  Info,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Pagination } from "../Pagination";

interface InvestmentPlan {
  plan: string;
  tenor: string;
  monthly_amount_words?: string;
  monthly_payment_date: string;
  monthly_amount_figures?: number;
  amount_figures?: number;
  total_figures?: number;
  amount_words?: string;
  total_words?: string;
  mode_of_payment?: string;
  mode_of_interest?: string;
  units?: number;
}

const PLAN_META: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    gradient: string;
    color: string;
    rate: number;
    description: string;
  }
> = {
  premium_plus: {
    label: "Premium Plus",
    icon: Crown,
    gradient: "from-amber-500 via-orange-500 to-[#ff6900]",
    color: "#ff6900",
    rate: 0.17,
    description: "Fixed lump-sum with priority returns",
  },
  premium: {
    label: "Premium",
    icon: Star,
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
    color: "#6366f1",
    rate: 0.15,
    description: "Monthly contribution savings plan",
  },
  reif: {
    label: "REIF",
    icon: Zap,
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    color: "#10b981",
    rate: 0.12,
    description: "Real Estate Investment Fund",
  },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

const getPrincipal = (inv: InvestmentPlan): number =>
  inv.monthly_amount_figures ?? inv.amount_figures ?? inv.total_figures ?? 0;

const getMaturityDate = (inv: InvestmentPlan): Date | null => {
  const months = parseInt(inv.tenor) || 0;
  if (!months || !inv.monthly_payment_date) return null;
  const d = new Date(inv.monthly_payment_date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const getProjectedReturn = (inv: InvestmentPlan): number => {
  const principal = getPrincipal(inv);
  const months = parseInt(inv.tenor) || 6;
  const rate = PLAN_META[inv.plan]?.rate ?? 0.15;
  return principal * (1 + (rate * months) / 12);
};

const getProgress = (inv: InvestmentPlan): number => {
  const start = new Date(inv.monthly_payment_date).getTime();
  const maturity = getMaturityDate(inv);
  if (!maturity) return 0;
  const end = maturity.getTime();
  const now = Date.now();
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
};

const getDaysRemaining = (inv: InvestmentPlan): number => {
  const maturity = getMaturityDate(inv);
  if (!maturity) return 0;
  return Math.max(0, Math.ceil((maturity.getTime() - Date.now()) / 86_400_000));
};

function AnimatedNumber({
  value,
  prefix = "₦",
}: {
  value: number;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const from = display;

    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * ease));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toLocaleString("en-NG")}
    </span>
  );
}

function RadialProgress({
  percent,
  color,
  size = 80,
}: {
  percent: number;
  color: string;
  size?: number;
}) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#f4f4f5"
        strokeWidth={6}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

function PlanCard({ inv, index }: { inv: InvestmentPlan; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const key = inv.plan.toLowerCase();
  const meta = PLAN_META[key] ?? PLAN_META.premium;
  const Icon = meta.icon;

  const principal = getPrincipal(inv);
  const projected = getProjectedReturn(inv);
  const gain = projected - principal;
  const gainPct = principal > 0 ? ((gain / principal) * 100).toFixed(1) : "0";
  const progress = getProgress(inv);
  const daysLeft = getDaysRemaining(inv);
  const maturity = getMaturityDate(inv);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Top color bar */}
      <div className={`h-1.5 w-full bg-linear-to-r ${meta.gradient}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${meta.gradient}`}
            >
              <Icon className="size-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-zinc-900">
                  {meta.label} Plan
                </p>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <BadgeCheck className="size-3" />
                  Active
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{meta.description}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs text-zinc-400">Principal</p>
            <p className="text-base font-black text-zinc-900 tabular-nums">
              {fmtShort(principal)}
            </p>
          </div>
        </div>

        {/* Progress section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Tenor Progress
            </span>
            <span className="text-[10px] font-bold text-zinc-600">
              {progress.toFixed(0)}% complete
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full bg-linear-to-r ${meta.gradient} transition-all duration-1000`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-400">
              Started{" "}
              {new Date(inv.monthly_payment_date).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="text-[10px] text-zinc-400">
              {maturity
                ? maturity.toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-zinc-50 p-3 text-center">
            <Clock className="size-3.5 text-zinc-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-zinc-900">{inv.tenor}</p>
            <p className="text-[10px] text-zinc-400">Tenor</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-center">
            <Target className="size-3.5 text-zinc-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-zinc-900">
              {daysLeft > 0 ? `${daysLeft}d` : "Matured"}
            </p>
            <p className="text-[10px] text-zinc-400">Remaining</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-center">
            <TrendingUp className="size-3.5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-emerald-600">
              {(meta.rate * 100).toFixed(0)}% p.a.
            </p>
            <p className="text-[10px] text-zinc-400">Rate</p>
          </div>
        </div>

        {/* Projected return highlight */}
        <div
          className={`rounded-xl bg-linear-to-r ${meta.gradient} p-3 text-white`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Projected Return at Maturity
              </p>
              <p className="text-lg font-black tabular-nums mt-0.5">
                {fmt(projected)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/70">Expected Gain</p>
              <p className="text-sm font-bold text-white flex items-center gap-1 justify-end">
                <ArrowUpRight className="size-3.5" />
                {fmt(gain)} ({gainPct}%)
              </p>
            </div>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex w-full items-center justify-between rounded-lg px-1 py-1 text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <span>More details</span>
          <ChevronDown
            className={`size-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <div className="mt-2 space-y-2 border-t border-zinc-100 pt-3">
            {[
              {
                label: "Payment Date",
                value: new Date(inv.monthly_payment_date).toLocaleDateString(
                  "en-NG",
                  { day: "numeric", month: "long", year: "numeric" },
                ),
              },
              inv.mode_of_payment && {
                label: "Mode of Payment",
                value: inv.mode_of_payment,
              },
              inv.mode_of_interest && {
                label: "Interest Repayment",
                value: inv.mode_of_interest,
              },
              inv.units && { label: "Units", value: `${inv.units} units` },
              (inv.monthly_amount_words ??
                inv.amount_words ??
                inv.total_words) && {
                label: "Amount in Words",
                value:
                  inv.monthly_amount_words ??
                  inv.amount_words ??
                  inv.total_words,
              },
            ]
              .filter(Boolean)
              .map((row: any) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-zinc-400">{row.label}</span>
                  <span className="text-xs font-semibold text-zinc-700 capitalize">
                    {row.value}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DonutChart({ plans }: { plans: InvestmentPlan[] }) {
  const total = plans.reduce((s, p) => s + getPrincipal(p), 0);
  if (!total) return null;

  const size = 140;
  const r = 52;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const segments = plans.map((inv) => {
    const key = inv.plan.toLowerCase();
    const meta = PLAN_META[key] ?? PLAN_META.premium;
    const pct = getPrincipal(inv) / total;
    const seg = { color: meta.color, pct, offset };
    offset += pct;
    return seg;
  });

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f4f4f5"
          strokeWidth={18}
        />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={18}
            strokeDasharray={`${circ * seg.pct} ${circ * (1 - seg.pct)}`}
            strokeDashoffset={-circ * seg.offset}
            strokeLinecap="butt"
            style={{
              transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Total
        </p>
        <p className="text-sm font-black text-zinc-900 tabular-nums">
          {fmtShort(total)}
        </p>
      </div>
    </div>
  );
}

export default function UserPortfolio() {
  const [allPlans, setAllPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("profiles")
          .select("compliance")
          .eq("id", user.id)
          .single();

        const c = data?.compliance as any;
        const ips: InvestmentPlan[] = c?.investment_plans?.length
          ? c.investment_plans
          : c?.investment_plan
            ? [c.investment_plan]
            : [];
        setAllPlans(ips);
        setCurrentPage(1); // Reset to first page when data loads
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Apply tab filter
  const filteredPlans =
    tab === "all" ? allPlans : allPlans.filter((p) => p.plan === tab);

  // Pagination calculations
  const totalFiltered = filteredPlans.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPlans = filteredPlans.slice(startIndex, endIndex);

  // Reset to first page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tab]);

  // Calculate metrics from all plans (not paginated)
  const totalPrincipal = allPlans.reduce((s, p) => s + getPrincipal(p), 0);
  const totalProjected = allPlans.reduce(
    (s, p) => s + getProjectedReturn(p),
    0,
  );
  const totalGain = totalProjected - totalPrincipal;
  const avgRate =
    allPlans.length > 0
      ? allPlans.reduce((s, p) => s + (PLAN_META[p.plan]?.rate ?? 0.15), 0) /
        allPlans.length
      : 0;

  const planTypes = Array.from(new Set(allPlans.map((p) => p.plan)));

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-[#ff6900]" />
      </div>
    );
  }

  if (!allPlans.length) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-100">
          <BarChart3 className="size-7 text-zinc-400" />
        </div>
        <div>
          <p className="text-base font-bold text-zinc-900">
            No investments yet
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            Add your first plan to see your portfolio here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-10">
      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Portfolio Overview</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Full picture of your investment positions
        </p>
      </div>

      {/* ── Hero summary strip ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Invested",
            value: <AnimatedNumber value={totalPrincipal} />,
            icon: <Wallet className="size-4" />,
            color: "text-[#ff6900]",
            bg: "bg-[#fff1e6]",
          },
          {
            label: "Projected Value",
            value: <AnimatedNumber value={totalProjected} />,
            icon: <TrendingUp className="size-4" />,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Expected Gain",
            value: <AnimatedNumber value={totalGain} />,
            icon: <ArrowUpRight className="size-4" />,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Avg. Interest Rate",
            value: `${(avgRate * 100).toFixed(1)}% p.a.`,
            icon: <PiggyBank className="size-4" />,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
          >
            <div
              className={`mb-2 flex size-8 items-center justify-center rounded-lg ${s.bg} ${s.color}`}
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

      {/* ── Allocation + maturity ── */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Donut allocation card */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="size-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-zinc-900">
              Allocation Breakdown
            </h3>
          </div>
          <div className="flex items-center gap-6">
            <DonutChart plans={allPlans} />
            <div className="flex-1 space-y-2.5">
              {allPlans.map((inv) => {
                const key = inv.plan.toLowerCase();
                const meta = PLAN_META[key] ?? PLAN_META.premium;
                const principal = getPrincipal(inv);
                const pct =
                  totalPrincipal > 0
                    ? ((principal / totalPrincipal) * 100).toFixed(1)
                    : "0";
                return (
                  <div
                    key={key + inv.monthly_payment_date}
                    className="flex items-center gap-2.5"
                  >
                    <div
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-zinc-700">
                          {meta.label}
                        </p>
                        <p className="text-xs font-bold text-zinc-900 tabular-nums">
                          {pct}%
                        </p>
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] text-zinc-400">
                        {fmtShort(principal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Maturity timeline */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="size-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-zinc-900">
              Maturity Timeline
            </h3>
          </div>
          <div className="space-y-4">
            {allPlans.map((inv, i) => {
              const key = inv.plan.toLowerCase();
              const meta = PLAN_META[key] ?? PLAN_META.premium;
              const maturity = getMaturityDate(inv);
              const daysLeft = getDaysRemaining(inv);
              const progress = getProgress(inv);
              const Icon = meta.icon;

              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <RadialProgress
                      percent={progress}
                      color={meta.color}
                      size={52}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="size-4" style={{ color: meta.color }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-zinc-800">
                        {meta.label}
                      </p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${meta.color}18`,
                          color: meta.color,
                        }}
                      >
                        {daysLeft > 0 ? `${daysLeft} days left` : "Matured"}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Matures{" "}
                      {maturity
                        ? maturity.toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Returns summary ── */}
      <div className="mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="size-4 text-zinc-400" />
          <h3 className="text-sm font-bold text-zinc-900">Returns Breakdown</h3>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500">
            <Info className="size-3" />
            Projections at maturity
          </div>
        </div>
        <div className="space-y-3">
          {allPlans.map((inv, i) => {
            const key = inv.plan.toLowerCase();
            const meta = PLAN_META[key] ?? PLAN_META.premium;
            const principal = getPrincipal(inv);
            const projected = getProjectedReturn(inv);
            const gain = projected - principal;
            const gainPct =
              principal > 0 ? ((gain / principal) * 100).toFixed(1) : "0";
            const barWidth =
              totalPrincipal > 0 ? (principal / totalPrincipal) * 100 : 0;

            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 shrink-0">
                  <p className="text-xs font-semibold text-zinc-700">
                    {meta.label}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {fmtShort(principal)}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="relative h-8 overflow-hidden rounded-lg bg-zinc-100">
                    {/* Principal bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: `${meta.color}30`,
                      }}
                    />
                    {/* Gain extension */}
                    <div
                      className="absolute inset-y-0 rounded-r-lg transition-all duration-700"
                      style={{
                        left: `${barWidth}%`,
                        width: `${(gain / totalPrincipal) * 100}%`,
                        backgroundColor: `${meta.color}60`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: meta.color }}
                      >
                        +{fmtShort(gain)} ({gainPct}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-20 shrink-0 text-right">
                  <p className="text-xs font-black text-zinc-900 tabular-nums">
                    {fmtShort(projected)}
                  </p>
                  <p className="text-[10px] text-zinc-400">at maturity</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Plan cards ── */}
      <div>
        {/* Tab filter */}
        {planTypes.length > 1 && (
          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
            {["all", ...planTypes].map((t) => {
              const label =
                t === "all"
                  ? `All Plans (${allPlans.length})`
                  : (PLAN_META[t]?.label ?? t);
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    tab === t
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {currentPlans.map((inv, i) => (
            <PlanCard
              key={`${inv.plan}-${inv.monthly_payment_date}-${i}`}
              inv={inv}
              index={i}
            />
          ))}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={totalFiltered}
              pageSize={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
