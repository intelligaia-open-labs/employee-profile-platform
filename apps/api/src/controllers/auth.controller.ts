import { Request, Response, NextFunction } from "express";
import { loginAdmin, buildCookieOptions } from "../services/auth.service";

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const token = await loginAdmin(email, password);

    res.cookie("token", token, buildCookieOptions());
    res.json({ success: true, message: "Logged in successfully" });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie("token", { path: "/" });
  res.json({ success: true, message: "Logged out successfully" });
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: req.admin });
}
