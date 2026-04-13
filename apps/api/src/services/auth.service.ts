import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@business-profile/db";
import { env } from "../config/env";
import { AppError } from "../middleware/error";
import type { AuthPayload } from "../middleware/auth";

const TOKEN_EXPIRY = "7d";

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

export function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
}
