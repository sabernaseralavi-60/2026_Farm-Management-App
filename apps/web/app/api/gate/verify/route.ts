import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { homePathFor } from "@/lib/access";
import { createGateToken, GATE_COOKIE, GATE_COOKIE_OPTIONS } from "@/lib/gate";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Compared against when the username doesn't exist, so a wrong username and a
// wrong password cost the same bcrypt round and can't be told apart by timing.
const DUMMY_HASH = "$2b$12$IlbuiPVo8NQq0NxF3AKrgO5Ftlk2u2Ty0Z3wDU5Fl1AWk/RJ7dV46";

// A 6-character shared PIN has a small keyspace — without a limit here it's
// brute-forceable with a plain script in minutes. 8 tries / 10 minutes per
// IP is generous for a foreman fat-fingering the PIN, punishing for a script.
const GATE_RATE_LIMIT = 8;
const GATE_RATE_WINDOW_SECONDS = 10 * 60;

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Different lengths would make timingSafeEqual throw; the length check
  // itself leaks length, but PIN length is fixed/public (see .env.example),
  // so that's not the secret being protected here — the PIN value is.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const rl = rateLimit(`gate:${clientIp(request)}`, GATE_RATE_LIMIT, GATE_RATE_WINDOW_SECONDS);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "تلاش‌های زیاد — کمی بعد دوباره امتحان کنید." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: { pin?: string; username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const cookieStore = await cookies();

  // Per-person login (e.g. the tractor manager): limited to that user's modules.
  if (body.username) {
    const username = body.username.trim().toLowerCase();
    const user = await prisma.fieldUser.findUnique({ where: { username } });
    const valid = await bcrypt.compare(body.password ?? "", user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) {
      return NextResponse.json({ ok: false, error: "نام کاربری یا رمز اشتباه است" }, { status: 401 });
    }
    const token = await createGateToken({
      username: user.username,
      displayName: user.displayName,
      modules: user.modules,
      ownerEmail: user.ownerEmail,
    });
    cookieStore.set(GATE_COOKIE, token, GATE_COOKIE_OPTIONS);
    return NextResponse.json({ ok: true, home: homePathFor(user.modules) });
  }

  // Shared farm PIN: full access.
  const expected = process.env.FARM_PIN;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "FARM_PIN not configured" }, { status: 500 });
  }

  if (!body.pin || !safeEqual(body.pin, expected)) {
    return NextResponse.json({ ok: false, error: "رمز اشتباه است" }, { status: 401 });
  }

  const token = await createGateToken();
  cookieStore.set(GATE_COOKIE, token, GATE_COOKIE_OPTIONS);

  return NextResponse.json({ ok: true, home: homePathFor("all") });
}
