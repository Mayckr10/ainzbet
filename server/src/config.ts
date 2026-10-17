import "dotenv/config";

function num(name: string, def: number) {
  const v = process.env[name];
  return v ? Number(v) : def;
}

export const config = {
  port: num("PORT", 3000),
  botToken: process.env.BOT_TOKEN ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  /** URL pública HTTPS do serviço (ex.: https://cassino.up.railway.app). */
  publicUrl: (process.env.PUBLIC_URL ?? "").replace(/\/$/, ""),
  /** Nome curto do Mini App criado no BotFather (/newapp). Vazio = usa o Main Mini App. */
  appShortName: process.env.APP_SHORT_NAME ?? "",
  webhookSecret: process.env.WEBHOOK_SECRET ?? "",
  /** Telegram ID do administrador: recebe avisos de compras/doações e usa /admin e /reembolso. */
  adminId: Number(process.env.ADMIN_ID ?? 0),
  /** Em desenvolvimento, permite abrir o app no navegador sem o Telegram. */
  devAuth: process.env.DEV_AUTH === "1" && process.env.NODE_ENV !== "production",
  startingBalance: num("STARTING_BALANCE", 10_000),
  dailyBonus: num("DAILY_BONUS", 1_000),
  rescueBonus: num("RESCUE_BONUS", 500),
  minBet: num("MIN_BET", 1),
  maxBet: num("MAX_BET", 100_000),
  maxPayout: num("MAX_PAYOUT", 50_000_000),
};

export function miniAppLink(startParam?: string, botUsername?: string) {
  const user = botUsername ?? "";
  const base = config.appShortName
    ? `https://t.me/${user}/${config.appShortName}`
    : `https://t.me/${user}`;
  const q = startParam ? `startapp=${encodeURIComponent(startParam)}` : "startapp";
  return `${base}?${q}`;
}
