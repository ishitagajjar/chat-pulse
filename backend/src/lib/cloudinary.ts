import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../middlewares/errorHandler";
import {
  isCloudinaryConfigured,
  saveFileLocally,
} from "./localUpload";

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export { isCloudinaryConfigured };

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  folder: string,
  resourceType: "image" | "raw" | "auto" = "auto"
): Promise<{ secure_url: string; bytes: number }> {
  if (!isCloudinaryConfigured()) {
    console.warn(
      "Cloudinary not configured — saving file locally (dev fallback)."
    );
    const local = await saveFileLocally(fileBuffer, fileName);
    return { secure_url: local.fileUrl, bytes: local.bytes };
  }

  try {
    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
          } else {
            resolve({ secure_url: result.secure_url, bytes: result.bytes });
          }
        }
      );
      stream.end(fileBuffer);
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cloudinary upload failed";
    console.error("Cloudinary upload error:", message);
    throw new AppError(
      502,
      "File upload failed. Check Cloudinary credentials in .env"
    );
  }
}

// Keep backward-compatible export name
export const uploadToCloudinary = uploadFile;
