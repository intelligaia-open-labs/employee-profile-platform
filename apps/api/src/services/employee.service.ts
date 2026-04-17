import { prisma } from "@business-profile/db";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "@business-profile/shared";
import { generateSlug } from "../utils/slug";
import { generateQRCode } from "../utils/qr";
import { AppError } from "../middleware/error";
import { useS3 } from "../config/env";
import { deleteFromS3, extractS3Key, getPresignedUrl } from "../utils/s3";
import fs from "fs/promises";
import path from "path";

const employeeInclude = {
  social_links: {
    select: { id: true, platform: true, url: true },
  },
  phone_numbers: {
    select: { id: true, country_code: true, number: true, label: true, is_primary: true },
    orderBy: { is_primary: "desc" as const },
  },
  qr_code: {
    select: { id: true, qr_url: true, scan_count: true },
  },
  credential: {
    select: { id: true, email: true, role: true, permissions: true, is_active: true, last_login: true, created_at: true },
  },
};

/** Delete a file — handles S3 keys, S3 URLs, and local paths */
async function deleteFile(filePath: string) {
  if (!filePath) return;

  const s3Key = extractS3Key(filePath);
  if (s3Key) {
    await deleteFromS3(s3Key).catch(() => {});
  } else {
    const localPath = path.join(__dirname, "../../", filePath);
    await fs.unlink(localPath).catch(() => {});
  }
}

/** Resolve a stored path to a viewable URL (presigned for S3) */
async function resolveUrl(storedPath: string | null): Promise<string | null> {
  if (!storedPath) return null;
  const s3Key = extractS3Key(storedPath);
  if (s3Key) {
    return getPresignedUrl(s3Key);
  }
  return storedPath;
}

/** Resolve all file URLs in an employee record */
export async function resolveEmployeeUrls<T extends { profile_image: string | null; qr_code: { qr_url: string } | null }>(
  employee: T,
): Promise<T> {
  const [profileImage, qrUrl] = await Promise.all([
    resolveUrl(employee.profile_image),
    employee.qr_code ? resolveUrl(employee.qr_code.qr_url) : null,
  ]);

  return {
    ...employee,
    profile_image: profileImage,
    qr_code: employee.qr_code
      ? { ...employee.qr_code, qr_url: qrUrl! }
      : null,
  };
}

export async function createEmployee(data: CreateEmployeeInput, profileImage?: string) {
  const slug = generateSlug(data.full_name);
  const { social_links, phone_numbers, linkedin_url, website_url, ...rest } = data;

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
      phone_numbers: phone_numbers?.length
        ? { create: phone_numbers }
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

  const { social_links, phone_numbers, linkedin_url, website_url, calendar_url, ...rest } = data;

  const updateData: Record<string, unknown> = { ...rest };
  if (linkedin_url !== undefined) {
    updateData.linkedin_url = linkedin_url || null;
  }
  if (website_url !== undefined) {
    updateData.website_url = website_url || null;
  }
  if (calendar_url !== undefined) {
    updateData.calendar_url = calendar_url || null;
  }
  if (profileImage) {
    if (existing.profile_image) {
      await deleteFile(existing.profile_image);
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

  if (phone_numbers) {
    await prisma.phoneNumber.deleteMany({ where: { employee_id: id } });
    if (phone_numbers.length > 0) {
      await prisma.phoneNumber.createMany({
        data: phone_numbers.map((pn) => ({ ...pn, employee_id: id })),
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

  if (existing.profile_image) {
    await deleteFile(existing.profile_image);
  }

  const qr = await prisma.qRCode.findUnique({ where: { employee_id: id } });
  if (qr) {
    await deleteFile(qr.qr_url);
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
