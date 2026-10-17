export const fmt = (n: number) => Math.floor(n).toLocaleString("pt-BR");

export const fmtCompact = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(n >= 10_000_000_000 ? 0 : 1).replace(".", ",") + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + "M";
  if (n >= 10_000) return (n / 1000).toFixed(n >= 100_000 ? 0 : 1).replace(".", ",") + "K";
  return fmt(n);
};

export const fmtMult = (m: number) =>
  m >= 1000 ? `${fmt(m)}x` : `${m.toFixed(2).replace(".", ",")}x`;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function timeLeft(ts: number) {
  const s = Math.max(0, Math.floor((ts - Date.now()) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}:${String(sec).padStart(2, "0")}`;
}

export const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");
