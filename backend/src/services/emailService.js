const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // STARTTLS on 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  // In development without SMTP creds configured, log instead of failing the request
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[email:dev-mode] To: ${to} | Subject: ${subject}\n${html}`);
    return { simulated: true };
  }

  return getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

async function sendVerificationEmail(user, rawToken) {
  const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${rawToken}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify your Last-Mile Delivery account',
    html: `<p>Hi ${user.full_name},</p>
           <p>Please verify your email to activate your account:</p>
           <p><a href="${verifyUrl}">${verifyUrl}</a></p>
           <p>This link expires in 24 hours.</p>`,
  });
}

async function sendPasswordResetEmail(user, rawToken) {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;
  return sendEmail({
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Hi ${user.full_name},</p>
           <p>Click below to reset your password. This link expires in 1 hour.</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>If you didn't request this, you can ignore this email.</p>`,
  });
}

async function sendStatusUpdateEmail(user, order) {
  const trackingUrl = `${process.env.APP_URL || 'http://localhost:3000'}/customer/orders/${order.id}`;
  return sendEmail({
    to: user.email,
    subject: `Update on your order: ${order.status}`,
    html: `<p>Hi ${user.full_name},</p>
           <p>Your order (ID: ${order.id}) status is now: <strong>${order.status}</strong>.</p>
           <p>Track your delivery here:</p>
           <p><a href="${trackingUrl}">${trackingUrl}</a></p>`,
  });
}

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendStatusUpdateEmail };
