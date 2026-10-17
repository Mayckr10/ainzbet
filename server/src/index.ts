import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { webhookCallback } from "grammy";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { migrate } from "./db.js";
import { bot, initBot, setupBot } from "./bot.js";
import { routes } from "./routes.js";

const here = dirname(fileURLToPath(import.meta.url));
const webDist = [join(here, "../../web/dist"), join(here, "../../../web/dist")].find(existsSync);

async function main() {
  if (!config.databaseUrl) throw new Error("Defina DATABASE_URL");
  await migrate();

  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" }, trustProxy: true });

  app.get("/health", async () => ({ ok: true }));

  setupBot();
  if (config.botToken) {
    await initBot();
    app.post(
      "/telegram/webhook",
      webhookCallback(bot, "fastify", { secretToken: config.webhookSecret || undefined }),
    );
  }

  await app.register(routes, { prefix: "/api" });

  if (webDist) {
    await app.register(fastifyStatic, { root: webDist, maxAge: "1h", setHeaders: (res, path) => {
      if (path.endsWith("index.html")) res.header("Cache-Control", "no-cache");
    } });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/api")) return reply.code(404).send({ error: "not_found" });
      return reply.sendFile("index.html");
    });
  }

  await app.listen({ port: config.port, host: "0.0.0.0" });

  if (config.botToken) {
    if (config.publicUrl) {
      await bot.api.setWebhook(`${config.publicUrl}/telegram/webhook`, {
        secret_token: config.webhookSecret || undefined,
        allowed_updates: ["message", "inline_query", "pre_checkout_query", "callback_query"],
        drop_pending_updates: false,
      });
      app.log.info(`Webhook configurado em ${config.publicUrl}/telegram/webhook`);
    } else {
      // desenvolvimento local: long polling
      await bot.api.deleteWebhook();
      bot.start({ allowed_updates: ["message", "inline_query", "pre_checkout_query", "callback_query"] });
      app.log.info("Bot em long polling (PUBLIC_URL não definido)");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
