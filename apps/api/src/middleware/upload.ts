import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import crypto from "crypto";
import { env, useS3 } from "../config/env";
import { getS3Client } from "../utils/s3";

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
    return multer({
      storage: multerS3({
        s3: getS3Client(),
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

/** Get the stored path/key for an uploaded file */
export function getUploadedFilePath(file: Express.Multer.File): string {
  if (useS3 && "key" in file) {
    return (file as Express.Multer.File & { key: string }).key;
  }
  return `/uploads/profiles/${file.filename}`;
}
