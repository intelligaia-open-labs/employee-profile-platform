import { Router } from "express";
import * as ctrl from "../controllers/employee.controller";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";

export const employeeRouter = Router();

// All employee admin routes require auth
employeeRouter.use(requireAuth);

employeeRouter.post("/", upload.single("profile_image"), ctrl.create);
employeeRouter.get("/", ctrl.getAll);
employeeRouter.get("/:id", ctrl.getById);
employeeRouter.put("/:id", upload.single("profile_image"), ctrl.update);
employeeRouter.patch("/:id/toggle-active", ctrl.toggleActive);
employeeRouter.delete("/:id", ctrl.remove);
