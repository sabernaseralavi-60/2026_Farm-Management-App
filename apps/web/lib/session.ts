import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type OwnerSession } from "./auth";

/** Reads and verifies the owner-dashboard session cookie. Returns null when
 * signed out or the token is invalid/expired — never throws. */
export async function getOwnerSession(): Promise<OwnerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

/** Same as getOwnerSession, but only returns a session for the "admin" role
 * — use this to guard admin-only pages/API routes (worker analytics, AI Q&A). */
export async function requireAdminSession(): Promise<OwnerSession | null> {
  const session = await getOwnerSession();
  return session?.role === "admin" ? session : null;
}
