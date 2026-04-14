import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, useS3 } from "../config/env";

let _s3: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _s3;
}

/** Upload a buffer to S3 and return the key */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const s3 = getS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
}

/** Get a presigned URL for an S3 object (valid for 1 hour) */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const s3 = getS3Client();
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET!,
      Key: key,
    }),
    { expiresIn },
  );
}

/** Delete an S3 object by key */
export async function deleteFromS3(key: string): Promise<void> {
  const s3 = getS3Client();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET!,
      Key: key,
    }),
  );
}

/** Extract S3 key from a stored path/URL. Returns null if not an S3 path. */
export function extractS3Key(storedPath: string): string | null {
  if (!useS3) return null;

  // Full S3 URL
  if (storedPath.includes(".amazonaws.com/")) {
    const url = new URL(storedPath);
    return url.pathname.slice(1);
  }

  // Stored as key directly (e.g., "profiles/abc.jpg" or "qrcodes/slug.png")
  if (storedPath.startsWith("profiles/") || storedPath.startsWith("qrcodes/")) {
    return storedPath;
  }

  return null;
}
