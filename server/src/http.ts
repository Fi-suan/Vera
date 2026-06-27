import type { Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function sendError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "validation_error",
      message: "Request body or query is invalid",
      details: error.flatten(),
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({
      error: "request_error",
      message: error.message,
      details: error.details,
    });
  }

  console.error(error);
  return res.status(500).json({
    error: "internal_error",
    message: "Unexpected backend error",
  });
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
