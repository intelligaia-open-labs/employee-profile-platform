import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const socialLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("Invalid URL"),
});

export const createEmployeeSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  designation: z.string().min(2, "Designation is required").max(100),
  bio: z.string().max(500).optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Invalid phone number").max(20),
  linkedin_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  social_links: z.array(socialLinkSchema).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const createCredentialSchema = z.object({
  employee_id: z.string().uuid("Invalid employee ID"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "editor", "viewer"]).default("viewer"),
  permissions: z.array(z.string()).default(["profile:view", "profile:edit"]),
});

export const updateCredentialSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  permissions: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;
export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>;
