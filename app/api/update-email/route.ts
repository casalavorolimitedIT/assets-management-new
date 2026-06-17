import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const GATEWAY_HEADERS = {
  "x-api-gateway-secret": process.env.SUPABASE_API_GATEWAY_SECRET!,
};

// Anon client — used only to verify the caller's JWT
const anonClient = createClient(
  SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: GATEWAY_HEADERS },
  },
);

// Admin client — used for privileged operations (updateUserById, profile update)
const admin = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: GATEWAY_HEADERS },
  },
);

export async function POST(req: NextRequest) {
  try {
    const { newEmail } = await req.json();

    if (!newEmail || typeof newEmail !== "string") {
      return NextResponse.json({ error: "New email is required." }, { status: 400 });
    }

    const trimmed = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Verify the caller via the Bearer token they send
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    // Use the anon client to verify the JWT — correct pattern for server-side token verification
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    // Block if already changed
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("email, email_changed")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    if (profile.email_changed) {
      return NextResponse.json({ error: "Email has already been updated once." }, { status: 403 });
    }

    if (trimmed === profile.email?.toLowerCase()) {
      return NextResponse.json({ error: "New email must be different from your current email." }, { status: 400 });
    }

    // Update email via admin API — bypasses GoTrue's current-email validation
    const { error: updateAuthErr } = await admin.auth.admin.updateUserById(user.id, {
      email: trimmed,
      email_confirm: true,
    });
    if (updateAuthErr) {
      return NextResponse.json({ error: updateAuthErr.message }, { status: 500 });
    }

    // Update profile
    const { error: updateProfileErr } = await admin
      .from("profiles")
      .update({ email: trimmed, email_changed: true })
      .eq("id", user.id);

    if (updateProfileErr) {
      return NextResponse.json({ error: updateProfileErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
