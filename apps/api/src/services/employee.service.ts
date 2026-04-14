import { prisma } from "@business-profile/db";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "@business-profile/shared";
import { generateSlug } from "../utils/slug";
import { generateQRCode } from "../utils/qr";
import { AppError } from "../middleware/error";
import { useS3, env } from "../config/env";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
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
};

/** Delete a file — handles both S3 URLs and local paths */
async function deleteFile(filePath: string) {
  if (!filePath) return;

  if (filePath.startsWith("https://") && useS3) {
    try {
      const s3 = new S3Client({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      // Extract key from S3 URL
      const url = new URL(filePath);
      const key = url.pathname.slice(1); // remove leading /
      await s3.send(new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET!, Key: key }));
    } catch {
      // silent — file may already be deleted
    }
  } else {
    const localPath = path.join(__dirname, "../../", filePath);
    await fs.unlink(localPath).catch(() => {});
  }
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

  const { social_links, phone_numbers, linkedin_url, website_url, ...rest } = data;

  const updateData: Record<string, unknown> = { ...rest };
  if (linkedin_url !== undefined) {
    updateData.linkedin_url = linkedin_url || null;
  }
  if (website_url !== undefined) {
    updateData.website_url = website_url || null;
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
