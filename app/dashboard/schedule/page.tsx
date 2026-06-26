"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Compliance, InvestmentPlan, UserProfile } from "@/types";

type EventType = "upfront" | "monthly" | "quarterly" | "annually" | "compounding" | "maturity" | "bd";

type CalendarEvent = {
  id: string;
  date: Date;
  amount: number;
  principal: number;
  tenorMonths: number;
  planIndex: number;
  hasPaid: boolean;
  plan: InvestmentPlan;
  compliance: Partial<Compliance> | null;
  eventType: EventType;
  monthNumber?: number;
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
  premium_plus: 0.12,
  premium: 0.2,
  reif: 0.22,
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
    plan.monthly_amount_figures ??
    plan.total_figures ??
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

function getExpectedPayoutAmount(plan: InvestmentPlan) {
  const planWithReturns = plan as InvestmentPlan & {
    payout_amount?: number;
    returns?: number;
  };
  const principal = getPlanAmount(plan);
  const planKey = plan.plan?.toLowerCase();
  const rate = plan.custom_rate ?? PLAN_RATES[planKey] ?? 0.15;
  const expectedGrowth = principal * rate;
  const configuredPayout =
    planWithReturns.payout_amount ?? planWithReturns.returns;
  return configuredPayout == null ? expectedGrowth : Number(configuredPayout);
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

function buildPayoutEvents(user: UserProfile, visibleMonth: Date): CalendarEvent[] {
  const rangeStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const rangeEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0, 23, 59, 59);
  const compliance = parseCompliance(user.compliance);

  return getPlans(user).flatMap((plan, planIndex) => {
    if (!plan.monthly_payment_date) return [];

    const startDate = new Date(plan.monthly_payment_date);
    if (Number.isNaN(startDate.getTime())) return [];

    const tenorMonths = parseTenorToMonths(plan.tenor);
    if (!tenorMonths) return [];

    // Skip investments that have already passed their maturity date
    const maturityDate = plan.due_date
      ? new Date(plan.due_date)
      : addMonthsClamped(startDate, tenorMonths);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (maturityDate < today) return [];

    const totalInterest = getExpectedPayoutAmount(plan);
    const principal = getPlanAmount(plan);
    const interestMode = plan.mode_of_interest ?? "";

    const makeEvent = (
      date: Date,
      amount: number,
      eventType: EventType,
      monthNumber?: number,
    ): CalendarEvent => ({
      id: `${plan.plan}-${planIndex}-${eventType}${monthNumber !== undefined ? `-${monthNumber}` : ""}`,
      date,
      amount,
      principal,
      tenorMonths,
      planIndex,
      hasPaid:
        eventType === "monthly" || eventType === "quarterly" || eventType === "annually" || eventType === "compounding"
          ? (plan.paid_months ?? []).includes(monthNumber!)
          : plan.has_paid === true,
      plan,
      compliance,
      eventType,
      monthNumber,
    });

    const events: CalendarEvent[] = [];

    // B/D: pinned to Dec 31 of the prior year
    const bdAmount = plan.interest_due_bd ?? 0;
    if (bdAmount > 0) {
      const bdDate = new Date(new Date().getFullYear() - 1, 11, 31);
      if (bdDate >= rangeStart && bdDate <= rangeEnd) {
        events.push(makeEvent(bdDate, bdAmount, "bd"));
      }
    }

    if (interestMode === "Upfront") {
      if (startDate >= rangeStart && startDate <= rangeEnd) {
        events.push(makeEvent(startDate, totalInterest, "upfront"));
      }
      return events;
    }

    if (interestMode === "Monthly" || interestMode === "End of Tenor") {
      const monthlyAmount = totalInterest / tenorMonths;
      for (let m = 1; m <= tenorMonths; m++) {
        const eventDate = addMonthsClamped(startDate, m);
        if (eventDate >= rangeStart && eventDate <= rangeEnd) {
          events.push(makeEvent(eventDate, monthlyAmount, "monthly", m));
        }
      }
      return events;
    }

    if (interestMode === "Quarterly") {
      const numPeriods = Math.max(1, Math.round(tenorMonths / 3));
      const quarterlyAmount = totalInterest / numPeriods;
      for (let q = 1; q <= numPeriods; q++) {
        const eventDate = addMonthsClamped(startDate, q * 3);
        if (eventDate >= rangeStart && eventDate <= rangeEnd) {
          events.push(makeEvent(eventDate, quarterlyAmount, "quarterly", q));
        }
      }
      return events;
    }

    if (interestMode === "Annually") {
      const numYears = Math.max(1, Math.round(tenorMonths / 12));
      const yearlyAmount = totalInterest / numYears;
      for (let y = 1; y <= numYears; y++) {
        const eventDate = addMonthsClamped(startDate, y * 12);
        if (eventDate >= rangeStart && eventDate <= rangeEnd) {
          events.push(makeEvent(eventDate, yearlyAmount, "annually", y));
        }
      }
      return events;
    }

    if (interestMode === "Compounding") {
      const monthlyAmount = totalInterest / tenorMonths;
      for (let m = 1; m <= tenorMonths; m++) {
        const eventDate = addMonthsClamped(startDate, m);
        if (eventDate >= rangeStart && eventDate <= rangeEnd) {
          events.push(makeEvent(eventDate, monthlyAmount, "compounding", m));
        }
      }
      return events;
    }

    // Fallback: single payment at maturity
    const fallbackMaturity = addMonthsClamped(startDate, tenorMonths);
    if (fallbackMaturity >= rangeStart && fallbackMaturity <= rangeEnd) {
      events.push(makeEvent(fallbackMaturity, totalInterest, "maturity"));
    }
    return events;
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
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
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
          <p className="mt-2 text-xl font-bold tabular-nums text-zinc-950">{value}</p>
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function UserSchedulePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const fetchUser = useCallback(async () => {
    setError(null);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated.");

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (fetchError) throw fetchError;
      setUser(data as UserProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const events = useMemo(
    () => (user ? buildPayoutEvents(user, visibleMonth) : []),
    [user, visibleMonth],
  );

  const calendarCells = useMemo(() => getMonthCells(visibleMonth), [visibleMonth]);

  const today = useMemo(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
    [],
  );

  const stats = useMemo(() => {
    const totalAmount = events.reduce((sum, e) => sum + e.amount, 0);
    const todayEvents = events.filter((e) => sameDay(e.date, new Date()));
    const paidCount = events.filter((e) => e.hasPaid).length;
    return {
      totalAmount,
      totalPayouts: events.length,
      paidCount,
      todayTotal: todayEvents.reduce((sum, e) => sum + e.amount, 0),
    };
  }, [events]);

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
    void fetchUser();
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
            Payout Schedule
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-950">My Payment Schedule</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track your upcoming interest payouts by date and plan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              setVisibleMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
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
          label="Paid This Month"
          value={stats.paidCount.toLocaleString("en-NG")}
          icon={<TrendingUp className="size-5" />}
          tone="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          label="Due Today"
          value={formatCurrency(stats.todayTotal)}
          icon={<Clock3 className="size-5" />}
          tone="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Calendar header */}
      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
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
              {events.length} payout{events.length === 1 ? "" : "s"} this month
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

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Legend</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
            <span className="size-2.5 rounded-full bg-emerald-500" /> Paid
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-600">
            <span className="size-2.5 rounded-full bg-red-500" /> Overdue
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#ff6900]">
            <span className="size-2.5 rounded-full bg-[#ff6900]" /> Upcoming
          </span>
          <span className="ml-auto hidden items-center gap-3 text-[10px] text-zinc-400 sm:flex">
            <span>M1/12 = monthly</span>
            <span>· Q1/4 = quarterly</span>
            <span>· Y1/2 = annually</span>
            <span>· C1/11 = compounding</span>
            <span>· Upfront = paid at start</span>
            <span>· Bal. B/D = balance brought down</span>
          </span>
        </div>
      </div>

      {/* Calendar grid */}
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
            const dayEvents = events.filter((e) => sameDay(e.date, date));
            const dailyTotal = dayEvents.reduce((sum, e) => sum + e.amount, 0);

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
                  {dayEvents.slice(0, 4).map((event) => {
                    const isOverdue = event.date < today && !event.hasPaid;
                    const isPaid = event.hasPaid;

                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelected(event)}
                        className={`group w-full rounded-lg border px-2 py-1.5 text-left transition-colors ${
                          isPaid
                            ? "border-emerald-300 bg-emerald-50 hover:border-emerald-500 hover:bg-emerald-100"
                            : isOverdue
                              ? "border-red-300 bg-red-50 hover:border-red-500 hover:bg-red-100"
                              : "border-[#ffd8bd] bg-[#fff7f0] hover:border-[#ff6900] hover:bg-[#fff1e6]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-xs font-bold text-zinc-900">
                            {PLAN_LABELS[event.plan.plan] ?? event.plan.plan}
                          </span>
                          <span
                            className={`shrink-0 text-[10px] font-bold tabular-nums ${
                              isPaid
                                ? "text-emerald-600"
                                : isOverdue
                                  ? "text-red-600"
                                  : "text-[#ff6900]"
                            }`}
                          >
                            {formatCurrency(event.amount)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[10px] font-medium text-zinc-500">
                          {event.eventType === "monthly" && event.monthNumber !== undefined
                            ? `M${event.monthNumber}/${event.tenorMonths}`
                            : event.eventType === "quarterly" && event.monthNumber !== undefined
                              ? `Q${event.monthNumber}/${Math.round(event.tenorMonths / 3)}`
                              : event.eventType === "annually" && event.monthNumber !== undefined
                                ? `Y${event.monthNumber}/${Math.round(event.tenorMonths / 12)}`
                                : event.eventType === "compounding" && event.monthNumber !== undefined
                                  ? `C${event.monthNumber}/${event.tenorMonths}`
                                  : event.eventType === "upfront"
                                    ? "Upfront"
                                    : event.eventType === "bd"
                                      ? "Bal. B/D"
                                      : "Maturity"}
                          {isPaid && " · Paid"}
                          {isOverdue && " · Overdue"}
                        </p>
                      </button>
                    );
                  })}

                  {dayEvents.length > 4 && (
                    <button
                      onClick={() => setSelected(dayEvents[4])}
                      className="w-full rounded-lg bg-zinc-100 px-2 py-1 text-left text-[10px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-200"
                    >
                      +{dayEvents.length - 4} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {events.length === 0 && (
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-10 text-center">
          <CalendarDays className="mb-3 size-9 text-zinc-300" />
          <p className="text-sm font-semibold text-zinc-700">
            No payouts scheduled for this month
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Navigate to another month to see your upcoming payouts.
          </p>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-black/45"
            onClick={() => setSelected(null)}
          />
          <div className="relative max-h-full w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6900]">
                    {selected.eventType === "monthly"
                      ? "Monthly Installment"
                      : selected.eventType === "quarterly"
                        ? "Quarterly Interest"
                        : selected.eventType === "annually"
                          ? "Annual Interest"
                          : selected.eventType === "compounding"
                            ? "Compounding Interest"
                            : selected.eventType === "upfront"
                              ? "Upfront Interest"
                              : selected.eventType === "bd"
                                ? "Balance Brought Down"
                                : "Payout Details"}
                  </p>
                  {selected.hasPaid && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="size-3" /> Paid
                    </span>
                  )}
                  {!selected.hasPaid && selected.date < today && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                      <AlertCircle className="size-3" /> Overdue
                    </span>
                  )}
                </div>
                <h2 className="mt-1 truncate text-lg font-bold text-zinc-950">
                  {formatCurrency(selected.amount)} due on {formatDate(selected.date)}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-5 py-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950">
                    <WalletCards className="size-4 text-[#ff6900]" />
                    Payout Details
                  </h3>
                  <div className="space-y-3">
                    <DetailRow label="Amount" value={formatCurrency(selected.amount)} />
                    <DetailRow label="Due date" value={formatDate(selected.date)} />
                    <DetailRow
                      label="Plan"
                      value={PLAN_LABELS[selected.plan.plan] ?? selected.plan.plan}
                    />
                    {selected.plan.investment_company && (
                      <DetailRow
                        label="Investment company"
                        value={selected.plan.investment_company}
                      />
                    )}
                    <DetailRow label="Tenor" value={selected.plan.tenor} />
                    <DetailRow label="Principal" value={formatCurrency(selected.principal)} />
                    <DetailRow
                      label="Interest repayment"
                      value={selected.plan.mode_of_interest}
                    />
                    {(selected.eventType === "monthly" ||
                      selected.eventType === "quarterly" ||
                      selected.eventType === "annually" ||
                      selected.eventType === "compounding") &&
                      selected.monthNumber !== undefined && (
                        <DetailRow
                          label="Installment"
                          value={
                            selected.eventType === "quarterly"
                              ? `Quarter ${selected.monthNumber} of ${Math.round(selected.tenorMonths / 3)}`
                              : selected.eventType === "annually"
                                ? `Year ${selected.monthNumber} of ${Math.round(selected.tenorMonths / 12)}`
                                : `Month ${selected.monthNumber} of ${selected.tenorMonths}`
                          }
                        />
                      )}
                    <DetailRow
                      label="Amount in words"
                      value={selected.plan.monthly_amount_words}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950">
                    <CreditCard className="size-4 text-[#ff6900]" />
                    Payment Information
                  </h3>
                  <div className="space-y-3">
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

                {selected.plan.due_date && (
                  <section className="sm:col-span-2">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950">
                      <ShieldCheck className="size-4 text-[#ff6900]" />
                      Plan Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <DetailRow label="Start date" value={formatDate(selected.plan.monthly_payment_date)} />
                      <DetailRow label="Maturity date" value={formatDate(selected.plan.due_date)} />
                      {selected.plan.mode_of_payment && (
                        <DetailRow label="Mode of payment" value={selected.plan.mode_of_payment} />
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-200 px-5 py-4">
              <div className="flex items-center gap-3">
                {selected.hasPaid ? (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="size-4" />
                    This payout has been received
                  </span>
                ) : selected.date < today ? (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                    <AlertCircle className="size-4" />
                    Payment overdue — contact support if not received
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">
                    Your interest payment will be transferred on the due date above.

                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
