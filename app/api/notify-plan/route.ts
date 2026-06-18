import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { buildEmailTemplate } from "@/lib/email/template";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const GATEWAY_HEADERS = {
  "x-api-gateway-secret": process.env.SUPABASE_API_GATEWAY_SECRET!,
};

const anonClient = createClient(
  SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: GATEWAY_HEADERS },
  },
);

const serviceClient = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: GATEWAY_HEADERS },
  },
);

interface PlanDetail {
  label: string;
  value: string;
}

interface NotifyPlanBody {
  planLabel: string;
  userName: string;
  skipped?: boolean;
  details?: PlanDetail[];
}

function buildDetailsTable(details: PlanDetail[]): string {
  if (!details.length) return "";
  const rows = details
    .map(
      ({ label, value }) => `
      <tr>
        <td style="padding:9px 14px;border:1px solid #e5e7eb;background-color:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;width:38%;white-space:nowrap;">
          ${label}
        </td>
        <td style="padding:9px 14px;border:1px solid #e5e7eb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#111827;">
          ${value}
        </td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:20px;border-collapse:collapse;">${rows}</table>`;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const {
    data: { user },
    error: authError,
  } = await anonClient.auth.getUser(token);
  if (authError || !user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: NotifyPlanBody;
  try {
    body = (await req.json()) as NotifyPlanBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { planLabel, userName, skipped, details = [] } = body;

  const message = skipped
    ? `${userName} has completed verification and skipped the investment plan step.`
    : `${userName} has submitted a ${planLabel} investment plan and it is pending review.`;

  const subject = skipped
    ? `Verification Completed — ${userName}`
    : `New ${planLabel} Plan Submitted — ${userName}`;

  // Service role bypasses RLS — regular users cannot read other profiles
  const { data: adminProfiles } = await serviceClient
    .from("profiles")
    .select("email, first_name")
    .eq("role", "ADMIN");

  if (!adminProfiles || adminProfiles.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("[notify-plan] SMTP not configured");
    return NextResponse.json(
      { error: "Email service not configured." },
      { status: 500 },
    );
  }

  const emailBody =
    `<p style="margin:0 0 16px;">${message}</p>` +
    buildDetailsTable(details);

  const html = buildEmailTemplate({
    title: skipped ? "Verification Completed" : "New Investment Plan Submitted",
    preheader: message,
    body: emailBody,
  });

  const host = process.env.SMTP_HOST ?? "smtp.zoho.com";
  const port = parseInt(process.env.SMTP_PORT ?? "465", 10);
  const fromAddress = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const fromName =
    process.env.SMTP_FROM_NAME ?? process.env.APP_NAME ?? "Notifications";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const results = await Promise.allSettled(
    adminProfiles.map((a: { email: string; first_name: string | null }) =>
      transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: a.first_name ? `"${a.first_name}" <${a.email}>` : a.email,
        replyTo: process.env.REPLY_TO ?? fromAddress,
        subject,
        html,
      }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  if (failed > 0) {
    console.error(`[notify-plan] ${failed} admin email(s) failed`);
  }

  return NextResponse.json({ sent, failed });
}
