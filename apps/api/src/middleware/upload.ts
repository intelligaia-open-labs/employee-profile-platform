import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";
import crypto from "crypto";
import { env, useS3 } from "../config/env";

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
  }
};

function createUpload() {
  if (useS3) {
    const s3 = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    return multer({
      storage: multerS3({
        s3,
        bucket: env.AWS_S3_BUCKET!,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (_req, file, cb) => {
          const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
          cb(null, `profiles/${uniqueName}`);
        },
      }),
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    });
  }

  // Local disk fallback
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(__dirname, "../../uploads/profiles"));
    },
    filename: (_req, file, cb) => {
      const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
}

export const upload = createUpload();

/**
 * Get the URL/path for an uploaded file.
 * S3: returns the full S3 URL (file.location)
 * Local: returns /uploads/profiles/filename
 */
export function getUploadedFilePath(file: Express.Multer.File): string {
  if (useS3 && "location" in file) {
    return (file as Express.Multer.File & { location: string }).location;
  }
  return `/uploads/profiles/${file.filename}`;
}
