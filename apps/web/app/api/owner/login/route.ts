import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "missing credentials" }, { status: 400 });
  }

  const owner = await prisma.owner.findUnique({ where: { email } });
  if (!owner) {
    return NextResponse.json({ ok: false, error: "invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, owner.passwordHash);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "invalid credentials" }, { status: 401 });
  }

  const role = owner.role === "admin" ? "admin" : "owner";
  const token = await createSessionToken(owner.email, role);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);

  return NextResponse.json({ ok: true, role });
}
