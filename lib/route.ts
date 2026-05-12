import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase admin client ────────────────────────────────────────────────────
// Uses the service-role key so we can update any profile row without RLS
// restrictions. Never expose this key to the client.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── MetaMap webhook payload shape (partial) ──────────────────────────────────
// MetaMap sends different event types. We only act on "verification_completed".
// The full schema is at https://docs.metamap.com/docs/webhooks
interface MetamapWebhookPayload {
  eventName: string; // e.g. "verification_completed", "step_completed"
  metadata?: {
    uid?: string;    // our Supabase user ID, passed when starting the flow
    email?: string;
  };
  verification?: {
    identity: string;       // MetaMap identity ID
    status: string;         // "verified" | "reviewNeeded" | "rejected"
    // MetaMap also sends "verified" at the top level in some webhook versions
  };
  // Some webhook versions surface status at the top level
  status?: string;
}

// ─── POST /api/webhooks/metamap ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── 1. Verify the request is genuinely from MetaMap ─────────────────────────
  // MetaMap signs webhooks with a secret you configure in their dashboard.
  // Set METAMAP_WEBHOOK_SECRET in your env and paste the same value in
  // MetaMap Dashboard → Webhooks → Secret.
  const secret = process.env.METAMAP_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get("x-signature") ?? "";
    // MetaMap sends a simple bearer-style shared secret in x-signature.
    // For HMAC validation, swap this check for your preferred crypto verify.
    if (signature !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── 2. Parse the payload ─────────────────────────────────────────────────────
  let payload: MetamapWebhookPayload;
  try {
    payload = (await req.json()) as MetamapWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { eventName, metadata, verification, status: topLevelStatus } = payload;

  // ── 3. Only act on completed verifications ────────────────────────────────
  if (eventName !== "verification_completed") {
    // Acknowledge other events so MetaMap doesn't retry them
    return NextResponse.json({ received: true });
  }

  // ── 4. Extract the uid we embedded as metadata when starting the flow ───────
  const uid = metadata?.uid;
  if (!uid) {
    console.error("[MetaMap webhook] Missing uid in metadata", payload);
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  // ── 5. Determine verification outcome ─────────────────────────────────────
  // MetaMap surfaces the status either under verification.status or at the
  // top level depending on the webhook version configured in your dashboard.
  const verificationStatus =
    verification?.status ?? topLevelStatus ?? "unknown";

  const isApproved = verificationStatus === "verified";

  // ── 6. Update the Supabase profile ────────────────────────────────────────
  const { error } = await supabase
    .from("profiles")
    .update({
      status: isApproved ? "approved" : "rejected",
      metamap_status: verificationStatus,   // store raw MetaMap status for auditing
      updated_at: new Date().toISOString(),
    })
    .eq("id", uid);

  if (error) {
    console.error("[MetaMap webhook] Supabase update failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(
    `[MetaMap webhook] uid=${uid} verificationStatus=${verificationStatus} → profile.status=${isApproved ? "approved" : "rejected"}`,
  );

  return NextResponse.json({ received: true });
}