export interface EmailTemplateOptions {
  title?: string;
  preheader?: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerExtra?: string;
}

export function buildEmailTemplate(opts: EmailTemplateOptions): string {
  const appName = process.env.APP_NAME ?? "Notifications";
  const logoUrl = process.env.LOGO_URL ?? "";
  const primaryColor = process.env.PRIMARY_COLOR ?? "#ff6900";
  const year = new Date().getFullYear();

  const {
    title = appName,
    preheader = "",
    body,
    ctaLabel,
    ctaUrl,
    footerExtra = "",
  } = opts;

  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${appName}" width="300" style="display:block;border:0;outline:none;text-decoration:none;max-height:72px;width:auto;" />`
    : `<span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${appName}</span>`;

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<tr>
          <td align="center" style="padding:32px 40px 8px;">
            <a href="${ctaUrl}"
              target="_blank"
              style="display:inline-block;background-color:${primaryColor};color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:6px;letter-spacing:0.3px;mso-padding-alt:0;text-align:center;">
              <!--[if mso]><i style="letter-spacing:36px;mso-font-width:-100%;mso-text-raise:30pt">&nbsp;</i><![endif]-->
              ${ctaLabel}
              <!--[if mso]><i style="letter-spacing:36px;mso-font-width:-100%">&nbsp;</i><![endif]-->
            </a>
          </td>
        </tr>`
      : "";

  const footerExtraBlock = footerExtra
    ? `<tr>
        <td style="padding:0 40px 8px;text-align:center;font-size:12px;color:#9ca3af;">
          ${footerExtra}
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    /* ── Reset ── */
    * { box-sizing: border-box; }
    body, #bodyTable { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table, td { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    /* ── Link colour override ── */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    .x-gmail-data-detectors, .x-gmail-data-detectors *, .aBn { border-bottom: 0 !important; cursor: default !important; }
    /* ── Responsive ── */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column, .stack-column-center { display: block !important; width: 100% !important; max-width: 100% !important; direction: ltr !important; }
      .stack-column-center { text-align: center !important; }
      .body-padding { padding: 24px 20px !important; }
      .cta-btn { padding: 14px 24px !important; }
    }
    /* ── Dark mode ── */
    @media (prefers-color-scheme: dark) {
      .dm-bg    { background-color: #1a1a1a !important; }
      .dm-card  { background-color: #242424 !important; }
      .dm-body  { color: #d1d5db !important; }
      .dm-title { color: #f9fafb !important; }
      .dm-muted { color: #6b7280 !important; }
      .dm-divider { border-color: #374151 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;" class="dm-bg">
  <!-- Preheader (hidden preview text) -->
  ${
    preheader
      ? `<div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>`
      : ""
  }

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f3f4f6;" class="dm-bg">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!-- Email shell -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width:600px;">

          <!-- ═══════════════ HEADER ═══════════════ -->
          <tr>
            <td style="background-color:${primaryColor};border-radius:10px 10px 0 0;padding:28px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">${logoBlock}</td>
                  <td style="vertical-align:middle;text-align:right;">
                    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:0.5px;text-transform:uppercase;">${appName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════════════ TITLE BAND ═══════════════ -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px 0;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;" class="dm-card">
              <h1 style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#111827;line-height:1.3;letter-spacing:-0.5px;" class="dm-title">${title}</h1>
              <div style="margin-top:16px;height:3px;width:48px;background-color:${primaryColor};border-radius:2px;"></div>
            </td>
          </tr>

          <!-- ═══════════════ BODY ═══════════════ -->
          <tr>
            <td style="background-color:#ffffff;padding:28px 40px 8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#374151;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;" class="dm-card dm-body body-padding">
              ${body}
            </td>
          </tr>

          <!-- ═══════════════ CTA ═══════════════ -->
          ${
            ctaBlock
              ? `<tr>
                  <td style="background-color:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;" class="dm-card">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      ${ctaBlock}
                      <tr><td style="height:32px;"></td></tr>
                    </table>
                  </td>
                </tr>`
              : `<tr>
                  <td style="background-color:#ffffff;height:24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;" class="dm-card"></td>
                </tr>`
          }

          <!-- ═══════════════ DIVIDER ═══════════════ -->
          <tr>
            <td style="background-color:#ffffff;padding:0 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;" class="dm-card">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" class="dm-divider" />
            </td>
          </tr>

          <!-- ═══════════════ FOOTER ═══════════════ -->
          <tr>
            <td style="background-color:#ffffff;border-radius:0 0 10px 10px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;" class="dm-card">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding:24px 40px 8px;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#6b7280;line-height:1.6;" class="dm-muted">
                    This email was sent by <strong style="color:#374151;">${appName}</strong>.<br />
                    If you did not expect this email, you can safely ignore it.
                  </td>
                </tr>
                ${footerExtraBlock}
                <tr>
                  <td style="padding:12px 40px 24px;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#9ca3af;" class="dm-muted">
                    &copy; ${year} ${appName}. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom spacing -->
          <tr><td style="height:32px;"></td></tr>

        </table>
        <!-- /Email shell -->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
