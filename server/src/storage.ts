import { copyFile, mkdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getConfig } from "./config";
import { HttpError } from "./http";

type UploadedFile = {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
  filename: string;
};

type StoredFile = {
  url: string;
  key: string;
  adapter: "local" | "s3";
};

type StorageAdapter = {
  name: "local" | "s3";
  saveProofPhoto(file: UploadedFile): Promise<StoredFile>;
};

function safeExtension(file: UploadedFile) {
  const byName = path.extname(file.originalname).toLowerCase();
  if (byName && byName.length <= 8) return byName;
  if (file.mimetype === "image/png") return ".png";
  if (file.mimetype === "image/webp") return ".webp";
  return ".jpg";
}

function assertImage(file: UploadedFile) {
  if (!file.mimetype.startsWith("image/")) {
    throw new HttpError(400, "Photo proof must be an image file");
  }
}

export function getLocalUploadRoot() {
  const configuredDir = getConfig().STORAGE_LOCAL_DIR;
  return configuredDir ? path.resolve(configuredDir) : path.resolve(process.cwd(), "server/uploads");
}

class LocalStorageAdapter implements StorageAdapter {
  name = "local" as const;

  async saveProofPhoto(file: UploadedFile) {
    assertImage(file);
    const uploadRoot = getLocalUploadRoot();
    const dir = path.resolve(uploadRoot, "proofs");
    await mkdir(dir, { recursive: true });
    const key = `proofs/${Date.now()}-${file.filename}${safeExtension(file)}`;
    const target = path.resolve(uploadRoot, key);
    // A mounted disk (e.g. Render /data/uploads) is a different filesystem than
    // multer's temp dir, so rename() throws EXDEV — fall back to copy + unlink.
    try {
      await rename(file.path, target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
      await copyFile(file.path, target);
      await unlink(file.path).catch(() => undefined);
    }
    const publicBaseUrl = getConfig().STORAGE_LOCAL_PUBLIC_BASE_URL?.replace(/\/$/, "");
    return {
      adapter: this.name,
      key,
      url: publicBaseUrl ? `${publicBaseUrl}/uploads/${key}` : `/uploads/${key}`,
    };
  }
}

class S3StorageAdapter implements StorageAdapter {
  name = "s3" as const;
  private client: S3Client;

  constructor() {
    const config = getConfig();
    this.client = new S3Client({
      region: config.S3_REGION,
      endpoint: config.S3_ENDPOINT,
      forcePathStyle: Boolean(config.S3_ENDPOINT),
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: config.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
  }

  async saveProofPhoto(file: UploadedFile) {
    assertImage(file);
    const config = getConfig();
    if (!config.S3_BUCKET) throw new HttpError(503, "S3 storage is not configured", { missing: ["S3_BUCKET"] });

    const key = `proofs/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${file.filename}${safeExtension(file)}`;
    const body = await import("node:fs").then((fs) => fs.createReadStream(file.path));
    await this.client.send(
      new PutObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: file.mimetype,
      }),
    );
    await unlink(file.path).catch(() => undefined);

    const publicBaseUrl = (config.S3_PUBLIC_BASE_URL ?? `${config.S3_ENDPOINT}/${config.S3_BUCKET}`).replace(/\/$/, "");
    return {
      adapter: this.name,
      key,
      url: `${publicBaseUrl}/${key}`,
    };
  }
}

function getStorageAdapter(): StorageAdapter {
  return getConfig().STORAGE_ADAPTER === "s3" ? new S3StorageAdapter() : new LocalStorageAdapter();
}

export async function saveProofPhoto(file: UploadedFile) {
  return getStorageAdapter().saveProofPhoto(file);
}
