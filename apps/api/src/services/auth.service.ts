import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@business-profile/db";
import { env } from "../config/env";
import { AppError } from "../middleware/error";
import type { AuthPayload, EmployeeAuthPayload } from "../middleware/auth";

const TOKEN_EXPIRY = "8h";

export async function loginAdmin(email: string, password: string): Promise<string> {
  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  const payload: AuthPayload = {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export async function loginEmployee(email: string, password: string): Promise<string> {
  const credential = await prisma.employeeCredential.findUnique({
    where: { email },
    include: { employee: { select: { id: true, full_name: true, slug: true } } },
  });

  if (!credential || !credential.is_active) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, credential.password_hash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  // Update last_login
  await prisma.employeeCredential.update({
    where: { id: credential.id },
    data: { last_login: new Date() },
  });

  const payload: EmployeeAuthPayload = {
    employeeId: credential.employee.id,
    credentialId: credential.id,
    email: credential.email,
    role: credential.role,
    permissions: credential.permissions,
    fullName: credential.employee.full_name,
    slug: credential.employee.slug,
  };

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    path: "/",
  };
}
