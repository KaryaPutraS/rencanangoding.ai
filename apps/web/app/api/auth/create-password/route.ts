import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { CreatePasswordSchema } from "@rencanangoding/shared";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreatePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Input password tidak valid" },
        { status: 400 }
      );
    }

    const { email, otpCode, password } = parsed.data;
    const { user, token } = await dbStore.createPasswordAndRegister(email, otpCode, password, body.name);

    const response = NextResponse.json({
      success: true,
      user,
      token,
      message: "Password berhasil dibuat & akun aktif!"
    });

    response.cookies.set("rng_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/"
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat password" },
      { status: 400 }
    );
  }
}
