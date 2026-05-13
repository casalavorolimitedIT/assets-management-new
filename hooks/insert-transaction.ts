import { createClient } from "@/lib/supabase/client";

export interface TransactionPayload {
  user_id: string;
  plan: string;
  amount: number;
  amount_words?: string;
  tenor?: string;
  mode_of_payment?: string;
  mode_of_interest?: string;
  units?: number;
}

function buildDescription(plan: string): string {
  const labels: Record<string, string> = {
    premium_plus: "Premium Plus Investment",
    premium: "Premium Monthly Plan",
    reif: "REIF Unit Purchase",
  };
  return labels[plan] ?? "Investment Plan";
}

export async function insertTransaction(payload: TransactionPayload) {
  const supabase = createClient();

  const { error } = await supabase.from("transactions").insert({
    user_id: payload.user_id,
    plan: payload.plan,
    type: "investment",
    description: buildDescription(payload.plan),
    amount: payload.amount,
    amount_words: payload.amount_words ?? null,
    tenor: payload.tenor ?? null,
    mode_of_payment: payload.mode_of_payment ?? null,
    mode_of_interest: payload.mode_of_interest ?? null,
    units: payload.units ?? null,
    status: "pending",
  });

  if (error) {
    console.error("[insertTransaction] failed:", error.message);
  }
}
