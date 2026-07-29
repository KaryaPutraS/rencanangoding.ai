import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { RequestOtpSchema } from "@rencanangoding/shared";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const { code, expiresAt, isExistingUser } = await dbStore.requestOtp(email);

    // Read optional email credentials from request headers or body
    const resendApiKey = req.headers.get("x-resend-api-key") || body.resendApiKey;
    const smtpHost = req.headers.get("x-smtp-host") || body.smtpHost;
    const smtpPort = req.headers.get("x-smtp-port") || body.smtpPort;
    const smtpUser = req.headers.get("x-smtp-user") || body.smtpUser;
    const smtpPass = req.headers.get("x-smtp-pass") || body.smtpPass;
    const emailFrom = req.headers.get("x-email-from") || body.emailFrom;

    // Attempt real email dispatch via Resend or SMTP
    const emailResult = await sendOtpEmail({
      toEmail: email,
      otpCode: code,
      config: {
        resendApiKey,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        emailFrom
      }
    });

    return NextResponse.json({
      success: true,
      message: emailResult.sent
        ? `Kode OTP berhasil dikirim ke ${email}!`
        : `Kode OTP verifikasi berhasil dibuat untuk ${email}`,
      isExistingUser,
      emailSent: emailResult.sent,
      // If email dispatch was not configured, expose devOtpCode for seamless open-source usage
      devOtpCode: emailResult.sent ? undefined : code,
      expiresInMinutes: 10
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal meminta kode OTP" },
      { status: 500 }
    );
  }
}
