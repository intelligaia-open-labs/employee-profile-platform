import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createCredentialSchema, updateCredentialSchema } from "@business-profile/shared";
import * as ctrl from "../controllers/credential.controller";

export const credentialRouter = Router();

credentialRouter.use(requireAuth);

credentialRouter.post("/", validate(createCredentialSchema), ctrl.create);
credentialRouter.get("/", ctrl.getAll);
credentialRouter.get("/employee/:employeeId", ctrl.getByEmployee);
credentialRouter.put("/:id", validate(updateCredentialSchema), ctrl.update);
credentialRouter.delete("/:id", ctrl.remove);
