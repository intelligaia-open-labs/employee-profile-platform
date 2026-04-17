import { Request, Response, NextFunction } from "express";
import * as employeeService from "../services/employee.service";
import { resolveEmployeeUrls } from "../services/employee.service";
import { getUploadedFilePath } from "../middleware/upload";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profileImage = req.file ? getUploadedFilePath(req.file) : undefined;

    let body = req.body;
    if (typeof body.social_links === "string") {
      try {
        body = { ...body, social_links: JSON.parse(body.social_links) };
      } catch {
        body = { ...body, social_links: [] };
      }
    }
    if (typeof body.phone_numbers === "string") {
      try {
        body = { ...body, phone_numbers: JSON.parse(body.phone_numbers) };
      } catch {
        body = { ...body, phone_numbers: [] };
      }
    }
    if (typeof body.quick_actions === "string") {
      try {
        body = { ...body, quick_actions: JSON.parse(body.quick_actions) };
      } catch { /* ignore */ }
    }

    const employee = await employeeService.createEmployee(body, profileImage);
    res.status(201).json({ success: true, data: await resolveEmployeeUrls(employee) });
  } catch (err) {
    next(err);
  }
}

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const result = await employeeService.getAllEmployees(page, limit);
    res.json({
      success: true,
      data: await Promise.all(result.employees.map(resolveEmployeeUrls)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.getEmployeeBySlug(req.params.slug);
    res.json({ success: true, data: await resolveEmployeeUrls(employee) });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.json({ success: true, data: await resolveEmployeeUrls(employee) });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profileImage = req.file ? getUploadedFilePath(req.file) : undefined;

    let body = req.body;
    if (typeof body.social_links === "string") {
      try {
        body = { ...body, social_links: JSON.parse(body.social_links) };
      } catch {
        body = { ...body, social_links: [] };
      }
    }
    if (typeof body.phone_numbers === "string") {
      try {
        body = { ...body, phone_numbers: JSON.parse(body.phone_numbers) };
      } catch {
        body = { ...body, phone_numbers: [] };
      }
    }
    if (typeof body.quick_actions === "string") {
      try {
        body = { ...body, quick_actions: JSON.parse(body.quick_actions) };
      } catch { /* ignore */ }
    }

    const employee = await employeeService.updateEmployee(req.params.id, body, profileImage);
    res.json({ success: true, data: await resolveEmployeeUrls(employee) });
  } catch (err) {
    next(err);
  }
}

export async function toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.toggleEmployeeActive(req.params.id);
    res.json({ success: true, data: await resolveEmployeeUrls(employee) });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await employeeService.deleteEmployee(req.params.id);
    res.json({ success: true, message: "Employee deleted" });
  } catch (err) {
    next(err);
  }
}
