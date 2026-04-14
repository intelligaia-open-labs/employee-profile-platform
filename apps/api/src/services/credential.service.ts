import { prisma } from "@business-profile/db";
import type { CreateCredentialInput, UpdateCredentialInput } from "@business-profile/shared";
import bcrypt from "bcryptjs";
import { AppError } from "../middleware/error";

const credentialSelect = {
  id: true,
  employee_id: true,
  email: true,
  role: true,
  permissions: true,
  is_active: true,
  last_login: true,
  created_at: true,
};

export async function createCredential(data: CreateCredentialInput) {
  // Check employee exists
  const employee = await prisma.employee.findUnique({ where: { id: data.employee_id } });
  if (!employee) {
    throw new AppError(404, "Employee not found");
  }

  // Check if employee already has credentials
  const existing = await prisma.employeeCredential.findUnique({
    where: { employee_id: data.employee_id },
  });
  if (existing) {
    throw new AppError(409, "Employee already has credentials");
  }

  // Check email uniqueness
  const emailExists = await prisma.employeeCredential.findUnique({
    where: { email: data.email },
  });
  if (emailExists) {
    throw new AppError(409, "Email already in use");
  }

  const password_hash = await bcrypt.hash(data.password, 12);

  return prisma.employeeCredential.create({
    data: {
      employee_id: data.employee_id,
      email: data.email,
      password_hash,
      role: data.role,
      permissions: data.permissions,
    },
    select: credentialSelect,
  });
}

export async function updateCredential(id: string, data: UpdateCredentialInput) {
  const existing = await prisma.employeeCredential.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Credential not found");
  }

  if (data.email && data.email !== existing.email) {
    const emailExists = await prisma.employeeCredential.findUnique({
      where: { email: data.email },
    });
    if (emailExists) {
      throw new AppError(409, "Email already in use");
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (data.password) {
    updateData.password_hash = await bcrypt.hash(data.password, 12);
  }

  return prisma.employeeCredential.update({
    where: { id },
    data: updateData,
    select: credentialSelect,
  });
}

export async function deleteCredential(id: string) {
  const existing = await prisma.employeeCredential.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Credential not found");
  }
  await prisma.employeeCredential.delete({ where: { id } });
}

export async function getCredentialByEmployeeId(employeeId: string) {
  return prisma.employeeCredential.findUnique({
    where: { employee_id: employeeId },
    select: credentialSelect,
  });
}

export async function getAllCredentials() {
  return prisma.employeeCredential.findMany({
    select: {
      ...credentialSelect,
      employee: {
        select: { id: true, full_name: true, designation: true, profile_image: true },
      },
    },
    orderBy: { created_at: "desc" },
  });
}
