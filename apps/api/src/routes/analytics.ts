import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { getFullAnalytics } from "../services/analytics.service";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getFullAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
