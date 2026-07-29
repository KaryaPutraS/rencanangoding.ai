import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbStore } from "@rencanangoding/db";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get("rng_session")?.value;

    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ success: true, user: null });
    }

    const user = await dbStore.getUserByToken(token);
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ success: false, user: null });
  }
}
