import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createGateToken, GATE_COOKIE, GATE_COOKIE_OPTIONS } from "@/lib/gate";

export async function POST(request: Request) {
  let body: { pin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const expected = process.env.FARM_PIN;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "FARM_PIN not configured" }, { status: 500 });
  }

  if (!body.pin || body.pin !== expected) {
    return NextResponse.json({ ok: false, error: "رمز اشتباه است" }, { status: 401 });
  }

  const token = await createGateToken();
  const cookieStore = await cookies();
  cookieStore.set(GATE_COOKIE, token, GATE_COOKIE_OPTIONS);

  return NextResponse.json({ ok: true });
}
