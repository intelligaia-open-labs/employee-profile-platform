import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { loginSchema } from "@business-profile/shared";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
