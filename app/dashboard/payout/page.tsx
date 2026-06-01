"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { normalizeRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import type { Compliance, InvestmentPlan, UserProfile } from "@/types";

type CalendarEvent = {
  id: string;
  date: Date;
  amount: number;
  principal: number;
  tenorMonths: number;
  user: UserProfile;
  plan: InvestmentPlan;
  compliance: Partial<Compliance> | null;
};

const supabase = createClient();

const PLAN_LABELS: Record<string, string> = {
  premium: "Premium",
  premium_plus: "Premium Plus",
  reif: "REIF",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  month: "long",
  year: "numeric",
});
const PLAN_RATES: Record<string, number> = {
  premium_plus: 0.17,
  premium: 0.15,
  reif: 0.12,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "Not provided";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

function getPlans(user: UserProfile): InvestmentPlan[] {
  const compliance = parseCompliance(user.compliance);
  if (Array.isArray(compliance?.investment_plans)) {
    return compliance.investment_plans;
  }
  return compliance?.investment_plan ? [compliance.investment_plan] : [];
}

function getPlanAmount(plan: InvestmentPlan) {
  const value =
    plan.total_figures ??
    plan.monthly_amount_figures ??
    (plan as unknown as { amount_figures?: number }).amount_figures ??
    0;

  return Number(value) || 0;
}

function parseTenorToMonths(tenor?: string | null) {
  if (!tenor) return 0;

  const match = tenor.match(/(\d+)\s*(?:Month|month)/);
  if (match) return parseInt(match[1], 10);

  const months = parseInt(tenor, 10);
  return Number.isNaN(months) ? 0 : months;
}

function getExpectedPayoutAmount(plan: InvestmentPlan, tenorMonths: number) {
  const planWithReturns = plan as InvestmentPlan & {
    payout_amount?: number;
    returns?: number;
  };
  const principal = getPlanAmount(plan);
  const planKey = plan.plan?.toLowerCase();
  const annualRate = PLAN_RATES[planKey] ?? 0.15;
  const expectedGrowth = principal * ((annualRate * tenorMonths) / 12);
  const configuredPayout =
    planWithReturns.payout_amount ?? planWithReturns.returns;

  return configuredPayout == null ? expectedGrowth : Number(configuredPayout);
}

function getUserName(user: UserProfile) {
  return (
    [user.title, user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.email
  );
}

function getInitials(user: UserProfile) {
  return (
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
    "U"
  );
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addMonthsClamped(date: Date, months: number) {
  const next = new Date(date);
  const targetDay = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(targetDay, lastDay));
  return next;
}

function getMonthCells(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstVisible = new Date(start);
  firstVisible.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisible);
    date.setDate(firstVisible.getDate() + index);
    return date;
  });
}

function buildPayoutEvents(users: UserProfile[], visibleMonth: Date) {
  const rangeStart = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  );
  const rangeEnd = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  return users
    .flatMap((user) => {
      const compliance = parseCompliance(user.compliance);

      return getPlans(user).flatMap((plan, planIndex) => {
        if (!plan.monthly_payment_date) return [];

        const startDate = new Date(plan.monthly_payment_date);
        if (Number.isNaN(startDate.getTime())) return [];

        const tenorMonths = parseTenorToMonths(plan.tenor);
        if (!tenorMonths) return [];

        const payoutDate = addMonthsClamped(startDate, tenorMonths);
        if (payoutDate < rangeStart || payoutDate > rangeEnd) return [];

        return [
          {
            id: `${user.id}-${plan.plan}-${planIndex}-${tenorMonths}`,
            date: payoutDate,
            amount: getExpectedPayoutAmount(plan, tenorMonths),
            principal: getPlanAmount(plan),
            tenorMonths,
            user,
            plan,
            compliance,
          },
        ];
      });
    })
    .sort((a, b) => {
      const timeDiff = a.date.getTime() - b.date.getTime();
      if (timeDiff) return timeDiff;
      return getUserName(a.user).localeCompare(getUserName(b.user));
    });
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-1 wrap-break-words text-sm font-semibold text-zinc-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </p>
          <p className="mt-2 text-xl font-bold tabular-nums text-zinc-950">
            {value}
          </p>
        </div>
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function PayoutSchedulePage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setUsers(
        ((data ?? []) as UserProfile[]).filter(
          (profile) => normalizeRole(profile.role) !== "ADMIN",
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load payout schedule.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const events = useMemo(
    () => buildPayoutEvents(users, visibleMonth),
    [users, visibleMonth],
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return events;

    return events.filter((event) => {
      const bank = event.compliance?.bank_details;
      const searchable = [
        getUserName(event.user),
        event.user.email,
        event.user.phone,
        PLAN_LABELS[event.plan.plan] ?? event.plan.plan,
        bank?.bank_name,
        bank?.account_name,
        bank?.account_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [events, search]);

  const calendarCells = useMemo(() => getMonthCells(visibleMonth), [visibleMonth]);

  const stats = useMemo(() => {
    const totalAmount = filteredEvents.reduce(
      (sum, event) => sum + event.amount,
      0,
    );
    const uniqueUsers = new Set(filteredEvents.map((event) => event.user.id));
    const todayEvents = filteredEvents.filter((event) =>
      sameDay(event.date, new Date()),
    );

    return {
      totalAmount,
      totalPayouts: filteredEvents.length,
      uniqueUsers: uniqueUsers.size,
      todayTotal: todayEvents.reduce((sum, event) => sum + event.amount, 0),
    };
  }, [filteredEvents]);

  const changeMonth = (offset: number) => {
    setVisibleMonth((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + offset);
      return next;
    });
    setSelected(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchUsers();
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
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6900]">
            Admin Payout Schedule
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-950">
            Payout Schedule
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track upcoming investor payouts by date, recipient, and bank
            destination.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              setVisibleMonth(
                new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              )
            }
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
          >
            Today
          </button>
          <button
            onClick={handleRefresh}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Month Total"
          value={formatCurrency(stats.totalAmount)}
          icon={<Banknote className="size-5" />}
          tone="bg-[#fff1e6] text-[#ff6900]"
        />
        <SummaryCard
          label="Scheduled Payouts"
          value={stats.totalPayouts.toLocaleString("en-NG")}
          icon={<CalendarDays className="size-5" />}
          tone="bg-zinc-900 text-white"
        />
        <SummaryCard
          label="Recipients"
          value={stats.uniqueUsers.toLocaleString("en-NG")}
          icon={<UserRound className="size-5" />}
          tone="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          label="Due Today"
          value={formatCurrency(stats.todayTotal)}
          icon={<Clock3 className="size-5" />}
          tone="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="min-w-52 text-center">
              <p className="text-lg font-bold text-zinc-950">
                {MONTH_FORMATTER.format(visibleMonth)}
              </p>
              <p className="text-xs text-zinc-400">
                {filteredEvents.length} payout
                {filteredEvents.length === 1 ? "" : "s"} visible
              </p>
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50"
              aria-label="Next month"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="relative min-w-0 flex-1 xl:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by investor, plan, bank, or account"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-[#ff6900] focus:bg-white"
            />
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7">
          {calendarCells.map((date) => {
            const inMonth = date.getMonth() === visibleMonth.getMonth();
            const dayEvents = filteredEvents.filter((event) =>
              sameDay(event.date, date),
            );
            const dailyTotal = dayEvents.reduce(
              (sum, event) => sum + event.amount,
              0,
            );

            return (
              <div
                key={date.toISOString()}
                className={`min-h-36 border-b border-zinc-100 p-2 md:border-r md:last:border-r-0 ${
                  inMonth ? "bg-white" : "bg-zinc-50/70"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={`flex size-7 items-center justify-center rounded-full text-sm font-semibold ${
                      sameDay(date, new Date())
                        ? "bg-[#ff6900] text-white"
                        : inMonth
                          ? "text-zinc-900"
                          : "text-zinc-300"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {dailyTotal > 0 && (
                    <span className="hidden truncate text-[10px] font-bold text-zinc-400 xl:block">
                      {formatCurrency(dailyTotal)}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {dayEvents.slice(0, 4).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelected(event)}
                      className="group w-full rounded-lg border border-[#ffd8bd] bg-[#fff7f0] px-2 py-1.5 text-left transition-colors hover:border-[#ff6900] hover:bg-[#fff1e6]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-bold text-zinc-900">
                          {getUserName(event.user)}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold tabular-nums text-[#ff6900]">
                          {formatCurrency(event.amount)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] font-medium text-zinc-500">
                        {PLAN_LABELS[event.plan.plan] ?? event.plan.plan}
                      </p>
                    </button>
                  ))}

                  {dayEvents.length > 4 && (
                    <button
                      onClick={() => setSelected(dayEvents[4])}
                      className="w-full rounded-lg bg-zinc-100 px-2 py-1 text-left text-[10px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-200"
                    >
                      +{dayEvents.length - 4} more payout
                      {dayEvents.length - 4 === 1 ? "" : "s"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {filteredEvents.length === 0 && (
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-10 text-center">
          <CalendarDays className="mb-3 size-9 text-zinc-300" />
          <p className="text-sm font-semibold text-zinc-700">
            No payouts scheduled for this view
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Try another month or clear the search field.
          </p>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            aria-label="Close payout details"
            className="absolute inset-0 bg-black/45"
            onClick={() => setSelected(null)}
          />
          <div className="relative max-h-full w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6900]">
                  Payout Details
                </p>
                <h2 className="mt-1 truncate text-lg font-bold text-zinc-950">
                  {formatCurrency(selected.amount)} to{" "}
                  {getUserName(selected.user)}
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Due on {formatDate(selected.date)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-150px)] overflow-y-auto px-5 py-5">
              <div className="mb-5 flex items-center gap-3 rounded-2xl bg-zinc-950 p-4 text-white">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                  {getInitials(selected.user)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold">
                    {getUserName(selected.user)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3" />
                      {selected.user.email}
                    </span>
                    {selected.user.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3" />
                        {selected.user.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950">
                    <WalletCards className="size-4 text-[#ff6900]" />
                    Payout
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <DetailRow
                      label="Amount to pay"
                      value={formatCurrency(selected.amount)}
                    />
                    <DetailRow
                      label="Payout date"
                      value={formatDate(selected.date)}
                    />
                    <DetailRow
                      label="Plan"
                      value={
                        PLAN_LABELS[selected.plan.plan] ?? selected.plan.plan
                      }
                    />
                    <DetailRow label="Tenor" value={selected.plan.tenor} />
                    <DetailRow
                      label="Principal"
                      value={formatCurrency(selected.principal)}
                    />
                    <DetailRow
                      label="Interest repayment"
                      value={selected.plan.mode_of_interest}
                    />
                    <DetailRow
                      label="Amount in words"
                      value={selected.plan.monthly_amount_words}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950">
                    <CreditCard className="size-4 text-[#ff6900]" />
                    Send To
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <DetailRow
                      label="Bank"
                      value={selected.compliance?.bank_details?.bank_name}
                    />
                    <DetailRow
                      label="Account name"
                      value={selected.compliance?.bank_details?.account_name}
                    />
                    <DetailRow
                      label="Account number"
                      value={selected.compliance?.bank_details?.account_number}
                    />
                    <DetailRow
                      label="Payment method"
                      value={selected.plan.mode_of_payment}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950">
                    <ShieldCheck className="size-4 text-[#ff6900]" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <DetailRow
                      label="Gender"
                      value={selected.compliance?.personal_info?.gender}
                    />
                    <DetailRow
                      label="Date of birth"
                      value={formatDate(
                        selected.compliance?.bio_data?.date_of_birth,
                      )}
                    />
                    <DetailRow
                      label="Nationality"
                      value={selected.compliance?.personal_info?.nationality}
                    />
                    <DetailRow
                      label="Occupation"
                      value={selected.compliance?.personal_info?.occupation}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950">
                    <MapPin className="size-4 text-[#ff6900]" />
                    Contact & Identity
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <DetailRow label="Phone" value={selected.user.phone} />
                    <DetailRow
                      label="Means of ID"
                      value={selected.compliance?.personal_info?.means_of_id}
                    />
                    <DetailRow
                      label="ID number"
                      value={selected.compliance?.personal_info?.id_number}
                    />
                    <DetailRow
                      label="State / LGA"
                      value={[
                        selected.compliance?.bio_data?.state_of_origin,
                        selected.compliance?.bio_data?.lga,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
