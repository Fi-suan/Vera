import { z } from "zod";
import { DEDUCTION_TYPES, REQUEST_STATUSES } from "./constants";

const optionalString = z.string().trim().min(1).optional().nullable();

export const transcribeSchema = z.object({
  mockTranscript: z.string().trim().min(1).optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().min(5).optional(),
  password: z.string().min(8),
  role: z.enum(["employee", "reviewer", "admin"]).default("employee"),
  tradePointId: z.string().trim().min(1).optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const extractSchema = z.object({
  transcript: z.string().trim().min(1),
});

export const createWriteOffSchema = z.object({
  tradePointId: optionalString,
  productId: optionalString,
  productName: optionalString,
  productNameFallback: optionalString,
  quantity: z.number().positive().optional().nullable(),
  unit: optionalString,
  reason: optionalString,
  deductionType: z.enum(DEDUCTION_TYPES).optional().nullable(),
  deductionEmployeeId: optionalString,
  comment: optionalString,
  photoUrl: optionalString,
  voiceTranscript: optionalString,
  aiExtractedFields: z.record(z.unknown()).optional().default({}),
  aiGeneratedComment: optionalString,
  aiConfidenceScore: z.number().min(0).max(1).optional().nullable(),
  missingFields: z.array(z.string()).optional().default([]),
});

export const patchWriteOffSchema = createWriteOffSchema.partial().extend({
  status: z.enum(["draft", "missing_info"]).optional(),
});

export const attachPhotoSchema = z.object({
  photoUrl: z.string().trim().min(1).optional(),
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(3),
});

export const reviewerListSchema = z.object({
  status: z.enum(REQUEST_STATUSES).optional(),
  tradePointId: z.string().trim().min(1).optional(),
  employeeId: z.string().trim().min(1).optional(),
  deductionType: z.enum(DEDUCTION_TYPES).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export function validateReadyForReview(input: {
  tradePointId?: string | null;
  productId?: string | null;
  productNameFallback?: string | null;
  quantity?: number | null;
  reason?: string | null;
  deductionType?: string | null;
  deductionEmployeeId?: string | null;
  comment?: string | null;
  photoUrl?: string | null;
}) {
  const missing: string[] = [];

  if (!input.tradePointId) missing.push("tradePointId");
  if (!input.productId && !input.productNameFallback) missing.push("productId");
  if (!input.quantity || input.quantity <= 0) missing.push("quantity");
  if (!input.reason) missing.push("reason");
  if (!input.deductionType) missing.push("deductionType");
  if (!input.comment || input.comment.trim().length < 10) missing.push("comment");
  if (!input.photoUrl) missing.push("photoUrl");
  if (input.deductionType === "with_deduction" && !input.deductionEmployeeId) {
    missing.push("deductionEmployeeId");
  }

  return missing;
}
