import { SignJWT, jwtVerify } from "jose";
import type { GateAccess } from "./access";

export const GATE_COOKIE = "farm_gate_session";
const GATE_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days — this is a shared farm PIN, not a personal login

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var is not set");
  return new TextEncoder().encode("gate:" + secret);
}

export interface GateSession {
  access: GateAccess;
  /** FieldUser username; absent for the shared farm PIN. */
  user?: string;
  /** FieldUser.displayName — used for the "X entered data" Bale
   * notification (see lib/notify.ts). Absent for the shared farm PIN. */
  displayName?: string;
  /** Set only for the field user linked to an Owner account (Saber) — lets
   * the worker layout offer a one-click jump into /owner (see
   * /api/owner/sso) without a second login. */
  ownerEmail?: string;
}

/** `user` omitted = the shared farm PIN (full access). Otherwise the token
 * is limited to `modules`, and carries `ownerEmail` when that field user is
 * linked to an Owner account. */
export async function createGateToken(user?: {
  username: string;
  displayName: string;
  modules: string[];
  ownerEmail?: string | null;
}): Promise<string> {
  const claims = user
    ? {
        gate: true,
        user: user.username,
        displayName: user.displayName,
        modules: user.modules,
        ownerEmail: user.ownerEmail ?? undefined,
      }
    : { gate: true };
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${GATE_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function getGateSession(token: string | undefined): Promise<GateSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.gate !== true) return null;
    // Tokens issued before per-person logins have no `modules` claim — they
    // came from the shared PIN, so they keep full access.
    if (!Array.isArray(payload.modules)) return { access: "all" };
    const modules = payload.modules.filter((m): m is string => typeof m === "string");
    return {
      access: modules,
      user: typeof payload.user === "string" ? payload.user : undefined,
      displayName: typeof payload.displayName === "string" ? payload.displayName : undefined,
      ownerEmail: typeof payload.ownerEmail === "string" ? payload.ownerEmail : undefined,
    };
  } catch {
    return null;
  }
}

export const GATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: GATE_TTL_SECONDS,
};
