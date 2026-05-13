"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Calendar,
  Clock,
  Crown,
  Star,
  Zap,
  Plus,
  Building2,
  CreditCard,
  BadgeCheck,
  Loader2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AddPlanModal } from "./AddPlanModal";
import { EditBankModal } from "./EditBankModal";

export interface InvestmentPlan {
  plan: string;
  tenor: string;
  monthly_amount_words: string;
  monthly_payment_date: string;
  monthly_amount_figures: number;
}

export interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
}

interface Compliance {
  bio_data?: Record<string, unknown>;
  bank_details?: BankDetails;
  personal_info?: Record<string, unknown>;
  investment_plan?: InvestmentPlan;
  investment_plans?: InvestmentPlan[];
}

export const PLAN_META: Record<
  string,
  { icon: React.ElementType; gradient: string; badge: string; perks: string[] }
> = {
  premium_plus: {
    icon: Crown,
    gradient: "from-amber-500 via-orange-500 to-[#ff6900]",
    badge: "bg-amber-100 text-amber-700",
    perks: [
      "Priority customer support",
      "Monthly performance reports",
      "Early access to new plans",
    ],
  },
  premium: {
    icon: Star,
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
    badge: "bg-blue-100 text-blue-700",
    perks: ["Standard support", "Quarterly reports", "Plan upgrade available"],
  },
  reif: {
    icon: Zap,
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    badge: "bg-emerald-100 text-emerald-700",
    perks: [
      "Real Estate Investment Fund",
      "Unit-based returns",
      "Flexible withdrawal",
    ],
  },
  basic: {
    icon: Zap,
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    badge: "bg-emerald-100 text-emerald-700",
    perks: ["Email support", "Annual report", "Flexible withdrawal"],
  },
  standard: {
    icon: Star,
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
    badge: "bg-blue-100 text-blue-700",
    perks: ["Standard support", "Quarterly reports", "Plan upgrade available"],
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
    month: "long",
    year: "numeric",
  });

export default function InvestmentDetails() {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditBank, setShowEditBank] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setFetchError("Not authenticated.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("compliance")
          .eq("id", user.id)
          .single();

        if (error) throw new Error(error.message);

        const compliance = data?.compliance as Compliance | null;

        const normalise = (ip: InvestmentPlan): InvestmentPlan => {
          const get = (key: string): unknown =>
            (ip as unknown as Record<string, unknown>)[key];

          return {
            plan: ip.plan,
            tenor: ip.tenor ?? "N/A",
            monthly_amount_words:
              ip.monthly_amount_words ??
              (get("amount_words") as string) ??
              (get("total_words") as string) ??
              "",
            monthly_payment_date:
              ip.monthly_payment_date ?? new Date().toISOString().split("T")[0],
            monthly_amount_figures:
              (ip.monthly_amount_figures as number) ??
              (get("amount_figures") as number) ??
              (get("total_figures") as number) ??
              0,
          };
        };

        const ips = compliance?.investment_plans;
        const ip = compliance?.investment_plan;

        if (ips && ips.length > 0) {
          setPlans(ips.map(normalise));
        } else if (ip) {
          setPlans([normalise(ip)]);
        }

        if (compliance?.bank_details) {
          setBank(compliance.bank_details);
        }
      } catch (err) {
        setFetchError(
          err instanceof Error ? err.message : "Failed to load data.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#ff6900]" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center gap-3">
        <AlertCircle className="size-8 text-red-400" />
        <p className="text-sm text-zinc-500">{fetchError}</p>
      </div>
    );
  }

  return (
    <>
      {showModal && (
        <AddPlanModal
          onClose={() => setShowModal(false)}
          onSuccess={(newPlan) => setPlans((prev) => [...prev, newPlan])}
        />
      )}

      <div className="min-h-screen bg-zinc-50/50">
        {/* ── Page header ── */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Investment Overview
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Manage and track your active investment plans
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#ff6900] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition-all hover:bg-[#e55f00] hover:shadow-md hover:shadow-orange-200 active:scale-[0.97]"
          >
            <Plus className="size-4" />
            New Plan
          </button>
        </div>

        {/* ── Plan cards or empty state ── */}
        {plans.length > 0 ? (
          <div className="mb-6 flex flex-col gap-4">
            {plans.map((plan, index) => {
              const planKey = plan.plan.toLowerCase();
              const meta = PLAN_META[planKey] ?? PLAN_META.basic;
              const PlanIcon = meta.icon;
              const months = parseInt(plan.tenor) || 6;

              return (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${meta.gradient} p-6 text-white shadow-lg`}
                >
                  {/* Background decoration */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10" />
                    <div className="absolute -bottom-16 -left-8 size-40 rounded-full bg-white/5" />
                    <div className="absolute right-1/3 top-1/2 size-24 rounded-full bg-white/5" />
                  </div>

                  <div className="relative">
                    {/* Plan badge */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                          <PlanIcon className="size-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-white/90">
                          {plan.plan.replace(/_/g, " ")} Plan
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                        <BadgeCheck className="size-3.5" />
                        <span className="text-xs font-semibold">Active</span>
                      </div>
                    </div>

                    {/* Main amount */}
                    <div className="mb-6">
                      <p className="text-sm text-white/70">
                        {plan.plan === "reif"
                          ? "Total Investment"
                          : "Monthly Contribution"}
                      </p>
                      <p className="mt-1 text-4xl font-black tracking-tight">
                        {fmt(plan.monthly_amount_figures)}
                      </p>
                      <p className="mt-1 text-sm capitalize text-white/70">
                        {plan.monthly_amount_words}
                      </p>
                    </div>

                    {/* Details row */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                        <Clock className="mb-1 size-3.5 text-white/60" />
                        <p className="text-[10px] font-medium uppercase tracking-wider text-white/60">
                          Tenor
                        </p>
                        <p className="text-sm font-bold">{plan.tenor}</p>
                      </div>
                      <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                        <Calendar className="mb-1 size-3.5 text-white/60" />
                        <p className="text-[10px] font-medium uppercase tracking-wider text-white/60">
                          Pay Date
                        </p>
                        <p className="text-sm font-bold">
                          {new Date(plan.monthly_payment_date).getDate()}th
                          monthly
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm col-span-2 sm:col-span-1">
                        <TrendingUp className="mb-1 size-3.5 text-white/60" />
                        <p className="text-[10px] font-medium uppercase tracking-wider text-white/60">
                          Maturity Date
                        </p>
                        <p className="text-sm font-bold">
                          {months > 0
                            ? fmtDate(
                                new Date(
                                  new Date(plan.monthly_payment_date).setMonth(
                                    new Date(
                                      plan.monthly_payment_date,
                                    ).getMonth() + months,
                                  ),
                                )
                                  .toISOString()
                                  .split("T")[0],
                              )
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="mb-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#fff1e6]">
              <TrendingUp className="size-6 text-[#ff6900]" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              No active investment plan
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Start growing your wealth today
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-[#ff6900] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e55f00] transition-colors"
            >
              <Plus className="size-4" />
              Create Investment Plan
            </button>
          </div>
        )}

        {/* ── Bank details ── */}
        {bank && (
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900">
                  <Building2 className="size-3.5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Linked Bank Account
                </h3>
              </div>
              <button
                onClick={() => setShowEditBank(true)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            </div>

            <div className="rounded-xl bg-linear-to-br from-zinc-800 to-zinc-900 p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <CreditCard className="size-5 text-zinc-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  {bank.bank_name}
                </span>
              </div>
              <p className="font-mono text-lg font-bold tracking-widest">
                {bank.account_number}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-400">
                {bank.account_name}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
              <BadgeCheck className="size-3.5 text-emerald-500" />
              Account linked
            </div>
          </div>
        )}
      </div>

      {showEditBank && bank && (
        <EditBankModal
          current={bank}
          onClose={() => setShowEditBank(false)}
          onSuccess={(updated) => setBank(updated)}
        />
      )}
    </>
  );
}
