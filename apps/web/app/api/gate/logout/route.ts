import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GATE_COOKIE } from "@/lib/gate";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(GATE_COOKIE);
  return NextResponse.json({ ok: true });
}
