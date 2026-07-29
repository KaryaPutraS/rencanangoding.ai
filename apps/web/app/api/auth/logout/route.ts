import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbStore } from "@rencanangoding/db";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("rng_session")?.value;

    if (token) {
      await dbStore.revokeSession(token);
    }

    const response = NextResponse.json({ success: true, message: "Berhasil logout" });
    response.cookies.delete("rng_session");
    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
