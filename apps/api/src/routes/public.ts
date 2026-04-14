import { Router, Request, Response, NextFunction } from "express";
import { getEmployeeBySlug, incrementScanCount, resolveEmployeeUrls } from "../services/employee.service";
import { generateVCard } from "../utils/vcard";
import { AppError } from "../middleware/error";
import { prisma } from "@business-profile/db";
import { trackProfileView } from "../utils/analytics";

export const publicRouter = Router();

// Public profile endpoint — no auth
publicRouter.get("/profile/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await getEmployeeBySlug(req.params.slug);

    if (!employee.is_active) {
      throw new AppError(404, "Profile not found");
    }

    // Track analytics and increment scan count in the background
    trackProfileView(employee.id, req).catch(() => {});
    incrementScanCount(req.params.slug).catch(() => {});

    res.json({ success: true, data: await resolveEmployeeUrls(employee) });
  } catch (err) {
    next(err);
  }
});

// Meeting request — public, no auth
publicRouter.post("/meeting-request/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await getEmployeeBySlug(req.params.slug);

    if (!employee.is_active) {
      throw new AppError(404, "Profile not found");
    }

    const { visitor_name, visitor_email, visitor_phone, message, preferred_date } = req.body;

    if (!visitor_name || !visitor_email) {
      throw new AppError(400, "Name and email are required");
    }

    const meetingRequest = await prisma.meetingRequest.create({
      data: {
        employee_id: employee.id,
        visitor_name,
        visitor_email,
        visitor_phone: visitor_phone || null,
        message: message || null,
        preferred_date: preferred_date || null,
      },
    });

    res.status(201).json({ success: true, data: meetingRequest });
  } catch (err) {
    next(err);
  }
});

// QR code image
publicRouter.get("/qr/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await getEmployeeBySlug(req.params.slug);
    if (!employee.is_active) throw new AppError(404, "Profile not found");

    const qr = await prisma.qRCode.findUnique({ where: { employee_id: employee.id } });
    if (!qr) throw new AppError(404, "QR code not found");

    const { extractS3Key, getPresignedUrl } = await import("../utils/s3");
    const s3Key = extractS3Key(qr.qr_url);
    if (s3Key) {
      const url = await getPresignedUrl(s3Key);
      return res.redirect(url);
    }

    // Local file
    const path = await import("path");
    const filePath = path.join(__dirname, "../../", qr.qr_url);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// vCard download — uses inline disposition so mobile opens contact app directly
publicRouter.get("/vcard/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await getEmployeeBySlug(req.params.slug);

    if (!employee.is_active) {
      throw new AppError(404, "Profile not found");
    }

    // Fetch phone numbers
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: { employee_id: employee.id },
      orderBy: { is_primary: "desc" },
    });

    const vcf = generateVCard({
      full_name: employee.full_name,
      designation: employee.designation,
      email: employee.email,
      phone: employee.phone,
      phone_numbers: phoneNumbers,
      website_url: employee.website_url,
      linkedin_url: employee.linkedin_url,
      address: employee.address,
      social_links: employee.social_links,
    });

    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${employee.slug}.vcf"`);
    res.send(vcf);
  } catch (err) {
    next(err);
  }
});
