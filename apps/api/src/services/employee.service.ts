import { prisma } from "@business-profile/db";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "@business-profile/shared";
import { generateSlug } from "../utils/slug";
import { generateQRCode } from "../utils/qr";
import { AppError } from "../middleware/error";
import fs from "fs/promises";
import path from "path";

const employeeInclude = {
  social_links: {
    select: { id: true, platform: true, url: true },
  },
  qr_code: {
    select: { id: true, qr_url: true, scan_count: true },
  },
};

export async function createEmployee(data: CreateEmployeeInput, profileImage?: string) {
  const slug = generateSlug(data.full_name);
  const { social_links, linkedin_url, website_url, ...rest } = data;

  const employee = await prisma.employee.create({
    data: {
      ...rest,
      slug,
      linkedin_url: linkedin_url || null,
      website_url: website_url || null,
      profile_image: profileImage || null,
      social_links: social_links?.length
        ? { create: social_links }
        : undefined,
    },
    include: employeeInclude,
  });

  // Generate QR code
  const qrUrl = await generateQRCode(slug);
  const qrCode = await prisma.qRCode.create({
    data: {
      employee_id: employee.id,
      qr_url: qrUrl,
    },
  });

  return { ...employee, qr_code: qrCode };
}

export async function getAllEmployees(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: employeeInclude,
    }),
    prisma.employee.count(),
  ]);

  return { employees, total, page, limit };
}

export async function getEmployeeBySlug(slug: string) {
  const employee = await prisma.employee.findUnique({
    where: { slug },
    include: employeeInclude,
  });

  if (!employee) {
    throw new AppError(404, "Employee not found");
  }

  return employee;
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: employeeInclude,
  });

  if (!employee) {
    throw new AppError(404, "Employee not found");
  }

  return employee;
}

export async function updateEmployee(id: string, data: UpdateEmployeeInput, profileImage?: string) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Employee not found");
  }

  const { social_links, linkedin_url, website_url, ...rest } = data;

  // Build update payload — only include fields that were actually provided
  const updateData: Record<string, unknown> = { ...rest };
  if (linkedin_url !== undefined) {
    updateData.linkedin_url = linkedin_url || null;
  }
  if (website_url !== undefined) {
    updateData.website_url = website_url || null;
  }
  if (profileImage) {
    // Delete old image if exists
    if (existing.profile_image) {
      const oldPath = path.join(__dirname, "../../", existing.profile_image);
      await fs.unlink(oldPath).catch(() => {});
    }
    updateData.profile_image = profileImage;
  }

  if (social_links) {
    await prisma.socialLink.deleteMany({ where: { employee_id: id } });
    if (social_links.length > 0) {
      await prisma.socialLink.createMany({
        data: social_links.map((sl) => ({ ...sl, employee_id: id })),
      });
    }
  }

  return prisma.employee.update({
    where: { id },
    data: updateData,
    include: employeeInclude,
  });
}

export async function toggleEmployeeActive(id: string) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Employee not found");
  }

  return prisma.employee.update({
    where: { id },
    data: { is_active: !existing.is_active },
    include: employeeInclude,
  });
}

export async function deleteEmployee(id: string) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Employee not found");
  }

  // Clean up files
  if (existing.profile_image) {
    const imgPath = path.join(__dirname, "../../", existing.profile_image);
    await fs.unlink(imgPath).catch(() => {});
  }

  const qr = await prisma.qRCode.findUnique({ where: { employee_id: id } });
  if (qr) {
    const qrPath = path.join(__dirname, "../../", qr.qr_url);
    await fs.unlink(qrPath).catch(() => {});
  }

  await prisma.employee.delete({ where: { id } });
}

export async function incrementScanCount(slug: string) {
  const employee = await prisma.employee.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!employee) return;

  await prisma.qRCode.updateMany({
    where: { employee_id: employee.id },
    data: { scan_count: { increment: 1 } },
  });
}
