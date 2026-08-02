import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";

/**
 * Creates a local account from an email and a password.
 *
 * No one-time code: a self-hosted install runs on the owner's own machine, and requiring
 * a working SMTP server just to reach your own app was the single biggest thing standing
 * between someone and a working install. A password is still required — the built-in
 * tunnel can expose this app to the internet.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim();
    const password = String(body?.password || "");
    const name = body?.name ? String(body.name) : undefined;

    const { user, token } = await dbStore.registerWithPassword(email, password, name);

    const response = NextResponse.json({
      success: true,
      user,
      token,
      message: "Akun berhasil dibuat"
    });

    response.cookies.set("rng_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/"
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat akun" },
      { status: 400 }
    );
  }
}
