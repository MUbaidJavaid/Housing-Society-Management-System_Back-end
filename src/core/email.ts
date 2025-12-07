// File: core/email.ts
import nodemailer from 'nodemailer';
import logger from './logger';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, any>;
}

export interface EmailTemplate {
  subject: string;
  html: (data: Record<string, any>) => string;
  text?: (data: Record<string, any>) => string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Initialize templates
    this.initializeTemplates();
  }

  /**
   * Initialize email templates
   */
  private initializeTemplates(): void {
    // Welcome email template
    this.templates.set('welcome', {
      subject: 'Welcome to Our Platform!',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Welcome!</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2>Hello ${data.name},</h2>
              <p>Welcome to our platform! We're excited to have you on board.</p>
              <p>Your account has been successfully created and you can now start using our services.</p>
              ${
                data.verificationLink
                  ? `
                <p>Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${data.verificationLink}"
                     style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Verify Email Address
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                  If the button doesn't work, copy and paste this link in your browser:<br>
                  <a href="${data.verificationLink}">${data.verificationLink}</a>
                </p>
              `
                  : ''
              }
              <p>If you have any questions, feel free to contact our support team.</p>
              <p>Best regards,<br>The Team</p>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #f0f0f0; color: #666; font-size: 12px;">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `Welcome ${data.name}! Thank you for joining our platform.${data.verificationLink ? ` Please verify your email: ${data.verificationLink}` : ''}`,
    });

    // Verify email template
    this.templates.set('verify-email', {
      subject: 'Verify Your Email Address',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✉️ Verify Your Email</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2>Hello ${data.name},</h2>
              <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
              <p>Click the button below to verify your email:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.verificationLink}"
                   style="background-color: #4facfe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Verify Email
                </a>
              </div>
              <p>This link will expire in 24 hours.</p>
              <p style="color: #666; font-size: 14px;">
                If the button doesn't work, copy and paste this link in your browser:<br>
                <a href="${data.verificationLink}">${data.verificationLink}</a>
              </p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>Best regards,<br>The Team</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `Hello ${data.name},\n\nPlease verify your email by clicking: ${data.verificationLink}\n\nThis link expires in 24 hours.`,
    });

    // Password reset template
    this.templates.set('password-reset', {
      subject: 'Reset Your Password',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔐 Reset Password</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2>Hello ${data.name},</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetLink}"
                   style="background-color: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              <p>This link will expire in ${data.expiryHours || 1} hour(s).</p>
              <p style="color: #666; font-size: 14px;">
                If the button doesn't work, copy and paste this link in your browser:<br>
                <a href="${data.resetLink}">${data.resetLink}</a>
              </p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
              <p>Best regards,<br>The Team</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `Hello ${data.name},\n\nReset your password: ${data.resetLink}\n\nThis link expires in ${data.expiryHours || 1} hour(s).`,
    });

    // Password reset confirmation template
    this.templates.set('password-reset-confirm', {
      subject: 'Password Reset Successful',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Successful</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Password Updated</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2>Hello ${data.name},</h2>
              <p>Your password has been successfully reset.</p>
              <p>If you made this change, no further action is needed.</p>
              <p>If you didn't make this change, please contact our support team immediately.</p>
              <p>For security reasons, we recommend:</p>
              <ul>
                <li>Using a strong, unique password</li>
                <li>Enabling two-factor authentication if available</li>
                <li>Regularly updating your password</li>
              </ul>
              <p>Best regards,<br>The Team</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `Hello ${data.name},\n\nYour password has been successfully reset. If you didn't make this change, please contact support immediately.`,
    });

    // Password changed notification template
    this.templates.set('password-changed', {
      subject: 'Password Changed Successfully',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #5ee7df 0%, #b490ca 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔒 Password Changed</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2>Hello ${data.name},</h2>
              <p>Your password was successfully changed on ${new Date(data.timestamp).toLocaleString()}.</p>
              <p>If you made this change, you can safely ignore this email.</p>
              <p>If you didn't change your password:</p>
              <ul>
                <li>Reset your password immediately</li>
                <li>Contact our support team</li>
                <li>Review your account security settings</li>
              </ul>
              <p>For your security, all active sessions have been terminated.</p>
              <p>Best regards,<br>The Team</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `Hello ${data.name},\n\nYour password was changed on ${new Date(data.timestamp).toLocaleString()}. If this wasn't you, please reset your password immediately.`,
    });

    // Security alert template
    this.templates.set('security-alert', {
      subject: 'Security Alert: Suspicious Activity Detected',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Security Alert</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🚨 Security Alert</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2>Important Security Notice</h2>
              <p>We detected multiple failed login attempts for your account:</p>
              <div style="background-color: #ffeaea; border-left: 4px solid #ff0844; padding: 15px; margin: 20px 0;">
                <p><strong>Account:</strong> ${data.email}</p>
                <p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
                <p><strong>IP Address:</strong> ${data.ip || 'Unknown'}</p>
              </div>
              <p>Your account has been temporarily locked for security. You can try again in 15 minutes.</p>
              <p><strong>If this was you:</strong> Ensure you're using the correct password.</p>
              <p><strong>If this wasn't you:</strong></p>
              <ul>
                <li>Reset your password immediately</li>
                <li>Enable two-factor authentication</li>
                <li>Contact support if you need assistance</li>
              </ul>
              <p>Stay safe,<br>Security Team</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `SECURITY ALERT\n\nMultiple failed login attempts detected for ${data.email} at ${new Date(data.timestamp).toLocaleString()} from IP: ${data.ip || 'Unknown'}\n\nIf this wasn't you, reset your password immediately.`,
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      let html = options.html;
      let text = options.text;
      let subject = options.subject;

      // Use template if provided
      if (options.template) {
        const template = this.templates.get(options.template);
        if (template) {
          subject = template.subject;
          html = template.html(options.data || {});
          text = template.text?.(options.data || {});
        }
      }

      // Prepare email
      const mailOptions = {
        from:
          process.env.SMTP_FROM || `"${process.env.APP_NAME || 'App'}" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: subject,
        text: text,
        html: html,
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent: ${info.messageId} to ${options.to}`);
      return true;
    } catch (error) {
      logger.error('Email sending failed:', error);
      return false;
    }
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email connection verified');
      return true;
    } catch (error) {
      logger.error('Email connection failed:', error);
      return false;
    }
  }

  /**
   * Add custom template
   */
  addTemplate(name: string, template: EmailTemplate): void {
    this.templates.set(name, template);
  }
}

// Export singleton instance and function
export const emailService = new EmailService();

/**
 * Send email function (for backward compatibility)
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  return emailService.sendEmail(options);
};

export default emailService;
