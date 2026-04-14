import { Request, Response, NextFunction } from "express";
import { loginAdmin, loginEmployee, buildCookieOptions } from "../services/auth.service";

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

export async function employeeLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const token = await loginEmployee(email, password);

    const cookieOpts = buildCookieOptions();
    res.cookie("emp_token", token, cookieOpts);
    res.json({ success: true, message: "Logged in successfully" });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie("token", { path: "/" });
  res.json({ success: true, message: "Logged out successfully" });
}

export async function employeeLogout(_req: Request, res: Response): Promise<void> {
  res.clearCookie("emp_token", { path: "/" });
  res.json({ success: true, message: "Logged out successfully" });
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: req.admin });
}

export async function employeeMe(req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: req.employeeAuth });
}
