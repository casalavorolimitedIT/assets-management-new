import { useState } from "react";
import { InvestmentPlan, PLAN_META } from "./InvestmentDetails";
import { createClient } from "@/lib/supabase/client";
import { insertTransaction } from "@/hooks/insert-transaction";
import {
  AlertCircle,
  BadgeCheck,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import BankDetailsDisplay from "../BankDetailsDisplay";

type ModalPlan = "premium_plus" | "premium" | "reif";
const TENORS = [
  "3 Months",
  "6 Months",
  "12 Months",
  "18 Months",
  "24 Months",
  "36 Months",
] as const;
const PAYMENT_MODES = ["Bank Transfer", "Cheque", "Cash"] as const;
const INTEREST_MODES = ["Upfront", "Monthly", "End of Tenor"] as const;

const MODAL_PLANS: { value: ModalPlan; label: string; description: string }[] =
  [
    {
      value: "premium_plus",
      label: "Premium Plus",
      description: "Fixed lump-sum with flexible tenor",
    },
    {
      value: "premium",
      label: "Premium",
      description: "Monthly contribution plan",
    },
    {
      value: "reif",
      label: "REIF",
      description: "Real Estate Investment Fund",
    },
  ];

interface AddPlanModalProps {
  onClose: () => void;
  onSuccess: (plan: InvestmentPlan) => void;
}

export function AddPlanModal({ onClose, onSuccess }: AddPlanModalProps) {
  const [step, setStep] = useState(1); // 1 = select plan, 2 = fill details, 3 = confirm transfer
  const [selectedPlan, setSelectedPlan] = useState<ModalPlan>("premium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlanData, setPendingPlanData] = useState<InvestmentPlan | null>(null);

  // Premium Plus fields
  const [ppAmountFigures, setPpAmountFigures] = useState("");
  const [ppAmountWords, setPpAmountWords] = useState("");
  const [ppTenor, setPpTenor] = useState("");
  const [ppModeOfPayment, setPpModeOfPayment] = useState("");
  const [ppModeOfInterest, setPpModeOfInterest] = useState("");

  // Premium fields
  const [prMonthlyAmountFigures, setPrMonthlyAmountFigures] = useState("");
  const [prMonthlyAmountWords, setPrMonthlyAmountWords] = useState("");
  const [prTenor, setPrTenor] = useState("");
  const [prMonthlyPaymentDate, setPrMonthlyPaymentDate] = useState("");

  // REIF fields
  const [reifUnits, setReifUnits] = useState("");
  const [reifTotalFigures, setReifTotalFigures] = useState("");
  const [reifTotalWords, setReifTotalWords] = useState("");
  const [reifModeOfPayment, setReifModeOfPayment] = useState("");
  const [reifModeOfInterest, setReifModeOfInterest] = useState("");

  const buildInvestmentPlan = (): InvestmentPlan | null => {
    if (selectedPlan === "premium_plus") {
      if (!ppAmountFigures || !ppTenor) return null;
      return {
        plan: "premium_plus",
        tenor: ppTenor,
        monthly_amount_words: ppAmountWords,
        monthly_payment_date: new Date().toISOString().split("T")[0],
        monthly_amount_figures: Number(ppAmountFigures),
      };
    }
    if (selectedPlan === "premium") {
      if (!prMonthlyAmountFigures || !prTenor || !prMonthlyPaymentDate)
        return null;
      return {
        plan: "premium",
        tenor: prTenor,
        monthly_amount_words: prMonthlyAmountWords,
        monthly_payment_date: prMonthlyPaymentDate,
        monthly_amount_figures: Number(prMonthlyAmountFigures),
      };
    }
    if (selectedPlan === "reif") {
      if (!reifTotalFigures || !reifModeOfPayment) return null;
      return {
        plan: "reif",
        tenor: "N/A",
        monthly_amount_words: reifTotalWords,
        monthly_payment_date: new Date().toISOString().split("T")[0],
        monthly_amount_figures: Number(reifTotalFigures),
      };
    }
    return null;
  };

  // Step 2 → Step 3: validate fields then show transfer confirmation
  const handleProceedToConfirm = () => {
    setError(null);
    const planData = buildInvestmentPlan();
    if (!planData) {
      setError("Please fill in all required fields.");
      return;
    }

    const amount = planData.monthly_amount_figures;
    if (selectedPlan === "premium_plus" && amount < 100000) {
      setError("Premium Plus minimum amount is ₦100,000.");
      return;
    }
    if (selectedPlan === "premium" && amount < 100000) {
      setError("Premium minimum amount is ₦100,000.");
      return;
    }
    if (selectedPlan === "reif" && amount < 500000) {
      setError("REIF minimum amount is ₦500,000.");
      return;
    }

    setPendingPlanData(planData);
    setStep(3);
  };

  // Step 3 → Save: user confirms they have made the transfer
  const handleConfirmTransfer = async () => {
    setError(null);
    if (!pendingPlanData) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const investmentPlanPayload: Record<string, unknown> = {
        plan: selectedPlan,
        ...(selectedPlan === "premium_plus" && {
          investment_type: selectedPlan,
          amount_figures: Number(ppAmountFigures),
          amount_words: ppAmountWords,
          tenor: ppTenor,
          mode_of_payment: ppModeOfPayment,
          mode_of_interest: ppModeOfInterest,
          monthly_amount_figures: Number(ppAmountFigures),
          monthly_amount_words: ppAmountWords,
          monthly_payment_date: new Date().toISOString().split("T")[0],
        }),
        ...(selectedPlan === "premium" && {
          monthly_amount_figures: Number(prMonthlyAmountFigures),
          monthly_amount_words: prMonthlyAmountWords,
          tenor: prTenor,
          monthly_payment_date: prMonthlyPaymentDate,
        }),
        ...(selectedPlan === "reif" && {
          units: Number(reifUnits),
          total_figures: Number(reifTotalFigures),
          total_words: reifTotalWords,
          mode_of_payment: reifModeOfPayment,
          mode_of_interest: reifModeOfInterest,
          monthly_amount_figures: Number(reifTotalFigures),
          monthly_amount_words: reifTotalWords,
          tenor: "N/A",
          monthly_payment_date: new Date().toISOString().split("T")[0],
        }),
      };

      // 1. Fetch current compliance
      const { data: profile, error: fetchErr } = await supabase
        .from("profiles")
        .select("compliance")
        .eq("id", user.id)
        .single();

      if (fetchErr) throw new Error(fetchErr.message);

      const existingPlans: Record<string, unknown>[] = Array.isArray(
        profile?.compliance?.investment_plans,
      )
        ? (profile.compliance.investment_plans as Record<string, unknown>[])
        : profile?.compliance?.investment_plan
          ? [profile.compliance.investment_plan as Record<string, unknown>]
          : [];

      const updatedCompliance = {
        ...(profile?.compliance ?? {}),
        investment_plans: [...existingPlans, investmentPlanPayload],
        investment_plan: investmentPlanPayload,
      };

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          compliance: updatedCompliance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateErr) throw new Error(updateErr.message);

      await insertTransaction({
        user_id: user.id,
        plan: selectedPlan,
        amount:
          selectedPlan === "premium_plus"
            ? Number(ppAmountFigures)
            : selectedPlan === "premium"
              ? Number(prMonthlyAmountFigures)
              : Number(reifTotalFigures),
        amount_words:
          selectedPlan === "premium_plus"
            ? ppAmountWords
            : selectedPlan === "premium"
              ? prMonthlyAmountWords
              : reifTotalWords,
        tenor:
          selectedPlan === "premium_plus"
            ? ppTenor
            : selectedPlan === "premium"
              ? prTenor
              : "N/A",
        mode_of_payment:
          selectedPlan === "premium_plus"
            ? ppModeOfPayment
            : selectedPlan === "reif"
              ? reifModeOfPayment
              : undefined,
        mode_of_interest:
          selectedPlan === "premium_plus"
            ? ppModeOfInterest
            : selectedPlan === "reif"
              ? reifModeOfInterest
              : undefined,
        units: selectedPlan === "reif" ? Number(reifUnits) : undefined,
      });

      onSuccess(pendingPlanData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan.");
    } finally {
      setLoading(false);
    }
  };

  const meta = PLAN_META[selectedPlan];
  const PlanIcon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 h-screen flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#ff6900]">
                New Investment
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900">
              {step === 3 ? "Complete Your Transfer" : "Configure Your Plan"}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Step {step} of 3 —{" "}
              {step === 1
                ? "Select plan type"
                : step === 2
                  ? "Fill in details"
                  : "Make your transfer"}
            </p>
          </div>

          {/* Progress */}
          <div className="flex gap-1 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  s <= step ? "bg-[#ff6900]" : "bg-zinc-100"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Step 1: Plan selector ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {MODAL_PLANS.map((p) => {
                  const m = PLAN_META[p.value];
                  const Icon = m.icon;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setSelectedPlan(p.value)}
                      className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                        selectedPlan === p.value
                          ? "border-[#ff6900] bg-[#fff8f3]"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${m.gradient}`}
                      >
                        <Icon className="size-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-800">
                          {p.label}
                        </p>
                        <p className="text-xs text-zinc-500">{p.description}</p>
                      </div>
                      {selectedPlan === p.value && (
                        <BadgeCheck className="ml-auto size-5 text-[#ff6900]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-[#ff6900] py-3 text-sm font-semibold text-white transition-all hover:bg-[#e55f00] active:scale-[0.98]"
              >
                Continue
                <ChevronRight className="inline size-4 ml-1" />
              </button>
            </div>
          )}

          {/* ── Step 2: Plan details ── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Plan badge */}
              <div
                className={`flex items-center gap-2 rounded-xl bg-linear-to-r ${meta.gradient} p-3`}
              >
                <PlanIcon className="size-4 text-white" />
                <span className="text-sm font-bold text-white capitalize">
                  {MODAL_PLANS.find((p) => p.value === selectedPlan)?.label}
                </span>
              </div>

              {/* Premium Plus */}
              {selectedPlan === "premium_plus" && (
                <div className="space-y-3">
                  <Field
                    label="Amount (₦)"
                    value={ppAmountFigures}
                    onChange={setPpAmountFigures}
                    type="number"
                    placeholder="e.g. 500000"
                  />
                  <Field
                    label="Amount in Words"
                    value={ppAmountWords}
                    onChange={setPpAmountWords}
                    placeholder="e.g. Five Hundred Thousand Naira"
                  />
                  <SelectField
                    label="Tenor"
                    value={ppTenor}
                    onChange={setPpTenor}
                    options={[...TENORS]}
                  />
                  <SelectField
                    label="Mode of Payment"
                    value={ppModeOfPayment}
                    onChange={setPpModeOfPayment}
                    options={[...PAYMENT_MODES]}
                  />
                  <SelectField
                    label="Mode of Interest Repayment"
                    value={ppModeOfInterest}
                    onChange={setPpModeOfInterest}
                    options={[...INTEREST_MODES]}
                  />
                </div>
              )}

              {/* Premium */}
              {selectedPlan === "premium" && (
                <div className="space-y-3">
                  <Field
                    label="Monthly Amount (₦)"
                    value={prMonthlyAmountFigures}
                    onChange={setPrMonthlyAmountFigures}
                    type="number"
                    placeholder="e.g. 50000"
                  />
                  <Field
                    label="Amount in Words"
                    value={prMonthlyAmountWords}
                    onChange={setPrMonthlyAmountWords}
                    placeholder="e.g. Fifty Thousand Naira"
                  />
                  <SelectField
                    label="Tenor"
                    value={prTenor}
                    onChange={setPrTenor}
                    options={[...TENORS]}
                  />
                  <Field
                    label="Monthly Payment Date"
                    value={prMonthlyPaymentDate}
                    onChange={setPrMonthlyPaymentDate}
                    type="date"
                  />
                </div>
              )}

              {/* REIF */}
              {selectedPlan === "reif" && (
                <div className="space-y-3">
                  <Field
                    label="Number of Units"
                    value={reifUnits}
                    onChange={setReifUnits}
                    type="number"
                    placeholder="e.g. 10"
                  />
                  <Field
                    label="Total Investment (₦)"
                    value={reifTotalFigures}
                    onChange={setReifTotalFigures}
                    type="number"
                    placeholder="e.g. 1000000"
                  />
                  <Field
                    label="Total in Words"
                    value={reifTotalWords}
                    onChange={setReifTotalWords}
                    placeholder="e.g. One Million Naira"
                  />
                  <SelectField
                    label="Mode of Payment"
                    value={reifModeOfPayment}
                    onChange={setReifModeOfPayment}
                    options={[...PAYMENT_MODES]}
                  />
                  <SelectField
                    label="Tenor"
                    value={prTenor}
                    onChange={setPrTenor}
                    options={[...TENORS]}
                  />
                  <SelectField
                    label="Mode of Interest Repayment"
                    value={reifModeOfInterest}
                    onChange={setReifModeOfInterest}
                    options={[...INTEREST_MODES]}
                  />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="flex-1 rounded-xl border-2 border-zinc-200 py-3 text-sm font-semibold text-zinc-600 hover:border-zinc-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleProceedToConfirm}
                  className="flex-1 rounded-xl bg-[#ff6900] py-3 text-sm font-semibold text-white transition-all hover:bg-[#e55f00] active:scale-[0.98]"
                >
                  Activate Plan
                  <ChevronRight className="inline size-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Transfer confirmation ── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Instruction banner */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-amber-500" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  Your plan details have been recorded. Please make a transfer
                  to the account below, then confirm once done.
                </p>
              </div>

              {/* Company bank details */}
              <BankDetailsDisplay />

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 rounded-xl border-2 border-zinc-200 py-3 text-sm font-semibold text-zinc-600 hover:border-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmTransfer}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[#ff6900] py-3 text-sm font-semibold text-white transition-all hover:bg-[#e55f00] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    "I have made the transfer"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:border-[#ff6900] focus:outline-none transition-colors"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-800 focus:border-[#ff6900] focus:outline-none transition-colors bg-white"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
