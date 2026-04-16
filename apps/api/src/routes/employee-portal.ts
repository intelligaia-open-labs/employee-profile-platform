import { Router } from "express";
import { requireEmployeeAuth, requirePermission } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { getUploadedFilePath } from "../middleware/upload";
import * as employeeService from "../services/employee.service";
import { resolveEmployeeUrls } from "../services/employee.service";
import { getEmployeeAnalytics } from "../services/analytics.service";
import type { Request, Response, NextFunction } from "express";

export const employeePortalRouter = Router();

employeePortalRouter.use(requireEmployeeAuth);

// Get own profile
employeePortalRouter.get(
  "/profile",
  requirePermission("profile:view"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employee = await employeeService.getEmployeeById(req.employeeAuth!.employeeId);
      res.json({ success: true, data: await resolveEmployeeUrls(employee) });
    } catch (err) {
      next(err);
    }
  }
);

// Get own analytics
employeePortalRouter.get(
  "/analytics",
  requirePermission("analytics:view"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await getEmployeeAnalytics(req.employeeAuth!.employeeId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// Update own profile
employeePortalRouter.put(
  "/profile",
  requirePermission("profile:edit"),
  upload.single("profile_image"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let body = { ...req.body };
      // Parse JSON fields from FormData
      if (typeof body.social_links === "string") {
        try { body.social_links = JSON.parse(body.social_links); } catch { /* ignore */ }
      }
      if (typeof body.phone_numbers === "string") {
        try { body.phone_numbers = JSON.parse(body.phone_numbers); } catch { /* ignore */ }
      }

      const profileImage = req.file ? getUploadedFilePath(req.file) : undefined;
      const employee = await employeeService.updateEmployee(
        req.employeeAuth!.employeeId,
        body,
        profileImage
      );
      res.json({ success: true, data: await resolveEmployeeUrls(employee) });
    } catch (err) {
      next(err);
    }
  }
);
