import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, Building2, Loader2, X } from "lucide-react";
import { BankDetails } from "./InvestmentDetails";

interface EditBankModalProps {
  current: BankDetails;
  onClose: () => void;
  onSuccess: (bank: BankDetails) => void;
}

export function EditBankModal({
  current,
  onClose,
  onSuccess,
}: EditBankModalProps) {
  const [bankName, setBankName] = useState(current.bank_name);
  const [accountName, setAccountName] = useState(current.account_name);
  const [accountNumber, setAccountNumber] = useState(current.account_number);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!bankName || !accountName || !accountNumber) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile, error: fetchErr } = await supabase
        .from("profiles")
        .select("compliance")
        .eq("id", user.id)
        .single();

      if (fetchErr) throw new Error(fetchErr.message);

      const updatedCompliance = {
        ...(profile?.compliance ?? {}),
        bank_details: {
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber,
        },
      };

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          compliance: updatedCompliance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateErr) throw new Error(updateErr.message);

      onSuccess({
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-linear-to-r from-zinc-700 to-zinc-900" />
        <div className="p-6">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900">
                <Building2 className="size-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">
                  Update Bank Details
                </h2>
                <p className="text-xs text-zinc-500">
                  Changes saved immediately
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-zinc-100 transition-colors"
            >
              <X className="size-4 text-zinc-500" />
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Bank Name
              </label>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. First Bank"
                className="w-full rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Account Name
              </label>
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Account Number
              </label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 0123456789"
                maxLength={10}
                className="w-full rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none transition-colors font-mono tracking-widest"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 hover:border-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
