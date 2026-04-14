const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** Resolves an image path to a full URL. S3 paths are already absolute. */
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}
