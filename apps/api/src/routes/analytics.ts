import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { getFullAnalytics, getEmployeeAnalytics } from "../services/analytics.service";

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

analyticsRouter.get("/employee/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getEmployeeAnalytics(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
