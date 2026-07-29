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

    // Attempt real email dispatch via Resend or SMTP
    const emailResult = await sendOtpEmail({ toEmail: email, otpCode: code });

    return NextResponse.json({
      success: true,
      message: emailResult.sent
        ? `Kode OTP terkirim ke ${email} (via ${emailResult.provider})`
        : `Kode OTP verifikasi berhasil dibuat untuk ${email}`,
      isExistingUser,
      emailSent: emailResult.sent,
      // If email dispatch was not configured/failed, expose devOtpCode for seamless open-source usage
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
