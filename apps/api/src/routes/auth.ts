import { Router } from "express";
import { login, logout, me, employeeLogin, employeeLogout, employeeMe } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { requireAuth, requireEmployeeAuth } from "../middleware/auth";
import { loginSchema } from "@business-profile/shared";

export const authRouter = Router();

// Admin auth
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);

// Employee auth
authRouter.post("/employee/login", validate(loginSchema), employeeLogin);
authRouter.post("/employee/logout", employeeLogout);
authRouter.get("/employee/me", requireEmployeeAuth, employeeMe);
