const nodemailer = require('nodemailer');

// Transport is created ONLY when SMTP_HOST is configured. When it is not,
// sendMail() runs in dry-run mode: emails are console-logged instead of sent,
// so development flows (password reset / email verification links) still work.
let transport = null;

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transport;
}

// Never throws: failures are logged and reported in the return value.
async function sendMail({ to, subject, html }) {
  if (!isSmtpConfigured()) {
    console.log('[mailer:dry-run] SMTP not configured - email not sent.');
    console.log(`[mailer:dry-run] To: ${to}`);
    console.log(`[mailer:dry-run] Subject: ${subject}`);
    console.log(`[mailer:dry-run] Body: ${String(html || '').slice(0, 300)}`);
    return { dryRun: true };
  }

  try {
    const info = await getTransport().sendMail({
      from: process.env.SMTP_FROM || 'EventNov@ <no-reply@eventnova.com>',
      to,
      subject,
      html,
    });
    return info;
  } catch (err) {
    console.error('[mailer] Failed to send email:', err.message);
    return { error: true, message: err.message };
  }
}

module.exports = { sendMail, isSmtpConfigured };
