import { Injectable } from "@nestjs/common";
import * as https from "https";

@Injectable()
export class EmailService {
  private readonly apiKey = process.env.RESEND_API_KEY;

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const body = JSON.stringify({
      from: "Академия Суфийской Философии <noreply@muzasufy.com>",
      to: [email],
      subject: "Код подтверждения email",
      html: "<div style=\"font-family:Arial;max-width:600px;margin:0 auto;\"><h2 style=\"color:#4f46e5;\">Подтверждение email</h2><p>Ваш код подтверждения:</p><h1 style=\"color:#4f46e5;font-size:48px;letter-spacing:8px;\">" + code + "</h1><p>Код действителен в течение 15 минут.</p></div>",
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: "api.resend.com",
        path: "/emails",
        method: "POST",
        headers: {
          "Authorization": "Bearer " + this.apiKey,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      }, (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          console.log("Email sent:", data);
          resolve();
        });
      });
      req.on("error", (e) => {
        console.error("Email error:", e.message);
        resolve();
      });
      req.write(body);
      req.end();
    });
  }
}
