import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { VerifyOtpSchema } from "@rencanangoding/shared";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Kode OTP tidak valid" },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;
    const result = await dbStore.verifyOtp(email, code);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Verifikasi OTP berhasil",
      isExistingUser: result.isExistingUser
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memverifikasi OTP" },
      { status: 500 }
    );
  }
}
