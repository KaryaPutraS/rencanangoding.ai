import nodemailer from "nodemailer";

interface SendOtpParams {
  toEmail: string;
  otpCode: string;
}

export async function sendOtpEmail({
  toEmail,
  otpCode
}: SendOtpParams): Promise<{ sent: boolean; provider?: string; error?: string }> {
  const fromEmail =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    `"RencanaNgoding.ai" <no-reply@ksatriyo.id>`;

  // 1. Check if Resend API Key is configured in environment
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: `🔐 Kode OTP RencanaNgoding.ai: ${otpCode}`,
          html: getOtpHtmlTemplate(otpCode, toEmail)
        })
      });
      const data = await res.json();
      if (res.ok) {
        return { sent: true, provider: "resend" };
      } else {
        console.warn("Resend API error:", data);
      }
    } catch (err: any) {
      console.warn("Resend API exception:", err);
    }
  }

  // 2. Check if SMTP configuration exists (Hostinger Email / AWS SES / Custom SMTP)
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "465");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for 587
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: `🔐 Kode OTP RencanaNgoding.ai: ${otpCode}`,
        html: getOtpHtmlTemplate(otpCode, toEmail)
      });

      return { sent: true, provider: "smtp" };
    } catch (err: any) {
      console.error("SMTP send error:", err);
      return { sent: false, error: err.message };
    }
  }

  // No email credentials configured in environment -> Fallback
  return { sent: false, error: "Belum ada variabel environment SMTP / Resend" };
}

function getOtpHtmlTemplate(code: string, email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #07090E; color: #F3F4F6; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #0E131F; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .logo { text-align: center; margin-bottom: 20px; }
    .logo span { font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; }
    .logo .accent { color: #10B981; font-family: monospace; }
    .badge { display: inline-block; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #34D399; font-size: 11px; font-family: monospace; font-weight: bold; padding: 4px 12px; border-radius: 50px; text-transform: uppercase; margin-bottom: 16px; }
    h2 { font-size: 18px; font-weight: 700; color: #FFFFFF; margin-top: 0; text-align: center; }
    p { font-size: 13px; color: #9CA3AF; line-height: 1.6; text-align: center; margin-bottom: 20px; }
    .otp-box { background: #07090E; border: 1px solid #10B981; border-radius: 16px; padding: 18px; text-align: center; margin-bottom: 20px; box-shadow: 0 0 20px rgba(16,185,129,0.15); }
    .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; color: #34D399; letter-spacing: 8px; margin: 0; }
    .footer { border-top: 1px solid rgba(255,255,255,0.08); margin-top: 24px; padding-top: 16px; text-align: center; font-size: 11px; color: #6B7280; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <span class="badge">Keamanan Akun &bull; ksatriyo.id</span><br/>
      <span>RencanaNgoding<span class="accent">.ai</span></span>
    </div>
    <h2>Kode OTP Verifikasi</h2>
    <p>Gunakan kode OTP di bawah ini untuk memverifikasi keaktifan email <strong style="color:#E5E7EB;">${email}</strong> dan mengamankan dashboard kamu.</p>
    <div class="otp-box">
      <div class="otp-code">${code}</div>
    </div>
    <p style="font-size: 11px; color: #6B7280; margin-bottom: 0;">Kode OTP ini berlaku selama <strong>10 menit</strong>. Jangan berikan kode ini kepada siapapun.</p>
    <div class="footer">
      Domain Notification Service &bull; ksatriyo.id
    </div>
  </div>
</body>
</html>
  `;
}
