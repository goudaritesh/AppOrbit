/**
 * Email Service Abstraction
 * Handles email dispatching for email verification and password reset flows.
 * Decoupled from specific email providers. Supports safe console simulation in development.
 */

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const emailFrom = process.env.EMAIL_FROM || 'no-reply@apporbit.io';
const emailProvider = process.env.EMAIL_PROVIDER || 'console';

/**
 * Sends an email verification link to a newly registered user.
 *
 * @param {object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.name - Recipient user name
 * @param {string} params.token - Raw unhashed email verification token
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
export const sendVerificationEmail = async ({ to, name, token }) => {
  const verificationUrl = `${clientUrl}/verify-email?token=${token}`;

  if (emailProvider === 'console' || process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(` [EMAIL SERVICE - SIMULATION] Email Verification`);
    console.log(` To: ${name} <${to}>`);
    console.log(` From: ${emailFrom}`);
    console.log(` Subject: Verify your AppOrbit Account`);
    console.log(` Action URL: ${verificationUrl}`);
    console.log(` Raw Token: ${token}`);
    console.log(`======================================================\n`);
    return { success: true, mode: 'console' };
  }

  // Production provider (e.g. Resend, Sendgrid, or SMTP) would be invoked here:
  console.log(`[Email] Production email provider hook triggered for ${to}`);
  return { success: true, mode: 'production' };
};

/**
 * Sends a password reset link to a user.
 *
 * @param {object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.name - Recipient user name
 * @param {string} params.token - Raw unhashed password reset token
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
export const sendPasswordResetEmail = async ({ to, name, token }) => {
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;

  if (emailProvider === 'console' || process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(` [EMAIL SERVICE - SIMULATION] Password Reset`);
    console.log(` To: ${name} <${to}>`);
    console.log(` From: ${emailFrom}`);
    console.log(` Subject: Reset your AppOrbit Password`);
    console.log(` Action URL: ${resetUrl}`);
    console.log(` Raw Token: ${token}`);
    console.log(` Token expires in 15 minutes`);
    console.log(`======================================================\n`);
    return { success: true, mode: 'console' };
  }

  // Production provider hook:
  console.log(`[Email] Production email provider hook triggered for ${to}`);
  return { success: true, mode: 'production' };
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
