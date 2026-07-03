import { SignJWT, jwtVerify } from "jose";

export const GATE_COOKIE = "farm_gate_session";
const GATE_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days — this is a shared farm PIN, not a personal login

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var is not set");
  return new TextEncoder().encode("gate:" + secret);
}

export async function createGateToken(): Promise<string> {
  return new SignJWT({ gate: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${GATE_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyGateToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.gate === true;
  } catch {
    return false;
  }
}

export const GATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: GATE_TTL_SECONDS,
};
