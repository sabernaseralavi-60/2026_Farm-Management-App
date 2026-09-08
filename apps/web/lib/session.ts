import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type OwnerSession } from "./auth";

/** Reads and verifies the owner-dashboard session cookie. Returns null when
 * signed out or the token is invalid/expired — never throws. Both "owner"
 * and "admin" roles get the same access today (worker analytics and the AI
 * Q&A tool were deliberately opened to owners too); the `role` field on
 * OwnerSession/Owner is kept for future use but nothing branches on it
 * currently — there is no admin-only guard to call here. */
export async function getOwnerSession(): Promise<OwnerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}
