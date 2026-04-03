import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.transporter.sendMail({
      from: "Академия Суфийской Философии <" + process.env.SMTP_FROM + ">",
      to: email,
      subject: "Код подтверждения email",
      html: "<div style=font-family:Arial><h2>Код подтверждения: <b>" + code + "</b></h2><p>Код действителен 15 минут.</p></div>",
    });
  }
}
