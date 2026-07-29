import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { RequestOtpSchema } from "@rencanangoding/shared";

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

    // In open-source self-hosted mode, we return devOtpCode so the user can easily verify without SMTP setup
    return NextResponse.json({
      success: true,
      message: `Kode OTP verifikasi berhasil dibuat untuk ${email}`,
      isExistingUser,
      devOtpCode: code, // Highlighted in UI for zero-config ease of use
      expiresInMinutes: 10
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal meminta kode OTP" },
      { status: 500 }
    );
  }
}
