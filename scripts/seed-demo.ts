/**
 * One-off helper used while capturing README screenshots. Lists existing
 * employees and, if none are present, creates a small demo dataset with
 * fictional people so the screenshot grid has something to show.
 *
 * Run with: npx tsx scripts/seed-demo.ts
 */
import { prisma } from "@business-profile/db";
import bcrypt from "bcryptjs";

const DEMO_EMPLOYEES = [
  {
    full_name: "Alex Morgan",
    designation: "Head of Engineering",
    email: "alex.morgan@example.com",
    phone: "+1 415 555 0142",
    bio: "Builds tools that make engineering teams faster and happier.",
    website_url: "https://example.com",
    linkedin_url: "https://www.linkedin.com/in/example",
    address: "San Francisco, CA",
    quick_actions: ["call", "email", "whatsapp", "add_contact"],
  },
  {
    full_name: "Priya Sharma",
    designation: "Lead Product Designer",
    email: "priya.sharma@example.com",
    phone: "+91 98765 43210",
    bio: "Designing AI-native experiences that feel calm and human.",
    website_url: "https://example.com",
    linkedin_url: "https://www.linkedin.com/in/example",
    address: "Bengaluru, India",
    quick_actions: ["call", "email", "calendar", "add_contact"],
  },
  {
    full_name: "Marcus Chen",
    designation: "Director of Sales",
    email: "marcus.chen@example.com",
    phone: "+1 212 555 0199",
    bio: "Helping enterprise teams adopt new technology with confidence.",
    website_url: "https://example.com",
    linkedin_url: "https://www.linkedin.com/in/example",
    address: "New York, NY",
    quick_actions: ["call", "email", "calendar", "whatsapp"],
  },
];

function slugify(name: string, suffix: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${suffix}`;
}

async function main() {
  // Ensure at least one admin so the admin UI is reachable.
  const adminEmail = "admin@example.com";
  const adminPassword = "demo-admin-pass-2026";
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { password_hash: adminHash },
    create: { email: adminEmail, password_hash: adminHash, role: "admin" },
  });
  console.log(`Admin ready: ${adminEmail} / ${adminPassword}`);

  const existing = await prisma.employee.findMany({
    select: { slug: true, full_name: true, is_active: true },
  });
  console.log(`Existing employees: ${existing.length}`);
  for (const e of existing) {
    console.log(`  - ${e.slug} (${e.full_name}) active=${e.is_active}`);
  }

  if (existing.length >= DEMO_EMPLOYEES.length) {
    console.log("Enough employees already exist; skipping demo seed.");
    return;
  }

  for (const [i, demo] of DEMO_EMPLOYEES.entries()) {
    const suffix = (Date.now().toString(36) + i).slice(-6);
    const slug = slugify(demo.full_name, suffix);
    const created = await prisma.employee.create({
      data: {
        slug,
        full_name: demo.full_name,
        designation: demo.designation,
        email: demo.email,
        phone: demo.phone,
        bio: demo.bio,
        website_url: demo.website_url,
        linkedin_url: demo.linkedin_url,
        address: demo.address,
        quick_actions: demo.quick_actions,
        is_active: true,
      },
    });
    console.log(`  + created ${created.slug} (${created.full_name})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
