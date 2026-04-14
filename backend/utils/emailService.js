/**
 * Email Service
 * Handles sending verification and password reset emails
 */
const nodemailer = require('nodemailer');

// Configure email transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send email verification link
 */
const sendVerificationEmail = async (email, firstName, verificationUrl) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6769ef; color: white; padding: 20px; border-radius: 5px; }
          .content { padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px; }
          .button { background-color: #6769ef; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Welcome to Campus Mart!</h2>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Thank you for signing up! Please verify your email to activate your account.</p>
            <p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </p>
            <p style="color: #999;">This link expires in 1 hour.</p>
            <hr>
            <p>If you didn't sign up, you can ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Campus Mart. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Campus Mart Email',
    html: htmlContent,
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, firstName, resetUrl) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6769ef; color: white; padding: 20px; border-radius: 5px; }
          .content { padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px; }
          .button { background-color: #6769ef; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Reset Your Password</h2>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password. Click the link below to set a new password.</p>
            <p>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p style="color: #999;">This link expires in 1 hour.</p>
            <p>If you didn't request this, you can ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Campus Mart. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Campus Mart Password',
    html: htmlContent,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
