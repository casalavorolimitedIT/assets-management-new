"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  Search,
  RefreshCw,
  BarChart3,
  Cake,
  CalendarClock,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types";
import { currency } from "@/types/helpers";
import { StatCard } from "../StatCard";
import { Pagination } from "../Pagination";

const PAGE_SIZE = 10;

interface Stats {
  total: number;
  verified: number;
  pending: number;
  admins: number;
  totalInvested: number;
  totalUnits: number;
}

interface BirthdayEntry {
  name: string;
  email: string;
  phone: string;
  dob: string;
  daysUntil: number;
  turningAge: number;
}

function getUpcomingBirthdays(
  users: UserProfile[],
  withinDays = 30,
): BirthdayEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results: BirthdayEntry[] = [];

  for (const user of users) {
    const compliance =
      typeof user.compliance === "string"
        ? (() => {
            try {
              return JSON.parse(user.compliance);
            } catch {
              return null;
            }
          })()
        : user.compliance;
    const dob = compliance?.bio_data?.date_of_birth;
    if (!dob) continue;

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) continue;

    const nextBirthday = new Date(
      today.getFullYear(),
      dobDate.getMonth(),
      dobDate.getDate(),
    );
    if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);

    const daysUntil = Math.round(
      (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntil > withinDays) continue;

    const turningAge = nextBirthday.getFullYear() - dobDate.getFullYear();
    results.push({
      name: `${user.title ?? ""} ${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      phone: user.phone,
      dob,
      daysUntil,
      turningAge,
    });
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

function formatBirthdayDate(dob: string): string {
  const d = new Date(dob);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long" });
}

interface PayoutEntry {
  name: string;
  email: string;
  phone: string;
  planName: string;
  payoutDate: string;
  payoutAmount: number;
  units: number;
  daysUntil: number;
}

function getUpcomingPayouts(
  users: UserProfile[],
  withinDays = 60,
): PayoutEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results: PayoutEntry[] = [];

  const parseTenorToMonths = (tenor: string): number => {
    if (!tenor) return 0;
    const match = tenor.match(/(\d+)\s*(?:Month|month)/);
    if (match) {
      return parseInt(match[1]);
    }
    const months = parseInt(tenor);
    return isNaN(months) ? 0 : months;
  };

  for (const user of users) {
    const compliance =
      typeof user.compliance === "string"
        ? (() => {
            try {
              return JSON.parse(user.compliance);
            } catch {
              return null;
            }
          })()
        : user.compliance;

    if (!compliance) continue;

    const plans: any[] =
      compliance.investment_plans ??
      (compliance.investment_plan ? [compliance.investment_plan] : []);

    for (const plan of plans) {
      if (!plan.monthly_payment_date) {
        console.log(`No monthly_payment_date for ${user.first_name}`);
        continue;
      }

      const startDate = new Date(plan.monthly_payment_date);
      if (isNaN(startDate.getTime())) {
        console.log(
          `Invalid start date for ${user.first_name}: ${plan.monthly_payment_date}`,
        );
        continue;
      }

      const monthsToAdd = parseTenorToMonths(plan.tenor);
      if (monthsToAdd === 0) {
        console.log(
          `Could not parse tenor for ${user.first_name}: ${plan.tenor}`,
        );
        continue;
      }

      const payoutDate = new Date(startDate);
      payoutDate.setMonth(payoutDate.getMonth() + monthsToAdd);

      const daysUntil = Math.round(
        (payoutDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Only include future payouts within the specified range
      if (daysUntil < 0 || daysUntil > withinDays) continue;

      const principal = plan.total_figures ?? plan.monthly_amount_figures ?? 0;

      const planKey = plan.plan?.toLowerCase();
      const PLAN_RATES: Record<string, number> = {
        premium_plus: 0.12,
        premium: 0.2,
        reif: 0.22,
      };
      const annualRate = PLAN_RATES[planKey] ?? 0.15;

      const expectedReturns = principal * (1 + (annualRate * monthsToAdd) / 12);

      const payoutAmount =
        plan.payout_amount ?? plan.returns ?? expectedReturns;

      results.push({
        name: `${user.title ?? ""} ${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
        phone: user.phone,
        planName: plan.plan?.toUpperCase() ?? "Investment Plan",
        payoutDate: payoutDate.toISOString(),
        payoutAmount: payoutAmount,
        units: plan.units ?? 0,
        daysUntil,
      });
    }
  }

  // Sort by closest payout first
  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

function formatPayoutDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const UpcomingBirthdays = ({ users }: { users: UserProfile[] }) => {
  const birthdays = getUpcomingBirthdays(users, 30);

  if (birthdays.length === 0)
    return (
      <div className="flex flex-col h-full">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
          Upcoming Birthdays
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-6 text-center flex-1 flex flex-col items-center justify-center">
          <Cake size={22} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            No birthdays in the next 30 days
          </p>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
        Birthdays{" "}
        <span className="normal-case font-normal">({birthdays.length})</span>
      </p>
      <div className="space-y-2">
        {birthdays.map((b, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3"
          >
            <div
              className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold ${
                b.daysUntil === 0
                  ? "bg-pink-100 text-pink-600"
                  : b.daysUntil <= 7
                    ? "bg-amber-50 text-amber-600"
                    : "bg-violet-50 text-violet-600"
              }`}
            >
              {b.daysUntil === 0 ? (
                <Cake size={18} />
              ) : (
                <>
                  <span className="text-base leading-none">{b.daysUntil}</span>
                  <span className="text-[9px] font-medium opacity-70">
                    days
                  </span>
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {b.name}
                </p>
                {b.daysUntil === 0 && (
                  <span className="text-[10px] font-medium text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded-full shrink-0">
                    Today! 🎂
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 truncate">{b.email}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {formatBirthdayDate(b.dob)} · Turning {b.turningAge}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UpcomingPayouts = ({ users }: { users: UserProfile[] }) => {
  const payouts = getUpcomingPayouts(users, 30);

  if (payouts.length === 0)
    return (
      <div className="flex flex-col h-full">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
          Upcoming Payouts
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center flex-1 flex flex-col items-center justify-center">
          <CalendarClock size={22} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            No payouts in the next 30 days
          </p>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
        Payouts{" "}
        <span className="normal-case font-normal">({payouts.length})</span>
      </p>
      <div className="space-y-2">
        {payouts.map((p, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3"
          >
            <div
              className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold ${
                p.daysUntil === 0
                  ? "bg-emerald-100 text-emerald-600"
                  : p.daysUntil <= 7
                    ? "bg-orange-50 text-orange-600"
                    : "bg-sky-50 text-sky-600"
              }`}
            >
              {p.daysUntil === 0 ? (
                <TrendingUp size={18} />
              ) : (
                <>
                  <span className="text-base leading-none">{p.daysUntil}</span>
                  <span className="text-[9px] font-medium opacity-70">
                    days
                  </span>
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {p.name}
                </p>
                {p.daysUntil === 0 && (
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">
                    Due today!
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 truncate">{p.planName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-semibold text-emerald-600">
                  {currency(p.payoutAmount)}
                </span>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[10px] text-gray-500">
                  {formatPayoutDate(p.payoutDate)}
                </span>
                {p.units > 0 && (
                  <>
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-gray-500">
                      {p.units} units
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatusBadge = ({ metamap }: { metamap: string | null }) => {
  if (metamap === "approved")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={11} /> Verified
      </span>
    );
  if (metamap === "rejected")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
        <XCircle size={11} /> Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <Clock size={11} /> Pending
    </span>
  );
};

export const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) =>
  value ? (
    <div className="flex flex-col gap-0.5 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  ) : null;

const AdminDashboard = () => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "VERIFIED" | "PENDING" | "REJECTED"
  >("ALL");
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const supabase = createClient();

  const fetchAllUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "USER")
      .order("created_at", { ascending: false });
    if (data) setAllUsers(data as UserProfile[]);
  };

  const fetchAdmins = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "ADMIN")
      .order("created_at", { ascending: false });
    if (data) setAdmins(data as UserProfile[]);
  };

  const fetchPage = async (
    targetPage: number,
    currentSearch: string,
    currentFilter: string,
  ) => {
    setPageLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "USER")
        .order("created_at", { ascending: false })
        .range((targetPage - 1) * PAGE_SIZE, targetPage * PAGE_SIZE - 1);

      if (currentFilter === "VERIFIED")
        query = query.eq("metamap_status", "approved");
      else if (currentFilter === "REJECTED")
        query = query.eq("metamap_status", "rejected");
      else if (currentFilter === "PENDING")
        query = query
          .neq("metamap_status", "approved")
          .neq("metamap_status", "rejected");

      if (currentSearch.trim()) {
        query = query.or(
          `first_name.ilike.%${currentSearch}%,last_name.ilike.%${currentSearch}%,email.ilike.%${currentSearch}%,phone.ilike.%${currentSearch}%`,
        );
      }

      const { data, count } = await query;
      if (data) setUsers(data as UserProfile[]);
      if (count !== null) setTotalCount(count);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchAllUsers(),
        fetchAdmins(),
        fetchPage(1, "", "ALL"),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchPage(page, search, filter);
  }, [page, search, filter]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilter = (value: typeof filter) => {
    setFilter(value);
    setPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAllUsers(),
      fetchAdmins(),
      fetchPage(page, search, filter),
    ]);
    setRefreshing(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Stats computed from ALL users (not just the current page)
  const stats: Stats = {
    total: allUsers.length,
    verified: allUsers.filter((u) => u.metamap_status === "approved").length,
    pending: allUsers.filter(
      (u) => u.metamap_status !== "approved" && u.metamap_status !== "rejected",
    ).length,
    admins: admins.length,
    totalInvested: allUsers.reduce((sum, u) => {
      const c =
        typeof u.compliance === "string"
          ? JSON.parse(u.compliance ?? "{}")
          : u.compliance;
      const plans: any[] = c?.investment_plans ?? [];
      const plansTotal = plans.reduce((s: number, p: any) => {
        return s + (p.total_figures ?? p.monthly_amount_figures ?? 0);
      }, 0);
      const legacyTotal =
        !c?.investment_plans && c?.investment_plan
          ? (c.investment_plan.total_figures ??
            c.investment_plan.monthly_amount_figures ??
            0)
          : 0;
      return sum + plansTotal + legacyTotal;
    }, 0),
    totalUnits: allUsers.reduce((sum, u) => {
      const c =
        typeof u.compliance === "string"
          ? JSON.parse(u.compliance ?? "{}")
          : u.compliance;
      const plans: any[] =
        c?.investment_plans ?? (c?.investment_plan ? [c.investment_plan] : []);
      return sum + plans.reduce((s: number, p: any) => s + (p.units ?? 0), 0);
    }, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="text-primary animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw
              size={15}
              className={`text-gray-500 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        <p className="text-sm text-gray-400">
          Overview of all users and investments
        </p>
      </div>

      {/* Birthdays + Payouts — use allUsers so they're never paginated */}
      <div className="grid lg:grid-cols-2 gap-3 mb-6">
        <UpcomingBirthdays users={allUsers} />
        <UpcomingPayouts users={allUsers} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={<Users size={16} />}
          label="Total Users"
          value={stats.total}
          sub={`${stats.admins} admin${stats.admins !== 1 ? "s" : ""}`}
          accent="bg-slate-900 text-white border-slate-800"
        />
        <StatCard
          icon={<CheckCircle2 size={16} />}
          label="Verified"
          value={stats.verified}
          sub={`${stats.pending} pending`}
          accent="bg-emerald-50 text-emerald-900 border-emerald-100"
        />
        <StatCard
          icon={<Banknote size={16} />}
          label="Total Invested"
          value={currency(stats.totalInvested)}
          accent="bg-primary/20 text-black border-primary/20"
          sub="Across all user accounts"
        />
        <StatCard
          icon={<BarChart3 size={16} />}
          label="Total Units"
          value={stats.totalUnits}
          sub="across all plans"
          accent="bg-amber-50 text-amber-900 border-amber-100"
        />
      </div>

      {/* Filters */}
      <div className="mb-4">
        <div className="relative mb-3">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(["ALL", "VERIFIED", "PENDING", "REJECTED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      <div
        className={`space-y-2 mb-4 transition-opacity duration-150 ${pageLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        {users.length === 0 && !pageLoading && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No users match your search.
          </div>
        )}
        {users.map((user) => {
          const compliance =
            typeof user.compliance === "string"
              ? JSON.parse(user.compliance ?? "{}")
              : user.compliance;
          const plans: any[] =
            compliance?.investment_plans ??
            (compliance?.investment_plan ? [compliance.investment_plan] : []);
          const totalInvested = plans.reduce(
            (s: number, p: any) =>
              s + (p.total_figures ?? p.monthly_amount_figures ?? 0),
            0,
          );

          return (
            <div
              key={user.id}
              onClick={() => setSelected(user)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-primary/20 transition-colors cursor-pointer active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.title} {user.first_name} {user.last_name}
                  </p>
                  <StatusBadge metamap={user.metamap_status} />
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {user.email}
                </p>
                {totalInvested > 0 && (
                  <p className="text-xs text-primary font-medium mt-1">
                    {currency(totalInvested)} · {plans.length} plan
                    {plans.length !== 1 ? "s" : ""}
                  </p>
                )}
                {user.role === "ADMIN" && (
                  <p className="text-xs text-blue-500 font-semibold mt-0.5">
                    Administrator
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
};

export default AdminDashboard;
