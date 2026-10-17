import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";

export type TgUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
};

export type AuthContext = {
  user: TgUser;
  chatInstance: string | null;
  chatType: string | null;
  startParam: string | null;
};

const MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Valida o initData enviado pelo Telegram (HMAC-SHA256 com a chave derivada do token do bot).
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string, botToken: string): AuthContext | null {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secret).update(dataCheckString).digest();
  const given = Buffer.from(hash, "hex");
  if (given.length !== computed.length || !timingSafeEqual(given, computed)) return null;

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;
  let user: TgUser;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return null;
  }
  if (!user?.id) return null;

  return {
    user,
    chatInstance: params.get("chat_instance"),
    chatType: params.get("chat_type"),
    startParam: params.get("start_param"),
  };
}

/** Lê o cabeçalho "Authorization: tma <initData>". */
export function authFromHeader(header: string | undefined): AuthContext | null {
  if (header?.startsWith("tma ")) {
    return validateInitData(header.slice(4), config.botToken);
  }
  if (config.devAuth && header?.startsWith("dev ")) {
    const id = Number(header.slice(4)) || 1;
    return {
      user: { id, first_name: `Dev ${id}`, username: `dev${id}` },
      chatInstance: "dev-group",
      chatType: "group",
      startParam: null,
    };
  }
  return null;
}
