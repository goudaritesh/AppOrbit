/**
 * Email Service Abstraction
 * Handles dispatching transactional emails for auth flows and platform lifecycle notifications.
 * Supports SMTP in real environments and falls back to console logging when email delivery is not configured.
 */

import nodemailer from 'nodemailer';

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const emailFrom = process.env.EMAIL_FROM || 'no-reply@apporbit.io';
const emailProvider = process.env.EMAIL_PROVIDER || 'console';

const isSimulated = () => emailProvider === 'console' || process.env.NODE_ENV !== 'production';

const printSimulatedEmail = ({ type, to, name, extra = {} }) => {
  console.log(`\n======================================================`);
  console.log(` [EMAIL SERVICE - SIMULATION] ${type}`);
  console.log(` To: ${name} <${to}>`);
  console.log(` From: ${emailFrom}`);
  Object.entries(extra).forEach(([k, v]) => console.log(` ${k}: ${v}`));
  console.log(`======================================================\n`);
};

const getSmtpTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

const sendWithSmtp = async ({ to, subject, text, html, name }) => {
  const transporter = getSmtpTransporter();

  if (!transporter) {
    printSimulatedEmail({
      type: subject,
      to,
      name,
      extra: {
        Subject: subject,
        'Action URL': text,
        Message: text,
      },
    });
    return { success: true, mode: 'console' };
  }

  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email] SMTP sent to ${to}: ${info.messageId}`);
    return { success: true, mode: 'smtp', messageId: info.messageId };
  } catch (error) {
    console.error('[Email] SMTP send failed:', error.message);
    printSimulatedEmail({
      type: subject,
      to,
      name,
      extra: {
        Subject: subject,
        Error: error.message,
        'Action URL': text,
      },
    });
    return { success: false, mode: 'smtp-fallback', error: error.message };
  }
};

/**
 * Sends an email verification link to a newly registered user.
 */
export const sendVerificationEmail = async ({ to, name, token }) => {
  const verificationUrl = `${clientUrl}/verify-email?token=${token}`;
  const subject = 'Verify your AppOrbit Account';

  if (emailProvider === 'smtp' || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
    return await sendWithSmtp({
      to,
      subject,
      name,
      text: verificationUrl,
      html: `<p>Hello ${name},</p><p>Click <a href="${verificationUrl}">here</a> to verify your AppOrbit account.</p>`,
    });
  }

  if (isSimulated()) {
    printSimulatedEmail({
      type: 'Email Verification',
      to,
      name,
      extra: {
        Subject: subject,
        'Action URL': verificationUrl,
        'Raw Token': token,
      },
    });
    return { success: true, mode: 'console' };
  }

  console.log(`[Email] Production email provider hook triggered for ${to}`);
  return { success: true, mode: 'production' };
};

/**
 * Sends a password reset link to a user.
 */
export const sendPasswordResetEmail = async ({ to, name, token }) => {
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;
  const subject = 'Reset your AppOrbit Password';

  if (emailProvider === 'smtp' || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
    return await sendWithSmtp({
      to,
      subject,
      name,
      text: resetUrl,
      html: `<p>Hello ${name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });
  }

  if (isSimulated()) {
    printSimulatedEmail({
      type: 'Password Reset',
      to,
      name,
      extra: {
        Subject: subject,
        'Action URL': resetUrl,
        'Raw Token': token,
        'Token expires in': '15 minutes',
      },
    });
    return { success: true, mode: 'console' };
  }

  console.log(`[Email] Production email provider hook triggered for ${to}`);
  return { success: true, mode: 'production' };
};

/**
 * Sprint 13 — Sends a waitlist confirmation email after joining the launch waitlist.
 */
export const sendWaitlistConfirmationEmail = async ({ to, name, role = 'USER', position }) => {
  const betaUrl = `${clientUrl}/beta`;
  const subject = "🎉 You're on the AppOrbit Launch Waitlist!";

  if (emailProvider === 'smtp' || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
    return await sendWithSmtp({
      to,
      subject,
      name,
      text: `${name}, you've joined the waitlist. ${betaUrl}`,
      html: `<p>Hello ${name},</p><p>You are on the AppOrbit launch waitlist as a ${role}. <a href="${betaUrl}">Open AppOrbit</a></p>`,
    });
  }

  if (isSimulated()) {
    printSimulatedEmail({
      type: 'Waitlist Confirmation',
      to,
      name,
      extra: {
        Subject: subject,
        'Role': role,
        ...(position ? { 'Waitlist Position': `#${position}` } : {}),
        'Platform URL': betaUrl,
        Message: `Hi ${name}! You've successfully joined the AppOrbit v1.0 launch waitlist as a ${role}. We'll notify you when access opens.`,
      },
    });
    return { success: true, mode: 'console' };
  }

  console.log(`[Email] Production waitlist confirmation triggered for ${to}`);
  return { success: true, mode: 'production' };
};

/**
 * Sprint 13 — Sends a welcome email to a newly onboarded developer.
 */
export const sendDeveloperWelcomeEmail = async ({ to, name, referralCode }) => {
  const dashboardUrl = `${clientUrl}/developer`;
  const createAppUrl = `${clientUrl}/developer/apps/create`;
  const subject = '🚀 Welcome to AppOrbit Developer Console!';

  if (emailProvider === 'smtp' || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
    return await sendWithSmtp({
      to,
      subject,
      name,
      text: `${name}, welcome to AppOrbit.`,
      html: `<p>Hello ${name},</p><p>Your AppOrbit developer account is ready. <a href="${dashboardUrl}">Open dashboard</a> and <a href="${createAppUrl}">create your first app</a>.</p>`,
    });
  }

  if (isSimulated()) {
    printSimulatedEmail({
      type: 'Developer Welcome',
      to,
      name,
      extra: {
        Subject: subject,
        'Dashboard URL': dashboardUrl,
        'Create First App': createAppUrl,
        ...(referralCode ? { 'Your Referral Code': referralCode } : {}),
        Message: `Hi ${name}! Your AppOrbit developer account is ready. Start by creating your first app and publishing it to the community.`,
      },
    });
    return { success: true, mode: 'console' };
  }

  console.log(`[Email] Production developer welcome triggered for ${to}`);
  return { success: true, mode: 'production' };
};

/**
 * Sprint 13 — Sends an approval notification when an app is approved and published.
 */
export const sendAppApprovalEmail = async ({ to, developerName, appName, appSlug, adminNote }) => {
  const appUrl = `${clientUrl}/apps/${appSlug}`;
  const subject = `✅ Your app "${appName}" is now live on AppOrbit!`;

  if (emailProvider === 'smtp' || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
    return await sendWithSmtp({
      to,
      subject,
      name: developerName,
      text: `Your app ${appName} is live: ${appUrl}`,
      html: `<p>Hello ${developerName},</p><p>"${appName}" has been approved and is now live. <a href="${appUrl}">Open app</a>.</p>`,
    });
  }

  if (isSimulated()) {
    printSimulatedEmail({
      type: 'App Approved',
      to,
      name: developerName,
      extra: {
        Subject: subject,
        'App URL': appUrl,
        ...(adminNote ? { 'Admin Note': adminNote } : {}),
        Message: `Congratulations, ${developerName}! "${appName}" has been approved and is now publicly available in the AppOrbit marketplace.`,
      },
    });
    return { success: true, mode: 'console' };
  }

  console.log(`[Email] Production app approval triggered for ${to}`);
  return { success: true, mode: 'production' };
};

/**
 * Sprint 13 — Sends a rejection notification when an app submission is rejected.
 */
export const sendAppRejectionEmail = async ({ to, developerName, appName, reason, adminNote }) => {
  const appsUrl = `${clientUrl}/developer/apps`;
  const subject = `❌ Your app "${appName}" was not approved`;

  if (emailProvider === 'smtp' || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
    return await sendWithSmtp({
      to,
      subject,
      name: developerName,
      text: `Your app ${appName} was not approved: ${reason || 'No reason provided'}`,
      html: `<p>Hello ${developerName},</p><p>"${appName}" was not approved. <a href="${appsUrl}">Review and resubmit</a>.</p>`,
    });
  }

  if (isSimulated()) {
    printSimulatedEmail({
      type: 'App Rejected',
      to,
      name: developerName,
      extra: {
        Subject: subject,
        'Rejection Reason': reason || 'Does not meet AppOrbit quality standards',
        ...(adminNote ? { 'Admin Note': adminNote } : {}),
        'Fix & Resubmit URL': appsUrl,
        Message: `Hi ${developerName}, "${appName}" was not approved for the following reason: ${reason}. Please review and resubmit once addressed.`,
      },
    });
    return { success: true, mode: 'console' };
  }

  console.log(`[Email] Production app rejection triggered for ${to}`);
  return { success: true, mode: 'production' };
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWaitlistConfirmationEmail,
  sendDeveloperWelcomeEmail,
  sendAppApprovalEmail,
  sendAppRejectionEmail,
};
