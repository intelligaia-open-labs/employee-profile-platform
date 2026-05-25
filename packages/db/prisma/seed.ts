import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_EMAIL = "admin@example.com";
const DEFAULT_PASSWORD = "changeme-local-only";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim() || DEFAULT_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD?.trim() || DEFAULT_PASSWORD;
  const usingDefaults =
    !process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD;

  if (process.env.NODE_ENV === "production" && usingDefaults) {
    console.error(
      "Refusing to seed default admin credentials in production. " +
        "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars first."
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password_hash: passwordHash,
      role: "admin",
    },
  });

  console.log("Seed complete.");
  console.log(`  Admin email: ${email}`);
  if (usingDefaults) {
    console.warn(
      "  ⚠️  Default credentials were used. Change them immediately " +
        "via the admin UI, or rerun with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD set."
    );
  } else {
    console.log("  Admin password: (read from SEED_ADMIN_PASSWORD env)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
