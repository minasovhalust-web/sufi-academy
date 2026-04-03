import { Injectable, Logger } from "@nestjs/common";

// Use require() so tsc does not need @types/nodemailer at compile time.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer: {
  createTransport: (opts: Record<string, unknown>) => {
    sendMail: (opts: Record<string, unknown>) => Promise<unknown>;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('nodemailer');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: ReturnType<typeof nodemailer.createTransport>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    console.log(`[EmailService] Sending verification code to ${email}, code: ${code}`);
    this.logger.log(`Sending verification code ${code} to ${email}`);
    try {
      await this.transporter.sendMail({
        from: `"Академия Суфийской Философии" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
        to: email,
        subject: 'Код подтверждения email',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#4f46e5">Подтверждение email</h2>
            <p>Ваш код подтверждения:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4f46e5;padding:16px 0">
              ${code}
            </div>
            <p style="color:#6b7280;font-size:14px">Код действителен 15 минут.</p>
          </div>
        `,
      });
      console.log(`[EmailService] Email sent successfully to ${email}`);
    } catch (err) {
      console.error(`[EmailService] FAILED to send email to ${email}:`, (err as Error).message);
      console.error(`[EmailService] SMTP config — host: ${process.env.SMTP_HOST}, port: ${process.env.SMTP_PORT}, user: ${process.env.SMTP_USER}`);
      this.logger.error(`Failed to send verification email to ${email}: ${(err as Error).message}`);
      // Don't rethrow — email failure should not block registration flow
    }
  }
}
