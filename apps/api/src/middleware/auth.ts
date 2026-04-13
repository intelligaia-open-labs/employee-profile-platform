import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthPayload {
  adminId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload;
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
