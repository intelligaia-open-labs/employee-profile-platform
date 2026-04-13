import QRCode from "qrcode";
import path from "path";
import { env } from "../config/env";

export async function generateQRCode(slug: string): Promise<string> {
  const profileUrl = `${env.PUBLIC_URL}/p/${slug}`;
  const filename = `${slug}.png`;
  const filepath = path.join(__dirname, "../../uploads/qrcodes", filename);

  await QRCode.toFile(filepath, profileUrl, {
    type: "png",
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  return `/uploads/qrcodes/${filename}`;
}
