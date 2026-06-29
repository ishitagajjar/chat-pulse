import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";

export interface TokenPayload {
  userId: string;
}

const accessOptions: SignOptions = { expiresIn: "15m" };
const refreshOptions: SignOptions = { expiresIn: "7d" };

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, config.accessTokenSecret, accessOptions);
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, config.refreshTokenSecret, refreshOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.accessTokenSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.refreshTokenSecret) as TokenPayload;
}
