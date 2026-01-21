// services/email.service.ts
export class EmailService {
  async sendPasswordResetEmail(email: string, token: string) {
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    console.log('Send email to:', email);
    console.log('Reset link:', link);

    return true; // Replace with nodemailer later
  }
}

export const emailService = new EmailService();
