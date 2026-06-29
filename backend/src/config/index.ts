import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "access-secret",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "refresh-secret",
  accessTokenExpiry: "15m",
  refreshTokenExpiry: "7d",
  redisUrl: process.env.REDIS_URL || "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
