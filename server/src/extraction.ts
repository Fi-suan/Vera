import { readFile } from "node:fs/promises";
import type { PrismaClient, Product, TradePoint, User } from "@prisma/client";
import { z } from "zod";
import { HttpError } from "./http";
import { validateReadyForReview } from "./validation";

type AiProvider = "mock" | "gemini";
type ExtractLang = "ru" | "kz" | "en";

type Catalog = {
  products: Product[];
  tradePoints: TradePoint[];
  employees: User[];
};

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";
const GEMINI_DEFAULT_MODEL = "gemini-3.1-flash-lite";

const geminiExtractionSchema = z.object({
  productName: z.string().nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().nullable().optional(),
  tradePointName: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  deductionType: z.enum(["with_deduction", "without_deduction"]).nullable().optional(),
  deductionEmployeeName: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  missingFields: z.array(z.string()).default([]),
  confidenceScore: z.number().min(0).max(1).default(0.5),
});

function getAiProvider(): AiProvider {
  return process.env.AI_PROVIDER === "gemini" ? "gemini" : "mock";
}

function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? GEMINI_DEFAULT_MODEL,
    baseUrl: (process.env.GEMINI_BASE_URL ?? GEMINI_BASE_URL).replace(/\/$/, ""),
  };
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function normalizeProductName(name: string) {
  return name
    .replace(/\b(cutlet|cutlets)\b/i, "Beef cutlets")
    .replace(/\b(bun|buns)\b/i, "Buns")
    .replace(/\b(tomato|tomatoes)\b/i, "Cherry tomatoes")
    .replace(/\b(croissant|croissants)\b/i, "Croissants")
    .replace(/\bmozzarella\b/i, "Mozzarella")
    .replace(/\b(fry|fries)\b/i, "Картофель фри")
    .replace(/\bcola\b/i, "Coca-cola 0,5 л")
    .replace(/\bcheeseburger\b/i, "Чизбургер")
    .trim();
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/х(?=\d)/g, "x")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractQuantity(transcript: string) {
  const numeric = transcript.match(/\b(\d+(?:[.,]\d+)?)\b/);
  if (numeric) return Number(numeric[1].replace(",", "."));

  const words: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    один: 1,
    два: 2,
    три: 3,
    четыре: 4,
    пять: 5,
    шесть: 6,
  };

  const lower = transcript.toLowerCase();
  const match = Object.entries(words).find(([word]) => lower.includes(word));
  return match?.[1] ?? null;
}

function extractUnit(transcript: string, fallback?: string | null) {
  const lower = transcript.toLowerCase();
  if (includesAny(lower, ["kg", "kilo", "kilos", "kilogram", "килограмм", "кг"])) return "kg";
  if (includesAny(lower, ["liter", "liters", "litre", "l ", "литр"])) return "L";
  if (includesAny(lower, ["pcs", "pieces", "piece", "шт", "штук"])) return "pcs";
  return fallback ?? null;
}

function extractReason(transcript: string) {
  const lower = transcript.toLowerCase();
  if (includesAny(lower, ["fell", "floor", "упал", "пол"])) return "Fell on the floor during order assembly";
  if (includesAny(lower, ["damaged", "crushed", "помят", "поврежд"])) return "Damaged product";
  if (includesAny(lower, ["expired", "shelf life", "просроч"])) return "Expired shelf life";
  if (includesAny(lower, ["burned", "over-baked", "сгорел"])) return "Over-baked and burned";
  if (includesAny(lower, ["cold chain", "fridge", "temperature"])) return "Cold chain or temperature issue";
  return transcript.length > 90 ? transcript.slice(0, 87) + "..." : transcript;
}

async function getCatalog(prisma: PrismaClient): Promise<Catalog> {
  const [products, tradePoints, employees] = await Promise.all([
    prisma.product.findMany(),
    prisma.tradePoint.findMany(),
    prisma.user.findMany({ where: { role: "employee" } }),
  ]);
  return { products, tradePoints, employees };
}

function findProduct(catalog: Catalog, name?: string | null, transcript = "") {
  const lower = `${name ?? ""} ${transcript}`.toLowerCase();
  const haystack = normalizeSearch(lower);
  const exactBahandi = catalog.products.find((item) => {
    const itemName = normalizeSearch(item.name);
    if (haystack.includes("фри")) return itemName === "картофель фри";
    if (haystack.includes("чизбургер") && haystack.includes("курица") && haystack.includes("x2")) {
      return itemName.includes("чизбургер") && itemName.includes("курица") && itemName.includes("x2");
    }
    if (haystack.includes("чизбургер") && haystack.includes("говядина") && haystack.includes("x2")) {
      return itemName.includes("чизбургер") && itemName.includes("говядина") && itemName.includes("x2");
    }
    return false;
  });
  if (exactBahandi) return exactBahandi;
  const scored = catalog.products
    .map((item) => {
      const itemName = normalizeSearch(item.name);
      const tokens = itemName.split(" ").filter((part) => part.length >= 2);
      const exact = haystack.includes(itemName);
      const score = exact ? tokens.length + 4 : tokens.filter((part) => haystack.includes(part)).length;
      return { item, score, exact };
    })
    .filter(({ item, score }) => score >= 2 || (normalizeSearch(item.name).includes("фри") && haystack.includes("фри")))
    .sort((a, b) => b.score - a.score || Number(b.exact) - Number(a.exact));
  return (
    catalog.products.find((item) => lower.includes(item.name.toLowerCase())) ??
    scored[0]?.item ??
    null
  );
}

function findTradePoint(catalog: Catalog, name?: string | null, transcript = "") {
  const lower = `${name ?? ""} ${transcript}`.toLowerCase();
  const haystack = normalizeSearch(lower);
  return (
    catalog.tradePoints.find((point) => haystack.includes(normalizeSearch(point.name))) ??
    catalog.tradePoints.find((point) => haystack.includes(normalizeSearch(point.address))) ??
    catalog.tradePoints.find((point) => {
      const tokens = normalizeSearch(`${point.name} ${point.address}`)
        .split(" ")
        .filter((part) => part.length >= 3 && !["bahandi", "astana", "астана", "улица", "проспект"].includes(part));
      const matches = tokens.filter((part) => haystack.includes(part));
      return matches.length >= 2 || tokens.some((part) => /[0-9]/.test(part) && haystack.includes(part));
    }) ??
    null
  );
}

function findEmployee(catalog: Catalog, name?: string | null, transcript = "") {
  const lower = `${name ?? ""} ${transcript}`.toLowerCase();
  return (
    catalog.employees.find((employee) => lower.includes(employee.name.toLowerCase())) ??
    catalog.employees.find((employee) =>
      employee.name
        .toLowerCase()
        .split(/\s+/)
        .some((part) => part.length > 3 && lower.includes(part)),
    ) ??
    null
  );
}

function buildMissingFields(input: {
  tradePointId?: string | null;
  productId?: string | null;
  productNameFallback?: string | null;
  quantity?: number | null;
  reason?: string | null;
  deductionType?: string | null;
  deductionEmployeeId?: string | null;
  comment?: string | null;
}) {
  return validateReadyForReview({
    ...input,
    photoUrl: null,
  }).filter((field: string) => field !== "photoUrl");
}

function languageName(lang: ExtractLang) {
  if (lang === "kz") return "Kazakh";
  if (lang === "en") return "English";
  return "Russian";
}

function fallbackComment(lang: ExtractLang, input: { quantity: number | null; unit: string | null; productName: string | null; reason: string }) {
  const subject = input.productName ?? (lang === "en" ? "Product" : lang === "kz" ? "Тауар" : "Товар");
  const qty = input.quantity ? `${input.quantity} ${input.unit ?? ""} `.trimEnd() + " " : "";
  const reason = input.reason.toLowerCase();
  if (lang === "kz") {
    return `${qty}${subject} есептен шығарылуы керек: ${reason}.`;
  }
  if (lang === "en") {
    return `${qty}${subject} should be written off: ${reason}.`;
  }
  return `${qty}${subject} нужно списать: ${reason}.`;
}

function reconcileExtraction(
  catalog: Catalog,
  transcript: string,
  raw: z.infer<typeof geminiExtractionSchema>,
  provider: AiProvider,
  lang: ExtractLang,
) {
  const product = findProduct(catalog, raw.productName, transcript);
  const tradePoint = findTradePoint(catalog, raw.tradePointName, transcript);
  const deductionEmployee = findEmployee(catalog, raw.deductionEmployeeName, transcript);
  const productName = product?.name ?? (raw.productName ? normalizeProductName(raw.productName) : null);
  const quantity = raw.quantity ?? null;
  const unit = raw.unit ?? product?.unit ?? null;
  const reason = raw.reason ?? extractReason(transcript);
  const comment = raw.comment ?? fallbackComment(lang, { quantity, unit, productName: product?.name ?? productName, reason });

  const fields = {
    productId: product?.id ?? null,
    productName,
    quantity,
    unit,
    tradePointId: tradePoint?.id ?? null,
    tradePointName: tradePoint?.name ?? raw.tradePointName ?? null,
    reason,
    deductionType: raw.deductionType ?? null,
    deductionEmployeeId: deductionEmployee?.id ?? null,
    deductionEmployeeName: deductionEmployee?.name ?? raw.deductionEmployeeName ?? null,
    comment,
  };

  const missingFields = buildMissingFields({
    tradePointId: fields.tradePointId,
    productId: fields.productId,
    productNameFallback: fields.productName,
    quantity: fields.quantity,
    reason: fields.reason,
    deductionType: fields.deductionType,
    deductionEmployeeId: fields.deductionEmployeeId,
    comment,
  });

  const confidenceScore = Math.max(0.2, Math.min(0.98, raw.confidenceScore - missingFields.length * 0.04));

  return {
    ...fields,
    aiGeneratedComment: comment,
    missingFields,
    confidenceScore,
    provider,
  };
}

function extractWithMock(catalog: Catalog, transcript: string, lang: ExtractLang) {
  const lower = transcript.toLowerCase();
  const product = findProduct(catalog, null, transcript);
  const inferredProductName =
    product?.name ??
    (includesAny(lower, ["cutlet", "котлет"]) ? "Beef cutlets" : null) ??
    (includesAny(lower, ["bun", "булоч"]) ? "Buns" : null) ??
    (includesAny(lower, ["tomato", "помид"]) ? "Cherry tomatoes" : null) ??
    (includesAny(lower, ["croissant"]) ? "Croissants" : null) ??
    (includesAny(lower, ["fries", "фри"]) ? "Картофель фри" : null);
  const tradePoint = findTradePoint(catalog, null, transcript);
  const deductionType = includesAny(lower, ["without deduction", "без удерж"])
    ? "without_deduction"
    : includesAny(lower, ["with deduction", "с удерж"])
      ? "with_deduction"
      : null;
  const quantity = extractQuantity(transcript);
  const unit = extractUnit(transcript, product?.unit);
  const reason = extractReason(transcript);

  return reconcileExtraction(
    catalog,
    transcript,
    {
      productName: inferredProductName,
      quantity,
      unit,
      tradePointName: tradePoint?.name ?? null,
      reason,
      deductionType,
      deductionEmployeeName: findEmployee(catalog, null, transcript)?.name ?? null,
      comment: null,
      missingFields: [],
      confidenceScore: 0.96,
    },
    "mock",
    lang,
  );
}

function geminiJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      productName: { type: ["string", "null"] },
      quantity: { type: ["number", "null"] },
      unit: { type: ["string", "null"] },
      tradePointName: { type: ["string", "null"] },
      reason: { type: ["string", "null"] },
      deductionType: { type: ["string", "null"], enum: ["with_deduction", "without_deduction", null] },
      deductionEmployeeName: { type: ["string", "null"] },
      comment: { type: ["string", "null"] },
      missingFields: { type: "array", items: { type: "string" } },
      confidenceScore: { type: "number" },
    },
    required: [
      "productName",
      "quantity",
      "unit",
      "tradePointName",
      "reason",
      "deductionType",
      "deductionEmployeeName",
      "comment",
      "missingFields",
      "confidenceScore",
    ],
  };
}

async function callGeminiJson<T>(prompt: string, parts: Array<Record<string, unknown>>, responseSchema?: Record<string, unknown>) {
  const config = getGeminiConfig();
  if (!config.apiKey) throw new HttpError(503, "Gemini provider is not configured", { missing: ["GEMINI_API_KEY"] });

  const res = await fetch(`${config.baseUrl}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, ...parts],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        ...(responseSchema ? { responseJsonSchema: responseSchema } : {}),
      },
    }),
  });

  const body = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new HttpError(res.status, "Gemini API request failed", body.error ?? body);
  }

  const text = body.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
  if (!text) throw new HttpError(502, "Gemini returned an empty response");
  return JSON.parse(text) as T;
}

async function extractWithGemini(catalog: Catalog, transcript: string, lang: ExtractLang) {
  const prompt = [
    "You are VERA, a form-filling assistant for restaurant product write-off requests.",
    "The transcript can be in Russian, Kazakh, English, or a mix. Understand the meaning, but return normalized JSON values.",
    "Extract only structured fields from the transcript. Do not chat or add markdown.",
    "Use product, trade point and employee names from the catalogs when possible. Prefer exact catalog spellings.",
    "If a field is not confidently present, return null and include its backend API field name in missingFields.",
    "Allowed missingFields values: productId, quantity, tradePointId, reason, deductionType, deductionEmployeeId, comment.",
    "Required fields before review: productName/productId, quantity, tradePointName/tradePointId, reason, deductionType, comment.",
    "If deductionType is with_deduction, deductionEmployeeName/deductionEmployeeId is required.",
    `Return the comment in ${languageName(lang)}. Keep it concise and professional for manager review.`,
    "Map phrases like 'без удержания' or 'ұстамай' to without_deduction; 'с удержанием' or 'ұстап қалу' to with_deduction.",
    "",
    `Products: ${catalog.products.map((p) => `${p.name} (${p.unit})`).join(", ")}`,
    `Trade points: ${catalog.tradePoints.map((p) => p.name).join(", ")}`,
    `Employees: ${catalog.employees.map((e) => e.name).join(", ")}`,
    "",
    `Transcript: ${transcript}`,
  ].join("\n");

  const raw = await callGeminiJson<unknown>(prompt, [], geminiJsonSchema());
  return reconcileExtraction(catalog, transcript, geminiExtractionSchema.parse(raw), "gemini", lang);
}

export async function extractWriteOffFields(prisma: PrismaClient, transcript: string, lang: ExtractLang = "ru") {
  const catalog = await getCatalog(prisma);
  if (getAiProvider() === "gemini") return extractWithGemini(catalog, transcript, lang);
  return extractWithMock(catalog, transcript, lang);
}

export async function transcribeAudio(file: { path: string; mimetype: string }) {
  if (getAiProvider() !== "gemini") {
    return {
      transcript: `Audio uploaded as ${file.path.split("/").pop()}; Gemini transcription is disabled because AI_PROVIDER is not gemini.`,
      provider: "mock" as const,
    };
  }

  const data = await readFile(file.path);
  const prompt = "Transcribe this audio for a product write-off request. Return JSON with a single field: transcript.";
  const raw = await callGeminiJson<unknown>(prompt, [
    {
      inlineData: {
        mimeType: file.mimetype || "audio/mpeg",
        data: data.toString("base64"),
      },
    },
  ]);
  const parsed = z.object({ transcript: z.string().trim().min(1) }).parse(raw);
  return { transcript: parsed.transcript, provider: "gemini" as const };
}

export async function testAiProvider() {
  const provider = getAiProvider();
  if (provider === "mock") {
    return {
      provider,
      configured: true,
      ok: true,
      model: "deterministic-local-mock",
      message: "Mock AI provider is active. Gemini API is not used.",
    };
  }

  const config = getGeminiConfig();
  if (!config.apiKey) {
    throw new HttpError(503, "Gemini provider is not configured", { missing: ["GEMINI_API_KEY"] });
  }

  const raw = await callGeminiJson<unknown>("Return JSON: {\"ok\":true,\"message\":\"ready\"}", []);
  return {
    provider,
    configured: true,
    ok: true,
    model: config.model,
    message: "Gemini provider is configured and responded.",
    details: raw,
  };
}
