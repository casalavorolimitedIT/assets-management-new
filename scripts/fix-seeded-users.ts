/**
 * Creates proper GoTrue auth accounts for any USER profile that either:
 *   - has no auth.users record, or
 *   - has a broken one (raw SQL insert, wrong provider_id, etc.)
 *
 * Safe to run repeatedly — already-fixed users are skipped.
 *
 * Workflow for adding more investors:
 *   1. Add entries to seed-investors.sql and run it in Supabase SQL editor.
 *   2. Run this script — it will fix only the new ones.
 *
 * Prerequisites (one-time setup in Supabase SQL editor):
 *   Run scripts/helpers.sql to create the two required SQL functions.
 *
 * Usage:
 *   npx tsx scripts/fix-seeded-users.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qssyihfbcrrugoyinlyc.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzc3lpaGZiY3JydWdveWlubHljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQ4MDE4NywiZXhwIjoyMDk0MDU2MTg3fQ.IAJAh4AnJe3iBL7-dcSgZCi7Egr2IXvYx51e6Yqh8dc";

const PASSWORD = "Casalavoro2025!";
const AUTH_URL = `${SUPABASE_URL}/auth/v1`;

const authHeaders = {
  "Content-Type": "application/json",
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

async function createAuthUser(email: string) {
  const res = await fetch(`${AUTH_URL}/admin/users`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.msg || body.message || JSON.stringify(body));
  return body as { id: string };
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface Profile {
  id: string;
  email: string;
  title: string;
  first_name: string;
  last_name: string;
  phone: string;
  compliance: Record<string, unknown>;
}

async function main() {
  // Find USER profiles whose auth account is missing or broken
  const { data: profiles, error: fetchErr } = await db.rpc("get_profiles_without_valid_auth");

  if (fetchErr) {
    console.error("RPC error (get_profiles_without_valid_auth):", fetchErr.message);
    console.error("Run scripts/helpers.sql in the Supabase SQL editor first.");
    process.exit(1);
  }

  if (!profiles?.length) {
    console.log("All user profiles already have valid auth accounts. Nothing to do.");
    return;
  }

  console.log(`Found ${profiles.length} profile(s) needing auth. Processing…\n`);

  let fixed = 0;
  let failed = 0;

  for (const profile of profiles as Profile[]) {
    const { email, title, first_name, last_name, phone, compliance } = profile;

    // Delete the broken auth record for this email (cascades to identities + profile row)
    const { error: delErr } = await db.rpc("delete_auth_user_by_email", { p_email: email });
    if (delErr) {
      console.error(`  ✗ ${email}: delete failed — ${delErr.message}`);
      failed++;
      continue;
    }

    // Create a proper GoTrue auth user
    let newId: string;
    try {
      const user = await createAuthUser(email);
      newId = user.id;
    } catch (err: unknown) {
      console.error(`  ✗ ${email}: auth create failed — ${err instanceof Error ? err.message : err}`);
      failed++;
      continue;
    }

    // Re-insert profile linked to the new auth ID
    const { error: insertErr } = await db.from("profiles").insert({
      id: newId,
      email,
      title: title ?? "",
      first_name: first_name ?? "",
      last_name: last_name ?? "",
      phone: phone ?? "",
      isVerified: true,
      compliance,
      metamap_status: null,
      role: "USER",
      auth_synced: true,
    });

    if (insertErr) {
      console.error(`  ✗ ${email}: profile insert failed — ${insertErr.message}`);
      failed++;
    } else {
      console.log(`  ✓ ${email}`);
      fixed++;
    }
  }

  console.log(`\nDone. Fixed: ${fixed}  Failed: ${failed}`);
  if (fixed > 0) console.log(`Password for all fixed users: ${PASSWORD}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
