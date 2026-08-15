import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function upsertAccount(role: "owner" | "admin", email: string | undefined, password: string | undefined) {
  if (!email || !password) return null;
  const passwordHash = await bcrypt.hash(password, 12);
  const account = await prisma.owner.upsert({
    where: { email },
    update: { passwordHash, role },
    create: { email, passwordHash, role },
  });
  return account;
}

async function main() {
  const owner = await upsertAccount("owner", process.env.OWNER_EMAIL, process.env.OWNER_PASSWORD);
  if (!owner) {
    throw new Error("OWNER_EMAIL and OWNER_PASSWORD must be set in .env before seeding.");
  }
  console.log(`Owner account ready: ${owner.email} (role: ${owner.role})`);

  const admin = await upsertAccount("admin", process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
  if (admin) {
    console.log(`Admin account ready: ${admin.email} (role: ${admin.role})`);
  } else {
    console.log("ADMIN_EMAIL/ADMIN_PASSWORD not set — skipped creating the admin account.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
