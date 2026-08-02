import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";

/**
 * Tells the sign-in form whether this email already has an account, so it can ask for a
 * password (sign in) or a new password (register) without a round trip through email.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Masukkan alamat email yang valid" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, registered: await dbStore.hasUserPassword(email) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
