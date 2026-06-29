import fs from "fs";
import path from "path";
import crypto from "crypto";
import { config } from "../config";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

const PLACEHOLDER_VALUES = new Set([
  "your-cloud",
  "your-key",
  "your-secret",
  "",
]);

export function isCloudinaryConfigured(): boolean {
  return (
    !PLACEHOLDER_VALUES.has(config.cloudinaryCloudName) &&
    !PLACEHOLDER_VALUES.has(config.cloudinaryApiKey) &&
    !PLACEHOLDER_VALUES.has(config.cloudinaryApiSecret)
  );
}

export async function saveFileLocally(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ fileUrl: string; bytes: number }> {
  ensureUploadsDir();

  const ext = path.extname(fileName);
  const safeName = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, safeName);

  fs.writeFileSync(filePath, fileBuffer);

  const baseUrl =
    config.nodeEnv === "production"
      ? config.frontendUrl.replace("5173", "3000")
      : `http://localhost:${config.port}`;

  return {
    fileUrl: `${baseUrl}/uploads/${safeName}`,
    bytes: fileBuffer.length,
  };
}
