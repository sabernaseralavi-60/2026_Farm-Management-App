import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { GATE_COOKIE, getGateSession } from "@/lib/gate";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const SSO_RATE_LIMIT = 20;
const SSO_RATE_WINDOW_SECONDS = 10 * 60;

// POST /api/owner/sso — lets a worker-app login that's linked to an Owner
// account (FieldUser.ownerEmail, currently only Saber's) open the /owner
// dashboard without a second email/password login. Authorization here is
// the caller's existing, already-verified gate session cookie — this never
// accepts credentials of its own, so it can't be used to guess anything.
export async function POST(request: Request) {
  const rl = rateLimit(`owner-sso:${clientIp(request)}`, SSO_RATE_LIMIT, SSO_RATE_WINDOW_SECONDS);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "تلاش‌های زیاد — کمی بعد دوباره امتحان کنید." }, { status: 429 });
  }

  const cookieStore = await cookies();
  const gate = await getGateSession(cookieStore.get(GATE_COOKIE)?.value);
  if (!gate?.ownerEmail) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const owner = await prisma.owner.findUnique({ where: { email: gate.ownerEmail } });
  if (!owner) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const role = owner.role === "admin" ? "admin" : "owner";
  const token = await createSessionToken(owner.email, role);
  cookieStore.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);

  return NextResponse.json({ ok: true });
}
