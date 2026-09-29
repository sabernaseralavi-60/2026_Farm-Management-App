import "dotenv/config";
import bcrypt from "bcryptjs";
import { MODULE_META } from "../lib/module-meta";
import { prisma } from "../lib/prisma";

// Usage:
//   npx tsx prisma/create-field-user.ts <username> <password> "<display name>" <module,module,...> [ownerEmail]
// Example:
//   npx tsx prisma/create-field-user.ts milad 'S3cret-pass' "میلاد" machinery
// The optional 5th argument links this login to an existing Owner account
// (its email) so that person can jump straight into /owner from the worker
// app without a second login — see /api/owner/sso. Omit it for everyone else.
// Re-running for an existing username updates its password/modules/link.
// Valid modules: attendance, machinery, irrigation, spray, orchard, inventory,
// accounting, harvest, sheep, security, reports.

async function main() {
  const [rawUsername, password, displayName, moduleArg, ownerEmailArg] = process.argv.slice(2);
  if (!rawUsername || !password || !displayName || !moduleArg) {
    throw new Error(
      'Usage: create-field-user.ts <username> <password> "<display name>" <module,module,...> [ownerEmail]',
    );
  }
  const username = rawUsername.trim().toLowerCase();
  const modules = moduleArg.split(",").map((m) => m.trim()).filter(Boolean);
  const valid = MODULE_META.map((m) => m.key);
  const unknown = modules.filter((m) => !valid.includes(m));
  if (unknown.length || modules.length === 0) {
    throw new Error(`Unknown module(s): ${unknown.join(", ") || "(none given)"}. Valid: ${valid.join(", ")}`);
  }
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  const ownerEmail = ownerEmailArg?.trim() || null;
  if (ownerEmail) {
    const owner = await prisma.owner.findUnique({ where: { email: ownerEmail } });
    if (!owner) throw new Error(`No Owner account found with email "${ownerEmail}" — create it first.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.fieldUser.upsert({
    where: { username },
    update: { passwordHash, displayName, modules, ownerEmail },
    create: { username, passwordHash, displayName, modules, ownerEmail },
  });
  console.log(
    `Field user ready: ${user.username} (${user.displayName}) → ${user.modules.join(", ")}` +
      (user.ownerEmail ? ` [linked to owner: ${user.ownerEmail}]` : ""),
  );
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
