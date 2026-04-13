import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create default admin
  const passwordHash = await bcrypt.hash("admin1234", 12);

  await prisma.admin.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      password_hash: passwordHash,
      role: "admin",
    },
  });

  console.log("Seed complete!");
  console.log("Admin credentials:");
  console.log("  Email: admin@company.com");
  console.log("  Password: admin1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
