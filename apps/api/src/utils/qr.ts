import QRCode from "qrcode";
import path from "path";
import { env, useS3 } from "../config/env";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function generateQRCode(slug: string): Promise<string> {
  const profileUrl = `${env.PUBLIC_URL}/p/${slug}`;
  const filename = `${slug}.png`;

  const buffer = await QRCode.toBuffer(profileUrl, {
    type: "png",
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  if (useS3) {
    const s3 = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const key = `qrcodes/${filename}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: "image/png",
      }),
    );

    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  // Local fallback
  const fs = await import("fs/promises");
  const filepath = path.join(__dirname, "../../uploads/qrcodes", filename);
  await fs.writeFile(filepath, buffer);
  return `/uploads/qrcodes/${filename}`;
}
