import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthPayload {
  adminId: string;
  email: string;
  role: string;
}

export interface EmployeeAuthPayload {
  employeeId: string;
  credentialId: string;
  email: string;
  role: string;
  permissions: string[];
  fullName: string;
  slug: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload;
      employeeAuth?: EmployeeAuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

export function requireEmployeeAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.emp_token;

  if (!token) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as EmployeeAuthPayload;
    if (!payload.employeeId) {
      res.status(401).json({ success: false, error: "Invalid token type" });
      return;
    }
    req.employeeAuth = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

export function requirePermission(...perms: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = req.employeeAuth;
    if (!auth) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    if (auth.role === "admin") {
      next();
      return;
    }
    const hasAll = perms.every((p) => auth.permissions.includes(p));
    if (!hasAll) {
      res.status(403).json({ success: false, error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
