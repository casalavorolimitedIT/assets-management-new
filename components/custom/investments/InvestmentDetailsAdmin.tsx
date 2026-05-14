"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { normalizeRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import type { Compliance, InvestmentPlan, UserProfile } from "@/types";

type UserFilter = "ALL" | "VERIFIED" | "PENDING" | "FUNDED";

const FILTERS: Array<{ label: string; value: UserFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Pending", value: "PENDING" },
  { label: "Funded", value: "FUNDED" },
];

const PLAN_LABELS: Record<string, string> = {
  premium: "Premium",
  premium_plus: "Premium Plus",
  reif: "REIF",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date?: string | null) {
  if (!date) return "Not available";
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
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
    (plan as unknown as { amount_figures?: number }).amount_figures ??
    plan.monthly_amount_figures ??
    0;
  return Number(value) || 0;
}

function getUserName(user: UserProfile) {
  const fullName = [user.title, user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ");
  return fullName || user.email;
}

function getInitials(user: UserProfile) {
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

function StatusBadge({ user }: { user: UserProfile }) {
  if (isMetamapVerified(user.metamap_status)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="size-3" />
        Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
      <Clock3 className="size-3" />
      Pending
    </span>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-1 wrap-break-words text-sm font-medium text-zinc-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
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
          <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-950">
            {value}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{sub}</p>
        </div>
        <div className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function InvestmentDetailsAdmin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("ALL");
  const [selected, setSelected] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async () => {
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const fetchedUsers = ((data ?? []) as UserProfile[]).filter(
        (profile) => normalizeRole(profile.role) !== "ADMIN",
      );
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const stats = useMemo(() => {
    const verified = users.filter((user) =>
      isMetamapVerified(user.metamap_status),
    ).length;
    const funded = users.filter((user) => getPlans(user).length > 0).length;
    const totalCapital = users.reduce(
      (sum, user) =>
        sum + getPlans(user).reduce((planSum, plan) => planSum + getPlanAmount(plan), 0),
      0,
    );

    return {
      total: users.length,
      verified,
      pending: users.length - verified,
      funded,
      totalCapital,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const plans = getPlans(user);
      const searchable = [
        user.first_name,
        user.last_name,
        user.email,
        user.phone,
        user.metamap_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesFilter =
        filter === "ALL" ||
        (filter === "VERIFIED" && isMetamapVerified(user.metamap_status)) ||
        (filter === "PENDING" && !isMetamapVerified(user.metamap_status)) ||
        (filter === "FUNDED" && plans.length > 0);

      return matchesSearch && matchesFilter;
    });
  }, [filter, search, users]);

  const openUser = (user: UserProfile) => {
    setSelected(user);
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
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6900]">
            Admin Workspace
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-950">
            Investor Management
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Review profiles, track investment coverage, and inspect compliance
            records.
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Investors"
          value={stats.total.toLocaleString("en-NG")}
          sub={`${stats.funded} with active plans`}
          icon={<Users className="size-5" />}
          tone="bg-zinc-900 text-white"
        />
        <StatCard
          label="Verified"
          value={stats.verified.toLocaleString("en-NG")}
          sub={`${stats.pending} pending review`}
          icon={<ShieldCheck className="size-5" />}
          tone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Capital Tracked"
          value={formatCurrency(stats.totalCapital)}
          sub="Across submitted plans"
          icon={<Banknote className="size-5" />}
          tone="bg-[#fff1e6] text-[#ff6900]"
        />
        <StatCard
          label="Coverage"
          value={`${stats.total ? Math.round((stats.funded / stats.total) * 100) : 0}%`}
          sub="Investors with plan data"
          icon={<TrendingUp className="size-5" />}
          tone="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search investors by name, email, phone, or status"
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

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(260px,1.5fr)_130px_150px_140px_56px] border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 lg:grid">
          <span>Investor</span>
          <span>Status</span>
          <span>Plans</span>
          <span>Joined</span>
          <span />
        </div>

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <UserRound className="mb-3 size-9 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-600">
              No investors found
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Try a different search or filter.
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const plans = getPlans(user);
            const totalInvested = plans.reduce(
              (sum, plan) => sum + getPlanAmount(plan),
              0,
            );

            return (
              <button
                key={user.id}
                onClick={() => openUser(user)}
                className="grid w-full gap-3 border-b border-zinc-100 px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-zinc-50 lg:grid-cols-[minmax(260px,1.5fr)_130px_150px_140px_56px] lg:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-sm font-bold text-[#ff6900]">
                    {getInitials(user)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-950">
                      {getUserName(user)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-3" />
                        {user.email}
                      </span>
                      {user.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" />
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <StatusBadge user={user} />
                </div>

                <div className="text-sm">
                  <p className="font-semibold text-zinc-900">
                    {formatCurrency(totalInvested)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {plans.length} plan{plans.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="inline-flex items-center gap-1 text-xs text-zinc-500">
                  <CalendarDays className="size-3.5" />
                  {formatDate(user.created_at)}
                </div>

                <ChevronRight className="hidden size-4 text-zinc-300 lg:block" />
              </button>
            );
          })
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Close user details"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelected(null)}
          />
          <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6900]">
                  Investor Record
                </p>
                <h2 className="mt-1 truncate text-lg font-bold text-zinc-950">
                  {getUserName(selected)}
                </h2>
                <p className="mt-0.5 truncate text-sm text-zinc-500">
                  {selected.email}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {(() => {
                const compliance = parseCompliance(selected.compliance);
                const personal = compliance?.personal_info;
                const bio = compliance?.bio_data;
                const bank = compliance?.bank_details;
                const plans = getPlans(selected);

                return (
                  <>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <StatusBadge user={selected} />
              </div>

              <section className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-zinc-950">
                  Profile
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReadOnlyField label="Full name" value={getUserName(selected)} />
                  <ReadOnlyField label="Email" value={selected.email} />
                  <ReadOnlyField label="Phone" value={selected.phone} />
                  <ReadOnlyField
                    label="Member since"
                    value={formatDate(selected.created_at)}
                  />
                  <ReadOnlyField
                    label="Last updated"
                    value={formatDate(selected.updated_at)}
                  />
                </div>
              </section>

              <section className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-zinc-950">
                  Personal & Bio Data
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReadOnlyField label="Gender" value={personal?.gender} />
                  <ReadOnlyField label="Nationality" value={personal?.nationality} />
                  <ReadOnlyField label="Means of ID" value={personal?.means_of_id} />
                  <ReadOnlyField label="ID number" value={personal?.id_number} />
                  <ReadOnlyField label="Occupation" value={personal?.occupation} />
                  <ReadOnlyField label="Job title" value={personal?.job_title} />
                  <ReadOnlyField
                    label="Date of birth"
                    value={formatDate(bio?.date_of_birth)}
                  />
                  <ReadOnlyField label="State of origin" value={bio?.state_of_origin} />
                  <ReadOnlyField label="LGA" value={bio?.lga} />
                  <ReadOnlyField
                    label="Employment type"
                    value={bio?.employment_type?.join(", ")}
                  />
                </div>
              </section>

              <section className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-zinc-950">
                  Next of Kin & Bank
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReadOnlyField label="Next of kin" value={bio?.next_of_kin} />
                  <ReadOnlyField
                    label="Next of kin phone"
                    value={bio?.next_of_kin_phone}
                  />
                  <ReadOnlyField
                    label="Next of kin address"
                    value={bio?.next_of_kin_address}
                  />
                  <ReadOnlyField label="Bank" value={bank?.bank_name} />
                  <ReadOnlyField label="Account name" value={bank?.account_name} />
                  <ReadOnlyField
                    label="Account number"
                    value={bank?.account_number}
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-zinc-950">
                  Investment Plans
                </h3>
                <div className="space-y-3">
                  {plans.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400">
                      No submitted investment plan.
                    </div>
                  ) : (
                    plans.map((plan, index) => (
                      <div
                        key={`${plan.plan}-${index}`}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-zinc-950">
                              {PLAN_LABELS[plan.plan] ?? plan.plan}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {plan.tenor ?? "No tenor"} ·{" "}
                              {plan.mode_of_payment ?? "No payment mode"}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-zinc-950">
                            {formatCurrency(getPlanAmount(plan))}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
                  </>
                );
              })()}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
