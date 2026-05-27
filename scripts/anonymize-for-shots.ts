/**
 * Temporarily anonymize real-person rows so the README screenshots don't leak
 * personal data. Run before capture-screenshots.ts. Safe to re-run.
 */
import { prisma } from "@business-profile/db";

async function main() {
  const updates = [
    { match: /^jaswant/, full_name: "Sam Patel", email: "sam.patel@example.com", phone: "+1 415 555 0188" },
    { match: /^john-doe/, full_name: "Riley Kim", email: "riley.kim@example.com", phone: "+1 415 555 0177" },
  ];

  const employees = await prisma.employee.findMany({ select: { id: true, slug: true, full_name: true } });
  for (const e of employees) {
    const rule = updates.find((u) => u.match.test(e.slug));
    if (!rule) continue;
    await prisma.employee.update({
      where: { id: e.id },
      data: {
        full_name: rule.full_name,
        email: rule.email,
        phone: rule.phone,
      },
    });
    console.log(`  anonymized ${e.slug}: ${e.full_name} → ${rule.full_name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
