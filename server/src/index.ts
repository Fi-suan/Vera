import { createApp } from "./app";
import { validateRuntimeConfig } from "./config";
import { getPrisma } from "./db";

const config = validateRuntimeConfig();
const prisma = getPrisma();
const app = createApp({ prisma });

const server = app.listen(config.PORT, () => {
  console.log(`VERA backend listening on http://localhost:${config.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}; shutting down VERA backend...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
