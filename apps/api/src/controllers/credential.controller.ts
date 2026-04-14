import type { Request, Response, NextFunction } from "express";
import * as credentialService from "../services/credential.service";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const credential = await credentialService.createCredential(req.body);
    res.status(201).json({ success: true, data: credential });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const credential = await credentialService.updateCredential(req.params.id, req.body);
    res.json({ success: true, data: credential });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await credentialService.deleteCredential(req.params.id);
    res.json({ success: true, message: "Credential deleted" });
  } catch (err) {
    next(err);
  }
}

export async function getByEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const credential = await credentialService.getCredentialByEmployeeId(req.params.employeeId);
    res.json({ success: true, data: credential });
  } catch (err) {
    next(err);
  }
}

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const credentials = await credentialService.getAllCredentials();
    res.json({ success: true, data: credentials });
  } catch (err) {
    next(err);
  }
}
