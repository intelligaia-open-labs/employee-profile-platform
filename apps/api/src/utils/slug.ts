import slugify from "slugify";
import crypto from "crypto";

export function generateSlug(name: string): string {
  const base = slugify(name, { lower: true, strict: true, trim: true });
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
}
