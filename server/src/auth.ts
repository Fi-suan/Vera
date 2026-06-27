import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { User } from "@prisma/client";
import { HttpError } from "./http";

const DEFAULT_JWT_SECRET = "vera-local-development-secret-change-me";
const DEFAULT_EXPIRES_IN = "7d";

export type AuthTokenPayload = {
  sub: string;
  role: string;
};

export function getJwtSecret() {
  return process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash?: string | null) {
  if (!passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}

export function issueAccessToken(user: Pick<User, "id" | "role">) {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? DEFAULT_EXPIRES_IN) as SignOptions["expiresIn"];
  return jwt.sign({ sub: user.id, role: user.role } satisfies AuthTokenPayload, getJwtSecret(), {
    expiresIn,
  });
}

export function verifyAccessToken(token: string) {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (!payload || typeof payload !== "object" || typeof payload.sub !== "string") {
      throw new HttpError(401, "Invalid access token");
    }
    return payload as AuthTokenPayload;
  } catch {
    throw new HttpError(401, "Invalid or expired access token");
  }
}

export function publicUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
