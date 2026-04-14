import QRCode from "qrcode";
import path from "path";
import { env, useS3 } from "../config/env";
import { uploadToS3 } from "./s3";

export async function generateQRCode(slug: string): Promise<string> {
  const profileUrl = `${env.PUBLIC_URL}/p/${slug}`;
  const filename = `${slug}.png`;

  const buffer = await QRCode.toBuffer(profileUrl, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  if (useS3) {
    const key = `qrcodes/${filename}`;
    await uploadToS3(key, buffer, "image/png");
    return key; // store the key, not the full URL
  }

  const fs = await import("fs/promises");
  const filepath = path.join(__dirname, "../../uploads/qrcodes", filename);
  await fs.writeFile(filepath, buffer);
  return `/uploads/qrcodes/${filename}`;
}
