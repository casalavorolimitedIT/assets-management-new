import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildEmailTemplate } from "@/lib/email/template";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Recipient {
  id?: string;
  email: string;
  name?: string;
}

interface SendEmailBody {
  subject: string;
  /** Inner HTML that gets injected into the branded email shell */
  body: string;
  recipients: Recipient[];
  /** Optional: override the email card title (defaults to subject) */
  title?: string;
  /** Optional: short preview text shown in inbox before the email is opened */
  preheader?: string;
  /** Optional: call-to-action button label */
  ctaLabel?: string;
  /** Optional: call-to-action button URL */
  ctaUrl?: string;
  /** Optional: extra line rendered above the copyright in the footer */
  footerExtra?: string;
}

// ─── Transporter factory ─────────────────────────────────────────────────────

/**
 * Creates a nodemailer transporter using Zoho SMTP credentials from env vars.
 * Port 465 → TLS (secure:true). Port 587 → STARTTLS (secure:false).
 */
function createTransporter() {
  const host = process.env.SMTP_HOST ?? "smtp.zoho.com";
  const port = parseInt(process.env.SMTP_PORT ?? "465", 10);
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ─── POST /api/send-email ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Validate required env vars ─────────────────────────────────────────
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("[send-email] SMTP_USER or SMTP_PASS is not configured.");
    return NextResponse.json(
      { message: "Email service is not configured." },
      { status: 500 },
    );
  }

  const fromAddress = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const fromName =
    process.env.SMTP_FROM_NAME ??
    process.env.SENDER_NAME ??
    process.env.APP_NAME ??
    "Notifications";
  const replyTo = process.env.REPLY_TO;

  // ── 2. Parse request body ──────────────────────────────────────────────────
  let payload: SendEmailBody;
  try {
    payload = (await req.json()) as SendEmailBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const {
    subject,
    body,
    recipients,
    title,
    preheader,
    ctaLabel,
    ctaUrl,
    footerExtra,
  } = payload;

  if (!subject || !body || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json(
      { message: "subject, body, and at least one recipient are required." },
      { status: 400 },
    );
  }

  // ── 3. Build the full HTML from the branded template ──────────────────────
  const html = buildEmailTemplate({
    title: title ?? subject,
    preheader,
    body,
    ctaLabel,
    ctaUrl,
    footerExtra,
  });

  // ── 4. Send emails ────────────────────────────────────────────────────────
  const transporter = createTransporter();

  const results = await Promise.allSettled(
    recipients.map((r) =>
      transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: r.name ? `"${r.name}" <${r.email}>` : r.email,
        replyTo: replyTo ?? fromAddress,
        subject,
        html,
      }),
    ),
  );

  const failed = results
    .map((r, i) => ({ result: r, recipient: recipients[i] }))
    .filter(({ result }) => result.status === "rejected");

  if (failed.length > 0) {
    const errors = failed.map(({ recipient, result }) => ({
      email: recipient.email,
      reason:
        result.status === "rejected"
          ? (result.reason as Error)?.message ?? "Unknown error"
          : "",
    }));
    console.error("[send-email] Some deliveries failed:", errors);

    if (failed.length === recipients.length) {
      return NextResponse.json(
        { message: "Failed to send email.", errors },
        { status: 500 },
      );
    }

    // Partial success
    return NextResponse.json({
      sent: recipients.length - failed.length,
      failed: failed.length,
      errors,
    });
  }

  return NextResponse.json({ sent: recipients.length });
}
