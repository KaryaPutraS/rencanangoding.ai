import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { LoginPasswordSchema } from "@rencanangoding/shared";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = LoginPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Input login tidak valid" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const { user, token } = await dbStore.loginWithPassword(email, password);

    const response = NextResponse.json({
      success: true,
      user,
      token,
      message: "Login berhasil"
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
      { success: false, error: err.message || "Gagal login" },
      { status: 400 }
    );
  }
}
