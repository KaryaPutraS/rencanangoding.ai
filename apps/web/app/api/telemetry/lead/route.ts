import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code, source } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Email tidak valid" }, { status: 400 });
    }

    // Register user in central database
    let user = await dbStore.getUserByEmail(email);
    if (!user) {
      const { code: newCode } = await dbStore.requestOtp(email);
      const tempCode = code || newCode;
      const res = await dbStore.createPasswordAndRegister(email, tempCode, "lead_user_auto", email.split("@")[0]);
      user = res.user;
    }

    // Send real email OTP via Resend
    let sent = false;
    if (code) {
      const result = await sendOtpEmail({ toEmail: email, otpCode: code });
      sent = result.sent;
    }

    return NextResponse.json({
      success: true,
      user,
      sent,
      message: "Lead email berhasil terdaftar di central hub ksatriyo.id"
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
