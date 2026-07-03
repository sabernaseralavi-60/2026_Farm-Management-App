import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error("OWNER_EMAIL and OWNER_PASSWORD must be set in .env before seeding.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const owner = await prisma.owner.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Owner account ready: ${owner.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
