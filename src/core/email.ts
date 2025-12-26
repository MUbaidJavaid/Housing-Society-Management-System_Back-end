import nodemailer from 'nodemailer';
import logger from './logger';

export interface EmailOptions {
  to: string;
  subject?: string;
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
    console.log('Email Service Initializing...');
    console.log('SMTP Host:', process.env.SMTP_HOST);
    console.log('SMTP User:', process.env.SMTP_USER ? 'Set' : 'Not Set'); // Create transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      // secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
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
      subject: 'Welcome to HSMS!',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
              .content { padding: 30px; background-color: #f9f9f9; }
              .button { background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
              .footer { padding: 20px; text-align: center; background-color: #f0f0f0; color: #666; font-size: 12px; }
              .otp { font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 10px; text-align: center; margin: 20px 0; }
              .alert { background-color: #ffeaea; border-left: 4px solid #ff0844; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="color: white; margin: 0;">🎉 Welcome to HSMS!</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.name},</h2>
              <p>Welcome to the Housing Society Management System! We're excited to have you on board.</p>

              ${
                data.verificationLink
                  ? `
                <p>Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${data.verificationLink}" class="button">
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

              ${
                data.otp
                  ? `
                <p>Please use the following OTP to verify your email address:</p>
                <div class="otp">${data.otp}</div>
                <p>This OTP will expire in 10 minutes.</p>
              `
                  : ''
              }

              <p>Your account has been successfully created and you can now start managing your housing society efficiently.</p>
              <p>If you have any questions, feel free to contact our support team.</p>
              <p>Best regards,<br>The HSMS Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Housing Society Management System. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `Welcome ${data.name}! Thank you for joining HSMS.${data.verificationLink ? ` Please verify your email: ${data.verificationLink}` : ''}${data.otp ? ` OTP: ${data.otp}` : ''}`,
    });

    // Verify email template with OTP
    this.templates.set('verify-email-otp', {
      subject: 'Verify Your Email - HSMS',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Email</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .otp { font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 10px; text-align: center; margin: 20px 0; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello ${data.name},</p>
              <p>Thank you for registering with HSMS. Please use the following OTP to verify your email address:</p>
              <div class="otp">${data.otp}</div>
              <p>This OTP will expire in 10 minutes.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>Best regards,<br>The HSMS Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HSMS. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `Hello ${data.name},\n\nVerify your email with OTP: ${data.otp}\n\nThis OTP expires in 10 minutes.`,
    });

    // Password reset template with OTP
    this.templates.set('password-reset-otp', {
      subject: 'Password Reset Request - HSMS',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .otp { font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 10px; text-align: center; margin: 20px 0; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${data.name},</p>
              <p>We received a request to reset your password. Use the following OTP to proceed:</p>
              <div class="otp">${data.otp}</div>
              <p>This OTP will expire in 10 minutes.</p>
              <p>If you didn't request a password reset, please ignore this email.</p>
              <p>Best regards,<br>The HSMS Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HSMS. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `Hello ${data.name},\n\nReset your password with OTP: ${data.otp}\n\nThis OTP expires in 10 minutes.`,
    });

    // Password reset confirmation template
    this.templates.set('password-reset-confirm', {
      subject: 'Password Reset Successful - HSMS',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Successful</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Password Reset Successful</h1>
            </div>
            <div class="content">
              <p>Hello ${data.name},</p>
              <p>Your password has been successfully reset.</p>
              <p>If you made this change, no further action is needed.</p>
              <p>If you didn't make this change, please contact our support team immediately.</p>
              <p>For security reasons, all active sessions have been terminated.</p>
              <p>Best regards,<br>The HSMS Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HSMS. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `Hello ${data.name},\n\nYour password has been successfully reset. If you didn't make this change, please contact support immediately.`,
    });

    // Password changed notification template
    this.templates.set('password-changed', {
      subject: 'Password Changed - HSMS',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #5ee7df 0%, #b490ca 100%); padding: 30px; text-align: center; }
              .content { padding: 30px; background-color: #f9f9f9; }
              .footer { padding: 20px; text-align: center; background-color: #f0f0f0; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="color: white; margin: 0;">🔒 Password Changed</h1>
            </div>
            <div class="content">
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
              <p>Best regards,<br>The HSMS Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HSMS. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `Hello ${data.name},\n\nYour password was changed on ${new Date(data.timestamp).toLocaleString()}. If this wasn't you, please reset your password immediately.`,
    });

    // Security alert template
    this.templates.set('security-alert', {
      subject: 'Security Alert: Suspicious Activity - HSMS',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Security Alert</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); padding: 30px; text-align: center; }
              .content { padding: 30px; background-color: #f9f9f9; }
              .alert { background-color: #ffeaea; border-left: 4px solid #ff0844; padding: 15px; margin: 20px 0; }
              .footer { padding: 20px; text-align: center; background-color: #f0f0f0; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="color: white; margin: 0;">🚨 Security Alert</h1>
            </div>
            <div class="content">
              <h2>Important Security Notice</h2>
              <p>We detected multiple failed login attempts for your account:</p>
              <div class="alert">
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
              <p>Stay safe,<br>HSMS Security Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HSMS. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `SECURITY ALERT\n\nMultiple failed login attempts detected for ${data.email} at ${new Date(data.timestamp).toLocaleString()} from IP: ${data.ip || 'Unknown'}\n\nIf this wasn't you, reset your password immediately.`,
    });

    // Account verification success template
    this.templates.set('account-verified', {
      subject: 'Account Verified Successfully - HSMS',
      html: data => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Verified</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Welcome to HSMS!</h1>
            </div>
            <div class="content">
              <p>Hello ${data.name},</p>
              <p>Welcome to the Housing Society Management System! Your account has been successfully verified.</p>
              <p>You can now access all features of our platform:</p>
              <ul>
                <li>Manage housing society members</li>
                <li>Track maintenance payments</li>
                <li>Schedule meetings and events</li>
                <li>Generate reports and analytics</li>
              </ul>
              <p>If you have any questions, feel free to contact our support team.</p>
              <p>Best regards,<br>The HSMS Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HSMS. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: data =>
        `Hello ${data.name},\n\nWelcome to HSMS! Your account has been successfully verified. You can now access all features of our platform.`,
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      console.log('Sending email to:', options.to);
      console.log('Using template:', options.template);

      let html = options.html;
      let text = options.text;
      let subject = options.subject;

      // Use template if provided
      if (options.template && this.templates.has(options.template)) {
        const template = this.templates.get(options.template)!;
        subject = template.subject;
        const templateData = options.data || {};
        html = template.html(templateData);
        text = template.text?.(templateData) || html?.replace(/<[^>]*>/g, '');

        console.log('Template data:', templateData);
      }

      // Prepare email
      const mailOptions = {
        from:
          process.env.SMTP_FROM || `"${process.env.APP_NAME || 'HSMS'}" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: subject,
        text: text,
        html: html,
      };

      console.log('Mail options prepared');
      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      console.log('📧 To:', options.to);
      console.log('📝 Response:', info.response);
      logger.info(`Email sent: ${info.messageId} to ${options.to}`);
      return true;
    } catch (error: any) {
      console.error('❌ Email sending failed:', error.message);
      console.error('Full error:', error);

      if (error.code === 'EAUTH') {
        console.error('❌ Authentication failed. Check email and password.');
      } else if (error.code === 'EENVELOPE') {
        console.error('❌ Invalid recipient email address.');
      }

      logger.error('Email sending failed:', error);
      return false;
    }
  }

  /**
   * Test email connection
   */
  // email.ts میں connection test function چلا کر دیکھیں
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email connection verified');

      // Test email send
      await this.sendEmail({
        to: process.env.TEST_EMAIL || process.env.SMTP_USER || '',
        subject: 'Test Email from HSMS',
        text: 'This is a test email to verify email service is working.',
      });

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

  /**
   * Generate OTP
   */
  generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Send verification email with OTP (convenience method)
   */
  // auth.service.ts میں sendVerificationEmail function update کریں
  async sendVerificationEmail(email: string, name: string, otp: string): Promise<boolean> {
    try {
      console.log('📧 Sending verification email to:', email);
      console.log('👤 Name:', name);
      console.log('🔢 OTP:', otp);
      // Development mode میں کنسول پر OTP دکھائیں
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 OTP for ${email}: ${otp}`);
        console.log(`👤 Name: ${name}`);
        console.log(`⏰ OTP expires in 10 minutes`);
        return true;
      }
      // Development mode mein console par OTP show karo
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.log('==================================');
        console.log('DEVELOPMENT MODE - OTP VERIFICATION');
        console.log('Email:', email);
        console.log('OTP:', otp);
        console.log('==================================');


          if (process.env.SEND_EMAIL_IN_DEV === 'true') {
            console.log('Sending actual email in development mode...');
            return await this.sendEmail({
              to: email,
              template: 'verify-email-otp',
              data: { name, otp },
            });
          }
        return true; // Test ke liye true return karo
      }


      // Production میں actual email بھیجیں
      return await emailService.sendEmail({
        to: email,
        template: 'verify-email-otp',
        data: { name, otp },
      });
    } catch (error) {
      logger.error('Send verification email error:', error);

      // Development میں بھی error handle کریں
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Failed to send email, but OTP is: ${otp}`);
        return true;
      }

      return false;
    }
  }

  /**
   * Send password reset email with OTP (convenience method)
   */
  async sendPasswordResetEmail(email: string, name: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      template: 'password-reset-otp',
      data: { name, otp },
    });
  }

  /**
   * Send welcome email (convenience method)
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      template: 'account-verified',
      data: { name },
    });
  }

  /**
   * Send security alert email (convenience method)
   */
  async sendSecurityAlert(email: string, ip?: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      template: 'security-alert',
      data: {
        email,
        timestamp: new Date().toISOString(),
        ip: ip || 'Unknown',
      },
    });
  }

  async sendPasswordChangeNotification(to: string, name: string): Promise<void> {
    const subject = 'Password Changed - Society Management';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Password Changed</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello <strong>${name}</strong>,
            </p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              We're writing to confirm that your password was recently changed for your Society Management account.
            </p>

            <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;">
                <strong>🔒 Security Information:</strong>
                For your security, all active sessions have been logged out.
                You'll need to login again with your new password.
              </p>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If you did not change your password, please
              <a href="mailto:support@societymanagement.com" style="color: #667eea; text-decoration: none;">
                contact our support team
              </a>
              immediately to secure your account.
            </p>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 12px; color: #666;">
                This is an automated security notification. Please do not reply to this email.
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999;">
              © ${new Date().getFullYear()} Society Management System. All rights reserved.<br>
              This is an automated security notification.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Changed - Society Management

Hello ${name},

We're writing to confirm that your password was recently changed for your Society Management account.

🔒 Security Information:
For your security, all active sessions have been logged out.
You'll need to login again with your new password.

If you did not change your password, please contact our support team immediately to secure your account.

This is an automated security notification. Please do not reply to this email.

© ${new Date().getFullYear()} Society Management System. All rights reserved.
    `;

    await this.sendEmail({ to, subject, html, text });
  }

  /**
   * Send password reset confirmation (convenience method)
   */
  async sendPasswordResetConfirmation(to: string, name: string): Promise<void> {
    const subject = 'Password Reset Successful - Society Management';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Password Reset Successful</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello <strong>${name}</strong>,
            </p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Your password has been successfully reset for your Society Management account.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border: 2px solid #10b981;">
                <div style="font-size: 18px; color: #065f46;">
                  ✅ Password changed successfully
                </div>
              </div>
            </div>

            <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;">
                <strong>🔒 Security Information:</strong>
                For your security, all active sessions have been logged out.
                You'll need to login again with your new password.
              </p>
            </div>

            <p style="font-size: 14px; color: #666;">
              If you did not perform this action, please
              <a href="mailto:support@societymanagement.com" style="color: #667eea; text-decoration: none;">
                contact our support team
              </a>
              immediately.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999;">
              © ${new Date().getFullYear()} Society Management System. All rights reserved.<br>
              This is an automated security notification.
            </p>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Society Management" <${process.env.SMTP_FROM || 'noreply@societymanagement.com'}>`,
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset confirmation sent to ${to}`);
    } catch (error) {
      logger.error('Failed to send password reset confirmation:', error);
      // Don't throw error for confirmation email failures
    }
  }
}

/**
 * Send password change notification (convenience method)
 */
//   async sendPasswordChangeNotification(email: string, name: string): Promise<boolean> {
//     return this.sendEmail({
//       to: email,
//       template: 'password-changed',
//       data: {
//         name,
//         timestamp: new Date().toISOString(),
//       },
//     });
//   }
// }

// Export singleton instance and functions
export const emailService = new EmailService();

/**
 * Send email function (for backward compatibility)
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  return emailService.sendEmail(options);
};

export default emailService;
