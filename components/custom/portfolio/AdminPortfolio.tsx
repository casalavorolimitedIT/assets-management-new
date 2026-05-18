"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Calendar,
  ChevronDown,
  Crown,
  Info,
  Layers,
  Loader2,
  PiggyBank,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  Zap,
  Clock,
} from "lucide-react";
import { normalizeRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import type { Compliance, InvestmentPlan, UserProfile } from "@/types";
import { Pagination } from "../Pagination";

type PortfolioFilter = "ALL" | "FUNDED" | "VERIFIED" | "PENDING";

interface InvestorPortfolio {
  user: UserProfile;
  plans: InvestmentPlan[];
}

const FILTERS: Array<{ label: string; value: PortfolioFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Funded", value: "FUNDED" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Pending", value: "PENDING" },
];

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

const PAGE_SIZE = 10; // Items per page

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

function parseCompliance(compliance: unknown): Partial<Compliance> | null {
  if (!compliance) return null;
  if (typeof compliance !== "string") return compliance as Partial<Compliance>;

  try {
    return JSON.parse(compliance) as Partial<Compliance>;
  } catch {
    return null;
  }
}

function getPlans(user: UserProfile): InvestmentPlan[] {
  const compliance = parseCompliance(user.compliance);
  if (Array.isArray(compliance?.investment_plans)) {
    return compliance.investment_plans;
  }
  return compliance?.investment_plan ? [compliance.investment_plan] : [];
}

const getPrincipal = (inv: InvestmentPlan): number => {
  const legacy = inv as InvestmentPlan & {
    amount_figures?: number;
    total_figures?: number;
  };
  return (
    legacy.monthly_amount_figures ??
    legacy.amount_figures ??
    legacy.total_figures ??
    0
  );
};

const getMaturityDate = (inv: InvestmentPlan): Date | null => {
  const months = parseInt(inv.tenor, 10) || 0;
  if (!months || !inv.monthly_payment_date) return null;
  const d = new Date(inv.monthly_payment_date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const getProjectedReturn = (inv: InvestmentPlan): number => {
  const principal = getPrincipal(inv);
  const months = parseInt(inv.tenor, 10) || 6;
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

function isMetamapVerified(status?: string | null) {
  if (!status) return false;
  return ["approved", "verified", "completed"].includes(
    status.trim().toLowerCase(),
  );
}

function getUserName(user: UserProfile) {
  return (
    [user.title, user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.email
  );
}

function AnimatedNumber({
  value,
  prefix = "₦",
}: {
  value: number;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const from = displayRef.current;

    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (value - from) * ease);
      displayRef.current = next;
      setDisplay(next);
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

function PlanCard({
  inv,
  index,
  owner,
}: {
  inv: InvestmentPlan;
  index: number;
  owner?: UserProfile;
}) {
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
      className="group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={`h-1.5 w-full bg-linear-to-r ${meta.gradient}`} />

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${meta.gradient}`}
            >
              <Icon className="size-5 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-zinc-900">
                  {meta.label} Plan
                </p>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <BadgeCheck className="size-3" />
                  Active
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {owner ? getUserName(owner) : meta.description}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xs text-zinc-400">Principal</p>
            <p className="text-base font-black tabular-nums text-zinc-900">
              {fmtShort(principal)}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
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
          <div className="mt-1 flex justify-between">
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

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-zinc-50 p-3 text-center">
            <Clock className="mx-auto mb-1 size-3.5 text-zinc-400" />
            <p className="text-xs font-bold text-zinc-900">{inv.tenor}</p>
            <p className="text-[10px] text-zinc-400">Tenor</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-center">
            <Target className="mx-auto mb-1 size-3.5 text-zinc-400" />
            <p className="text-xs font-bold text-zinc-900">
              {daysLeft > 0 ? `${daysLeft}d` : "Matured"}
            </p>
            <p className="text-[10px] text-zinc-400">Remaining</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-center">
            <TrendingUp className="mx-auto mb-1 size-3.5 text-emerald-500" />
            <p className="text-xs font-bold text-emerald-600">
              {(meta.rate * 100).toFixed(0)}% p.a.
            </p>
            <p className="text-[10px] text-zinc-400">Rate</p>
          </div>
        </div>

        <div
          className={`rounded-xl bg-linear-to-r ${meta.gradient} p-3 text-white`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Projected Return at Maturity
              </p>
              <p className="mt-0.5 text-lg font-black tabular-nums">
                {fmt(projected)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/70">Expected Gain</p>
              <p className="flex items-center justify-end gap-1 text-sm font-bold text-white">
                <ArrowUpRight className="size-3.5" />
                {fmt(gain)} ({gainPct}%)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex w-full items-center justify-between rounded-lg px-1 py-1 text-xs font-semibold text-zinc-400 transition-colors hover:text-zinc-600"
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
              inv.monthly_amount_words && {
                label: "Amount in Words",
                value: inv.monthly_amount_words,
              },
            ]
              .filter((row): row is { label: string; value: string } =>
                Boolean(row),
              )
              .map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-xs text-zinc-400">{row.label}</span>
                  <span className="text-right text-xs font-semibold capitalize text-zinc-700">
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
  const segments = plans.reduce<
    Array<{ color: string; pct: number; offset: number }>
  >((items, inv) => {
    const key = inv.plan.toLowerCase();
    const meta = PLAN_META[key] ?? PLAN_META.premium;
    const pct = getPrincipal(inv) / total;
    const offset = items.reduce((sum, item) => sum + item.pct, 0);
    return [...items, { color: meta.color, pct, offset }];
  }, []);

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
        <p className="text-sm font-black tabular-nums text-zinc-900">
          {fmtShort(total)}
        </p>
      </div>
    </div>
  );
}

export default function AdminPortfolio() {
  const [portfolios, setPortfolios] = useState<InvestorPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PortfolioFilter>("ALL");
  const [tab, setTab] = useState<"all" | string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPortfolios = useCallback(async () => {
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const investorPortfolios = ((data ?? []) as UserProfile[])
        .filter((profile) => normalizeRole(profile.role) !== "ADMIN")
        .map((user) => ({ user, plans: getPlans(user) }));

      setPortfolios(investorPortfolios);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load portfolios.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchPortfolios();
  }, [fetchPortfolios]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, tab]);

  const searchedPortfolios = useMemo(() => {
    const query = search.trim().toLowerCase();

    return portfolios.filter(({ user, plans }) => {
      const planNames = plans.map((plan) => plan.plan).join(" ");
      const searchable = [
        getUserName(user),
        user.email,
        user.phone,
        user.metamap_status,
        planNames,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesFilter =
        filter === "ALL" ||
        (filter === "FUNDED" && plans.length > 0) ||
        (filter === "VERIFIED" && isMetamapVerified(user.metamap_status)) ||
        (filter === "PENDING" && !isMetamapVerified(user.metamap_status));

      return matchesSearch && matchesFilter;
    });
  }, [filter, portfolios, search]);

  const visiblePlans = searchedPortfolios.flatMap(({ user, plans }) =>
    plans.map((plan) => ({ plan, owner: user })),
  );

  const plansByTab =
    tab === "all"
      ? visiblePlans
      : visiblePlans.filter(({ plan }) => plan.plan === tab);

  // Pagination for plans
  const totalItems = plansByTab.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return plansByTab.slice(start, end);
  }, [plansByTab, currentPage]);

  const allVisiblePlans = visiblePlans.map(({ plan }) => plan);
  const totalPrincipal = allVisiblePlans.reduce(
    (s, p) => s + getPrincipal(p),
    0,
  );
  const totalProjected = allVisiblePlans.reduce(
    (s, p) => s + getProjectedReturn(p),
    0,
  );
  const totalGain = totalProjected - totalPrincipal;
  const avgRate =
    allVisiblePlans.length > 0
      ? allVisiblePlans.reduce(
          (s, p) => s + (PLAN_META[p.plan]?.rate ?? 0.15),
          0,
        ) / allVisiblePlans.length
      : 0;

  const planTypes = Array.from(new Set(allVisiblePlans.map((p) => p.plan)));
  const fundedInvestors = searchedPortfolios.filter(
    ({ plans: userPlans }) => userPlans.length > 0,
  ).length;

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchPortfolios();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Optional: Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#ff6900]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6900]">
            Admin Portfolio
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">
            Portfolio Overview
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Full picture of every investor position, searchable by user and
            plan.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by investor, email, phone, MetaMap status, or plan"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-[#ff6900] focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
              <SlidersHorizontal className="size-4" />
            </div>
            {FILTERS.map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`h-9 rounded-xl px-3 text-xs font-semibold transition-colors ${
                  filter === item.value
                    ? "bg-zinc-950 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
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
            label: "Avg. Interest",
            value: `${(avgRate * 100).toFixed(1)}% p.a.`,
            icon: <PiggyBank className="size-4" />,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            label: "Investors",
            value: `${fundedInvestors}/${searchedPortfolios.length}`,
            icon: <Users className="size-4" />,
            color: "text-zinc-700",
            bg: "bg-zinc-100",
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

      {!allVisiblePlans.length ? (
        <div className="flex min-h-96 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-200 bg-white text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-100">
            <UserRound className="size-7 text-zinc-400" />
          </div>
          <div>
            <p className="text-base font-bold text-zinc-900">
              No matching portfolios
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Try another search, filter, or investor.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl max-h-70 overflow-scroll border border-zinc-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Layers className="size-4 text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Allocation Breakdown
                </h3>
              </div>
              <div className="flex items-center gap-6">
                <DonutChart plans={allVisiblePlans} />
                <div className="flex-1 space-y-2.5">
                  {allVisiblePlans.map((inv, index) => {
                    const key = inv.plan.toLowerCase();
                    const meta = PLAN_META[key] ?? PLAN_META.premium;
                    const principal = getPrincipal(inv);
                    const pct =
                      totalPrincipal > 0
                        ? ((principal / totalPrincipal) * 100).toFixed(1)
                        : "0";
                    return (
                      <div
                        key={`${key}-${inv.monthly_payment_date}-${index}`}
                        className="flex items-center gap-2.5"
                      >
                        <div
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-zinc-700">
                              {meta.label}
                            </p>
                            <p className="text-xs font-bold tabular-nums text-zinc-900">
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

            <div className="rounded-2xl border max-h-70 overflow-scroll border-zinc-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="size-4 text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Maturity Timeline
                </h3>
              </div>
              <div className="space-y-4">
                {allVisiblePlans.map((inv, i) => {
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
                          <Icon
                            className="size-4"
                            style={{ color: meta.color }}
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-zinc-800">
                            {meta.label}
                          </p>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${meta.color}18`,
                              color: meta.color,
                            }}
                          >
                            {daysLeft > 0 ? `${daysLeft} days left` : "Matured"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-zinc-400">
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

          <div className="mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="size-4 text-zinc-400" />
              <h3 className="text-sm font-bold text-zinc-900">
                Returns Breakdown
              </h3>
              <div className="ml-auto flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500">
                <Info className="size-3" />
                Projections at maturity
              </div>
            </div>
            <div className="space-y-3">
              {allVisiblePlans.map((inv, i) => {
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
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: `${meta.color}30`,
                          }}
                        />
                        <div
                          className="absolute inset-y-0 rounded-r-lg transition-all duration-700"
                          style={{
                            left: `${barWidth}%`,
                            width: `${
                              totalPrincipal > 0
                                ? (gain / totalPrincipal) * 100
                                : 0
                            }%`,
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
                      <p className="text-xs font-black tabular-nums text-zinc-900">
                        {fmtShort(projected)}
                      </p>
                      <p className="text-[10px] text-zinc-400">at maturity</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            {planTypes.length > 1 && (
              <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
                {["all", ...planTypes].map((t) => {
                  const label =
                    t === "all"
                      ? `All Plans (${allVisiblePlans.length})`
                      : (PLAN_META[t]?.label ?? t);
                  return (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        tab === t
                          ? "bg-zinc-900 text-white shadow-sm"
                          : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedPlans.map(({ plan, owner }, i) => (
                <PlanCard
                  key={`${owner.id}-${plan.plan}-${i}`}
                  inv={plan}
                  owner={owner}
                  index={i}
                />
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
          </div>
        </>
      )}
    </div>
  );
}
