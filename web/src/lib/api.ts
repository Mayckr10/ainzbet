import { initData, inTelegram } from "./tg";

export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

function authHeader() {
  if (inTelegram) return `tma ${initData()}`;
  // modo desenvolvimento no navegador (servidor precisa de DEV_AUTH=1)
  const id = new URLSearchParams(location.search).get("dev") ?? localStorage.getItem("devUser") ?? "1";
  return `dev ${id}`;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { Authorization: authHeader(), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "http_error", data.message ?? "Falha de conexão");
  return data as T;
}

export const api = {
  get: <T = any>(path: string) => request<T>("GET", path),
  post: <T = any>(path: string, body: unknown = {}) => request<T>("POST", path, body),
};

export const MESSAGES: Record<string, string> = {
  insufficient_balance: "Saldo insuficiente",
  invalid_bet: "Aposta inválida",
  session_active: "Termine a rodada em andamento",
  rate_limited: "Muitas jogadas por segundo",
  unauthorized: "Abra o cassino pelo Telegram",
};
