import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}
