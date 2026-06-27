import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed === "..." ? undefined : trimmed;
};

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGINS: z.string().optional(),
  ALLOW_DEMO_HEADER: z.enum(["true", "false"]).default("false"),
  STORAGE_ADAPTER: z.enum(["local", "s3"]).default("local"),
  ACCEPT_LOCAL_STORAGE_IN_PRODUCTION: z.enum(["true", "false"]).default("false"),
  STORAGE_LOCAL_PUBLIC_BASE_URL: optionalString,
  S3_ENDPOINT: optionalUrl,
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_PUBLIC_BASE_URL: optionalUrl,
  AI_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().default("gemini-3.1-flash-lite"),
  GEMINI_BASE_URL: z.string().url().default("https://generativelanguage.googleapis.com"),
  IIKO_ADAPTER: z.enum(["mock", "real"]).default("mock"),
  IIKO_BASE_URL: z.string().url().default("https://api-ru.iiko.services"),
  IIKO_API_LOGIN: optionalString,
  IIKO_ORGANIZATION_ID: optionalString,
});

export type AppConfig = z.infer<typeof envSchema> & {
  corsOrigins: string[];
};

let cachedConfig: AppConfig | null = null;

export function getConfig() {
  if (cachedConfig) return cachedConfig;
  const parsed = envSchema.parse(process.env);
  cachedConfig = {
    ...parsed,
    corsOrigins: parsed.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [],
  };
  return cachedConfig;
}

export function validateRuntimeConfig() {
  const config = getConfig();
  const issues: string[] = [];

  if (config.NODE_ENV === "production") {
    if (!config.JWT_SECRET || config.JWT_SECRET.includes("replace-with") || config.JWT_SECRET.length < 32) {
      issues.push("JWT_SECRET must be set to a long random value in production.");
    }
    if (config.ALLOW_DEMO_HEADER === "true") {
      issues.push("ALLOW_DEMO_HEADER must be false in production.");
    }
    if (!config.DATABASE_URL) {
      issues.push("DATABASE_URL is required in production.");
    }
  }

  if (config.AI_PROVIDER === "gemini" && !config.GEMINI_API_KEY) {
    issues.push("GEMINI_API_KEY is required when AI_PROVIDER=gemini.");
  }

  if (config.NODE_ENV === "production" && config.STORAGE_ADAPTER === "local" && config.ACCEPT_LOCAL_STORAGE_IN_PRODUCTION !== "true") {
    issues.push("STORAGE_ADAPTER=s3 is recommended in production. To use local storage with a persistent disk, set ACCEPT_LOCAL_STORAGE_IN_PRODUCTION=true.");
  }

  if (config.STORAGE_ADAPTER === "s3") {
    if (!config.S3_BUCKET) issues.push("S3_BUCKET is required when STORAGE_ADAPTER=s3.");
    if (!config.S3_ACCESS_KEY_ID) issues.push("S3_ACCESS_KEY_ID is required when STORAGE_ADAPTER=s3.");
    if (!config.S3_SECRET_ACCESS_KEY) issues.push("S3_SECRET_ACCESS_KEY is required when STORAGE_ADAPTER=s3.");
    if (!config.S3_PUBLIC_BASE_URL && !config.S3_ENDPOINT) {
      issues.push("S3_PUBLIC_BASE_URL or S3_ENDPOINT is required when STORAGE_ADAPTER=s3.");
    }
  }

  if (config.IIKO_ADAPTER === "real") {
    if (!config.IIKO_API_LOGIN) issues.push("IIKO_API_LOGIN is required when IIKO_ADAPTER=real.");
    if (!config.IIKO_ORGANIZATION_ID) issues.push("IIKO_ORGANIZATION_ID is required when IIKO_ADAPTER=real.");
  }

  if (issues.length) {
    throw new Error(`Invalid VERA backend configuration:\n- ${issues.join("\n- ")}`);
  }

  return config;
}

export function getCorsOptions() {
  const config = getConfig();
  return {
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin || config.corsOrigins.length === 0 || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin is not allowed: ${origin}`));
    },
    credentials: true,
  };
}
