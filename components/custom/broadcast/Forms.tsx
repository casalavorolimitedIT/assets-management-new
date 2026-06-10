import { NotifType, User } from "@/app/dashboard/broadcast/page";
import { NOTIF_TYPES, type Compliance, type InvestmentPlan } from "@/types";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
  Send,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type TxType = "payout" | "debit";

interface Transaction {
  id: string;
  plan: string;
  type: string;
  description: string;
  amount: string;
  amount_words: string;
  tenor: string | null;
  status: string;
  created_at: string;
}

interface DebitTransaction extends Transaction {
  monthly_amount_figures: number;
  monthly_amount_words?: string;
}

type MutableInvestmentPlan = Partial<InvestmentPlan> & {
  amount_figures?: number | string;
  monthly_amount_figures?: number | string;
  total_figures?: number | string;
};

type MutableCompliance = Partial<Compliance> & {
  investment_plan?: MutableInvestmentPlan;
  investment_plans?: MutableInvestmentPlan[];
};

const inputCls =
  "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

// ─── Shared email helper ──────────────────────────────────────────────────────

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

const PLAN_LABELS: Record<string, string> = {
  premium_plus: "Premium Plus",
  premium: "Premium",
  reif: "REIF",
};

function planLabel(plan: string) {
  return PLAN_LABELS[plan] ?? plan;
}

function summaryTable(rows: [string, string][]): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
  style="border:1px solid #e5e7eb;border-radius:8px;border-collapse:separate;margin:20px 0;background:#f9fafb;">
  <tr>
    <td colspan="2" style="padding:12px 20px 8px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.8px;text-transform:uppercase;">
      Transaction Details
    </td>
  </tr>
  ${rows
    .map(
      ([label, value], i, arr) => `
  <tr>
    <td style="padding:10px 20px${i === arr.length - 1 ? " 14px" : ""};width:150px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">${label}</td>
    <td style="padding:10px 20px${i === arr.length - 1 ? " 14px" : ""};font-size:13px;font-weight:600;color:#111827;border-top:1px solid #e5e7eb;">${value}</td>
  </tr>`,
    )
    .join("")}
</table>`;
}

async function sendTransactionEmail(opts: {
  user: User;
  subject: string;
  title: string;
  preheader: string;
  bodyHtml: string;
}): Promise<void> {
  const { user, subject, title, preheader, bodyHtml } = opts;
  const response = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject,
      title,
      preheader,
      body: bodyHtml,
      ctaLabel: "View Dashboard",
      ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard`,
      recipients: [
        {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`.trim(),
        },
      ],
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    console.error(
      `[sendTransactionEmail] failed for ${user.email}:`,
      err?.message ?? response.status,
    );
  }
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

function getInvestmentPlans(compliance: unknown): InvestmentPlan[] {
  const parsed = parseCompliance(compliance);
  if (Array.isArray(parsed?.investment_plans)) return parsed.investment_plans;
  return parsed?.investment_plan ? [parsed.investment_plan] : [];
}

function getMonthlyPlanAmount(plan?: Partial<InvestmentPlan> | null) {
  return Number(plan?.monthly_amount_figures ?? 0) || 0;
}

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function RecipientsPreview({ users }: { users: User[] }) {
  if (users.length === 0) return null;
  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <p className="text-xs text-slate-500 font-medium mb-2">
        Sending to {users.length} recipient{users.length !== 1 ? "s" : ""}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {users.slice(0, 5).map((u) => (
          <span
            key={u.id}
            className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 truncate max-w-50"
          >
            {u.email}
          </span>
        ))}
        {users.length > 5 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-400">
            +{users.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}

// ── Payout Form ───────────────────────────────────────────────────────────────
function PayoutForm({
  selectedUsers,
  onSuccess,
  onError,
}: {
  selectedUsers: User[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [amountWords, setAmountWords] = useState("");
  const [plan, setPlan] = useState("");
  const [sending, setSending] = useState(false);

  const amountNum = parseFloat(amount.replace(/,/g, "")) || 0;
  const isValid =
    description.trim() !== "" &&
    amountNum > 0 &&
    amountWords.trim() !== "" &&
    selectedUsers.length > 0;

  const handleSend = async () => {
    if (!isValid) return;
    setSending(true);
    try {
      const now = new Date().toISOString();

      for (const user of selectedUsers) {
        const { error: txError } = await supabase.from("transactions").insert({
          user_id: user.id,
          plan: plan.trim() || null,
          type: "payout",
          description: description.trim(),
          amount: amountNum.toFixed(2),
          amount_words: amountWords.trim(),
          status: "active",
          created_at: now,
          updated_at: now,
        });
        if (txError) throw new Error(`Transaction failed: ${txError.message}`);

        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: user.id,
            title: "Payout Processed",
            message: `A payout of ${amountWords.trim()} (₦${amountNum.toLocaleString()}) has been processed on your account. ${description.trim()}`,
            type: "success",
            read: false,
            forAdmin: false,
            created_at: now,
          });
        if (notifError)
          throw new Error(`Notification failed: ${notifError.message}`);

        // Fire email — non-blocking, failures are logged but don't abort the payout
        const planStr = plan.trim();
        void sendTransactionEmail({
          user,
          subject: "Payout Processed on Your Account",
          title: "Payout Processed",
          preheader: `${amountWords.trim()} has been paid out to your account.`,
          bodyHtml: `
            <p style="margin:0 0 16px;">Hi ${user.first_name},</p>
            <p style="margin:0 0 16px;">A payout has been successfully processed on your account. Please find the details below.</p>
            ${summaryTable([
              ...(planStr ? [["Plan", planLabel(planStr)] as [string, string]] : []),
              ["Amount", fmt(amountNum)],
              ["Amount in Words", amountWords.trim()],
              ["Description", description.trim()],
              ["Date", fmtDate(now)],
              ["Status", "Processed"],
            ])}
            <p style="margin:0;color:#6b7280;font-size:14px;">If you have any questions about this payout, please contact our support team.</p>
          `,
        });
      }

      onSuccess(
        `Payout recorded for ${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""}`,
      );
      setDescription("");
      setAmount("");
      setAmountWords("");
      setPlan("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Payout failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <Field
        label="Plan / Reference"
        id="payout-plan"
        hint="Optional — e.g. premium_plus, reif"
      >
        <input
          id="payout-plan"
          type="text"
          placeholder="e.g. premium_plus"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Description" id="payout-description">
        <input
          id="payout-description"
          type="text"
          placeholder="e.g. Monthly interest payout — May 2026"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Amount (₦)" id="payout-amount">
        <input
          id="payout-amount"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field
        label="Amount in words"
        id="payout-amount-words"
        hint="As it should appear on records"
      >
        <input
          id="payout-amount-words"
          type="text"
          placeholder="e.g. Fifty Thousand Naira"
          value={amountWords}
          onChange={(e) => setAmountWords(e.target.value)}
          className={inputCls}
        />
      </Field>

      {amountNum > 0 && description && (
        <div className="flex gap-3 p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900">
          <ArrowUpCircle
            className="w-4 h-4 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-50 mb-1">
              Notification Preview
            </p>
            <p className="font-semibold text-sm">Payout Processed</p>
            <p className="text-xs opacity-75 mt-0.5">
              A payout of {amountWords || "—"} (₦{amountNum.toLocaleString()})
              has been processed. {description}
            </p>
          </div>
        </div>
      )}

      <RecipientsPreview users={selectedUsers} />

      <button
        onClick={handleSend}
        disabled={!isValid || sending}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-white
          bg-emerald-700 hover:bg-emerald-800 rounded-lg text-sm font-semibold
          disabled:opacity-40 disabled:cursor-not-allowed transition
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-700"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowUpCircle className="w-4 h-4" aria-hidden="true" />
        )}
        {sending
          ? "Processing…"
          : `Record Payout for ${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

// ── Debit Form ────────────────────────────────────────────────────────────────

function DebitForm({
  selectedUsers,
  onSuccess,
  onError,
}: {
  selectedUsers: User[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [transactions, setTransactions] = useState<DebitTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [selectedTx, setSelectedTx] = useState<DebitTransaction | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [amountWords, setAmountWords] = useState("");
  const [sending, setSending] = useState(false);
  const [showConfirmDebit, setShowConfirmDebit] = useState(false);

  const user = selectedUsers[0];
  const amountNum = parseFloat(amount.replace(/,/g, "")) || 0;
  const selectedBalance = selectedTx?.monthly_amount_figures ?? 0;
  const isValid =
    selectedTx !== null &&
    description.trim() !== "" &&
    amountNum > 0 &&
    amountNum <= selectedBalance &&
    amountWords.trim() !== "";

  useEffect(() => {
    if (!user) return;
    setSelectedTx(null);
    setTransactions([]);
    setLoadingTx(true);

    Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, plan, type, description, amount, amount_words, tenor, status, created_at",
        )
        .eq("user_id", user.id)
        .eq("type", "investment")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("compliance").eq("id", user.id).single(),
    ])
      .then(([{ data: txData, error: txError }, { data: profileData }]) => {
        if (!txError && txData) {
          const plansByName = new Map(
            getInvestmentPlans(profileData?.compliance).map((plan) => [
              plan.plan,
              plan,
            ]),
          );
          const rows = (txData as Transaction[]).map((tx) => {
            const plan = plansByName.get(tx.plan);
            const monthlyAmount = getMonthlyPlanAmount(plan);

            return {
              ...tx,
              monthly_amount_figures: monthlyAmount,
              monthly_amount_words: plan?.monthly_amount_words,
            };
          });

          setTransactions(rows);
        }
        setLoadingTx(false);
      })
      .catch(() => {
        setLoadingTx(false);
      });
  }, [user]);

  const handleSend = async () => {
    if (!isValid || !user || !selectedTx) return;
    setSending(true);

    try {
      const now = new Date().toISOString();

      const { data: profile, error: fetchErr } = await supabase
        .from("profiles")
        .select("compliance")
        .eq("id", user.id)
        .single();

      if (fetchErr)
        throw new Error(`Profile fetch failed: ${fetchErr.message}`);

      const compliance = structuredClone(profile?.compliance ?? {}) as any;

      if (Array.isArray(compliance.investment_plans)) {
        compliance.investment_plans = compliance.investment_plans
          .map((p: any) => {
            if (p.plan !== selectedTx.plan) return p;
            if (p.monthly_amount_figures !== undefined) {
              const current = parseFloat(String(p.monthly_amount_figures)) || 0;
              const remaining = Math.max(0, current - amountNum);
              if (remaining === 0) return null;
              return {
                ...p,
                monthly_amount_figures: remaining,
              };
            }
            if (p.total_figures !== undefined) {
              const current = parseFloat(String(p.total_figures)) || 0;
              const remaining = Math.max(0, current - amountNum);
              if (remaining === 0) return null;
              return { ...p, total_figures: remaining };
            }
            return p;
          })
          .filter((p: any): p is MutableInvestmentPlan => p !== null);
      }

      if (
        compliance.investment_plan &&
        compliance.investment_plan.plan === selectedTx.plan
      ) {
        const ip = compliance.investment_plan;
        if (ip.monthly_amount_figures !== undefined) {
          const current = parseFloat(String(ip.monthly_amount_figures)) || 0;
          const remaining = Math.max(0, current - amountNum);
          if (remaining === 0) {
            const nextPlan = compliance.investment_plans?.[0];
            if (nextPlan) {
              compliance.investment_plan = nextPlan;
            } else {
              delete compliance.investment_plan;
            }
          } else {
            compliance.investment_plan = {
              ...ip,
              monthly_amount_figures: remaining,
            };
          }
        } else if (ip.amount_figures !== undefined) {
          const current = parseFloat(String(ip.amount_figures)) || 0;
          const remaining = Math.max(0, current - amountNum);
          if (remaining === 0) {
            const nextPlan = compliance.investment_plans?.[0];
            if (nextPlan) {
              compliance.investment_plan = nextPlan;
            } else {
              delete compliance.investment_plan;
            }
          } else {
            compliance.investment_plan = {
              ...ip,
              amount_figures: remaining,
            };
          }
        }
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ compliance, updated_at: now })
        .eq("id", user.id);

      if (updateErr)
        throw new Error(`Compliance update failed: ${updateErr.message}`);

      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        plan: selectedTx.plan,
        type: "debit",
        description: description.trim(),
        amount: amountNum.toFixed(2),
        amount_words: amountWords.trim(),
        status: "active",
        created_at: now,
        updated_at: now,
      });

      if (txError)
        throw new Error(`Transaction insert failed: ${txError.message}`);

      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: user.id,
          title: "Account Debit",
          message: `An amount of ${amountWords.trim()} (₦${amountNum.toLocaleString()}) has been debited from your ${selectedTx.plan} principal. ${description.trim()}`,
          type: "warning",
          read: false,
          forAdmin: false,
          created_at: now,
        });

      if (notifError)
        throw new Error(`Notification failed: ${notifError.message}`);

      // Fire email — non-blocking, failures are logged but don't abort the debit
      void sendTransactionEmail({
        user,
        subject: "Account Debit Notice",
        title: "Account Debit",
        preheader: `${amountWords.trim()} has been debited from your ${selectedTx.plan} plan.`,
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${user.first_name},</p>
          <p style="margin:0 0 16px;">An amount has been debited from your investment account. Please review the details below.</p>
          ${summaryTable([
            ["Plan", planLabel(selectedTx.plan)],
            ["Amount Debited", fmt(amountNum)],
            ["Amount in Words", amountWords.trim()],
            ["Description", description.trim()],
            ["Remaining Balance", fmt(Math.max(0, selectedBalance - amountNum))],
            ["Date", fmtDate(now)],
          ])}
          <p style="margin:0;color:#6b7280;font-size:14px;">If you did not authorise this debit or have questions, please contact our support team immediately.</p>
        `,
      });

      onSuccess(
        `Debit of ₦${amountNum.toLocaleString()} applied to ${user.first_name} ${user.last_name}`,
      );
      setDescription("");
      setAmount("");
      setAmountWords("");
      setSelectedTx(null);
      setTransactions((current) =>
        current.map((tx) =>
          tx.id === selectedTx.id
            ? {
                ...tx,
                monthly_amount_figures: Math.max(
                  0,
                  tx.monthly_amount_figures - amountNum,
                ),
              }
            : tx,
        ),
      );
    } catch (err) {
      onError(err instanceof Error ? err.message : "Debit failed");
    } finally {
      setSending(false);
    }
  };

  const handleConfirmDebit = async () => {
    setShowConfirmDebit(false);
    await handleSend();
  };

  return (
    <div className="space-y-5">
      {/* User badge */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
          {user.first_name?.[0]}
          {user.last_name?.[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
      </div>

      {/* Transaction picker */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-slate-700">
          Select plan to debit from
        </p>

        {loadingTx ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex gap-2 items-start text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3">
            <AlertTriangle
              className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400"
              aria-hidden="true"
            />
            No active investment transactions found for this user.
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isActive = selectedTx?.id === tx.id;
              const isEmpty = tx.monthly_amount_figures <= 0;
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => {
                    if (isEmpty) return;
                    setSelectedTx(isActive ? null : tx);
                  }}
                  disabled={isEmpty}
                  className={`w-full text-left px-3.5 py-3 rounded-lg border transition
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                    ${
                      isActive
                        ? "bg-red-50 border-red-300 text-red-900"
                        : isEmpty
                          ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide truncate">
                        {tx.plan ?? "—"}
                      </p>
                      <p className="text-xs opacity-60 mt-0.5 truncate">
                        {tx.description}
                        {tx.tenor ? ` · ${tx.tenor}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {isEmpty
                          ? "Empty"
                          : `₦${tx.monthly_amount_figures.toLocaleString()}`}
                      </p>
                      <p className="text-[10px] opacity-50">
                        {tx.monthly_amount_words ?? tx.amount_words}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedTx && (
        <>
          <Field label="Description" id="debit-description">
            <input
              id="debit-description"
              type="text"
              placeholder="e.g. Principal withdrawal — investor request"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Amount to debit (₦)" id="debit-amount">
            <input
              id="debit-amount"
              type="number"
              min="0"
              max={selectedBalance}
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field
            label="Amount in words"
            id="debit-amount-words"
            hint="As it should appear on records"
          >
            <input
              id="debit-amount-words"
              type="text"
              placeholder="e.g. Fifty Thousand Naira"
              value={amountWords}
              onChange={(e) => setAmountWords(e.target.value)}
              className={inputCls}
            />
          </Field>

          {amountNum > 0 && (
            <div className="flex gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <AlertCircle
                className="w-3.5 h-3.5 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              ₦{amountNum.toLocaleString()} will be subtracted from the{" "}
              <span className="font-semibold">{selectedTx.plan}</span> plan in
              this user&apos;s compliance record.
            </div>
          )}

          {amountNum > selectedBalance && (
            <div className="flex gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertCircle
                className="w-3.5 h-3.5 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              This plan only has ₦{selectedBalance.toLocaleString()} available.
            </div>
          )}

          {amountNum > 0 && description && (
            <div className="flex gap-3 p-4 rounded-xl border bg-red-50 border-red-200 text-red-900">
              <ArrowDownCircle
                className="w-4 h-4 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest opacity-50 mb-1">
                  Notification Preview
                </p>
                <p className="font-semibold text-sm">Account Debit</p>
                <p className="text-xs opacity-75 mt-0.5">
                  An amount of {amountWords || "—"} (₦
                  {amountNum.toLocaleString()}) has been debited from your{" "}
                  {selectedTx.plan} principal. {description}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => setShowConfirmDebit(true)}
        disabled={!isValid || sending}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-white
          bg-red-700 hover:bg-red-800 rounded-lg text-sm font-semibold
          disabled:opacity-40 disabled:cursor-not-allowed transition
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-700"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowDownCircle className="w-4 h-4" aria-hidden="true" />
        )}
        {sending ? "Processing…" : "Apply Debit"}
      </button>

      {showConfirmDebit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-50 p-3 text-red-700">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900">
                  Confirm Debit
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This action will debit the selected plan and may empty it
                  completely. The change cannot be reversed once applied.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDebit(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDebit}
                disabled={sending}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Debit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Transaction Form (shell) ──────────────────────────────────────────────────

export function TransactionForm({
  selectedUsers,
  onSuccess,
  onError,
}: {
  selectedUsers: User[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [txType, setTxType] = useState<TxType>("payout");

  const isDebit = txType === "debit";
  const isMultiSelect = selectedUsers.length > 1;

  return (
    <div className="space-y-5">
      {/* Type selector */}
      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 mb-2">
          Transaction type
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={txType === "payout"}
            onClick={() => setTxType("payout")}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold border transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              ${
                txType === "payout"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
          >
            <ArrowUpCircle className="w-4 h-4" aria-hidden="true" />
            Payout
          </button>
          <button
            type="button"
            aria-pressed={txType === "debit"}
            onClick={() => setTxType("debit")}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold border transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              ${
                txType === "debit"
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
          >
            <ArrowDownCircle className="w-4 h-4" aria-hidden="true" />
            Debit
          </button>
        </div>
      </fieldset>

      {/* Debit: multi-user guard */}
      {isDebit && isMultiSelect ? (
        <div className="flex gap-2 items-start text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
          <AlertTriangle
            className="w-3.5 h-3.5 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          Debit can only be applied to one user at a time. Please select a
          single user from the table.
        </div>
      ) : isDebit && selectedUsers.length === 0 ? (
        <div className="flex gap-2 items-start text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3">
          <Info
            className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400"
            aria-hidden="true"
          />
          Select a single user from the table to load their investment plans.
        </div>
      ) : isDebit ? (
        <DebitForm
          selectedUsers={selectedUsers}
          onSuccess={onSuccess}
          onError={onError}
        />
      ) : (
        <PayoutForm
          selectedUsers={selectedUsers}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}
    </div>
  );
}

// ── Email Form ────────────────────────────────────────────────────────────────

export function EmailForm({
  selectedUsers,
  onSend,
  sending,
}: {
  selectedUsers: User[];
  onSend: (subject: string, body: string, preheader?: string) => Promise<void>;
  sending: boolean;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preheader, setPreheader] = useState("");

  return (
    <div className="space-y-5">
      <Field label="Subject" id="email-subject">
        <input
          id="email-subject"
          type="text"
          placeholder="Your subject line…"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field
        label="Preview text"
        id="email-preheader"
        hint="Short line shown in the inbox before the email is opened. Optional."
      >
        <input
          id="email-preheader"
          type="text"
          placeholder="e.g. Your investment update from Casa Lavoro…"
          value={preheader}
          onChange={(e) => setPreheader(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Message body" id="email-body">
        <textarea
          id="email-body"
          rows={7}
          placeholder="Write your message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`${inputCls} resize-none leading-relaxed`}
        />
      </Field>

      <RecipientsPreview users={selectedUsers} />

      <button
        onClick={() => onSend(subject, body, preheader || undefined)}
        disabled={
          !subject.trim() ||
          !body.trim() ||
          selectedUsers.length === 0 ||
          sending
        }
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-900 text-white
          rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed
          transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="w-4 h-4" aria-hidden="true" />
        )}
        {sending
          ? "Sending…"
          : `Send to ${selectedUsers.length} recipient${selectedUsers.length !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

// ── Notification Form ─────────────────────────────────────────────────────────

const PREVIEW_CLS: Record<NotifType, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  error: "bg-red-50 border-red-200 text-red-900",
};

function NotifTypeIcon({ type }: { type: NotifType }) {
  const cls = "w-4 h-4 flex-shrink-0 mt-0.5";
  if (type === "success")
    return <CheckCircle2 className={cls} aria-hidden="true" />;
  if (type === "error" || type === "warning")
    return <AlertCircle className={cls} aria-hidden="true" />;
  return <Info className={cls} aria-hidden="true" />;
}

export function NotificationForm({
  selectedUsers,
  onSend,
  sending,
}: {
  selectedUsers: User[];
  onSend: (
    title: string,
    message: string,
    type: string,
    link: string,
  ) => Promise<void>;
  sending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotifType>("info");
  const [link] = useState("");

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 mb-2">
          Notification type
        </legend>
        <div className="grid grid-cols-4 gap-2" role="group">
          {NOTIF_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={type === t.value}
              onClick={() => setType(t.value)}
              className={`px-2 py-2 rounded-lg text-xs font-semibold border transition
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${type === t.value ? t.active : t.idle}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <Field label="Title" id="notif-title">
        <input
          id="notif-title"
          type="text"
          placeholder="Notification title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Message" id="notif-message">
        <textarea
          id="notif-message"
          rows={4}
          placeholder="Notification message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputCls} resize-none`}
        />
      </Field>

      {(title || message) && (
        <div
          role="region"
          aria-label="Notification preview"
          className={`flex gap-3 p-4 rounded-xl border ${PREVIEW_CLS[type]}`}
        >
          <NotifTypeIcon type={type} />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-50 mb-1">
              Preview
            </p>
            {title && (
              <p className="font-semibold text-sm leading-snug">{title}</p>
            )}
            {message && <p className="text-xs opacity-75 mt-0.5">{message}</p>}
            {link && (
              <p className="text-xs opacity-40 mt-1.5 truncate">→ {link}</p>
            )}
          </div>
        </div>
      )}

      <RecipientsPreview users={selectedUsers} />

      <button
        onClick={() => onSend(title, message, type, link)}
        disabled={
          !title.trim() ||
          !message.trim() ||
          selectedUsers.length === 0 ||
          sending
        }
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-900 text-white
          rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed
          transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Bell className="w-4 h-4" aria-hidden="true" />
        )}
        {sending
          ? "Sending…"
          : `Notify ${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
