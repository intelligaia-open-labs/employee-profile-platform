import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "@business-profile/db";

export const meetingRouter = Router();

meetingRouter.use(requireAuth);

// List all meeting requests
meetingRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.meetingRequest.findMany({
      orderBy: { created_at: "desc" },
      include: {
        employee: {
          select: { full_name: true, slug: true },
        },
      },
    });

    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

// Update meeting request status
meetingRouter.patch("/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;

    if (!["pending", "confirmed", "declined"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updated = await prisma.meetingRequest.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
