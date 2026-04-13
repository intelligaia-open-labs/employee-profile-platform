import { Router, Request, Response, NextFunction } from "express";
import { getEmployeeBySlug, incrementScanCount } from "../services/employee.service";
import { generateVCard } from "../utils/vcard";
import { AppError } from "../middleware/error";

export const publicRouter = Router();

// Public profile endpoint — no auth
publicRouter.get("/profile/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await getEmployeeBySlug(req.params.slug);

    if (!employee.is_active) {
      throw new AppError(404, "Profile not found");
    }

    // Increment scan count in the background
    incrementScanCount(req.params.slug).catch(() => {});

    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
});

// vCard download
publicRouter.get("/vcard/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await getEmployeeBySlug(req.params.slug);

    if (!employee.is_active) {
      throw new AppError(404, "Profile not found");
    }

    const vcf = generateVCard({
      full_name: employee.full_name,
      designation: employee.designation,
      email: employee.email,
      phone: employee.phone,
      website_url: employee.website_url,
      linkedin_url: employee.linkedin_url,
      address: employee.address,
    });

    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${employee.slug}.vcf"`);
    res.send(vcf);
  } catch (err) {
    next(err);
  }
});
