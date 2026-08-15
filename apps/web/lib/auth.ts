import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "farm_owner_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type OwnerRole = "owner" | "admin";

export interface OwnerSession {
  email: string;
  role: OwnerRole;
}

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(email: string, role: OwnerRole): Promise<string> {
  return new SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<OwnerSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.email !== "string") return null;
    const role = payload.role === "admin" ? "admin" : "owner";
    return { email: payload.email, role };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
