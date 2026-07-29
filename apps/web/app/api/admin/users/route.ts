import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";

export async function GET() {
  try {
    const users = await dbStore.listAllUsers();
    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      users
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
