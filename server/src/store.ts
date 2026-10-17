/**
 * Loja de Estrelas (Telegram Stars, moeda "XTR").
 * Fichas são moeda virtual sem valor monetário e sem resgate.
 */

export type Product =
  | { id: string; kind: "chips"; stars: number; chips: number; bonusPct: number; title: string; badge?: string }
  | { id: string; kind: "vip"; stars: number; days: number; title: string; chips: number }
  | { id: string; kind: "donation"; stars: number; title: string; chips: number };

export const CHIP_PACKS: Product[] = [
  { id: "pack_15", kind: "chips", stars: 15, chips: 5_000, bonusPct: 0, title: "Punhado de Fichas" },
  { id: "pack_50", kind: "chips", stars: 50, chips: 20_000, bonusPct: 20, title: "Saco de Fichas" },
  { id: "pack_150", kind: "chips", stars: 150, chips: 70_000, bonusPct: 40, title: "Cofre Estelar", badge: "Mais vendido" },
  { id: "pack_500", kind: "chips", stars: 500, chips: 260_000, bonusPct: 56, title: "Tesouro do Oráculo" },
  { id: "pack_1500", kind: "chips", stars: 1500, chips: 900_000, bonusPct: 80, title: "Galáxia de Fichas", badge: "Melhor valor" },
  { id: "pack_5000", kind: "chips", stars: 5000, chips: 3_500_000, bonusPct: 110, title: "Baleia Cósmica" },
];

export const VIP: Product = { id: "vip_30", kind: "vip", stars: 250, days: 30, title: "Passe Estelar VIP · 30 dias", chips: 50_000 };

export const DONATION_AMOUNTS = [1, 10, 50, 100, 250, 500, 1000, 2500];
/** Cada estrela doada rende fichas como agradecimento. */
export const DONATION_CHIPS_PER_STAR = 200;

export const VIP_BONUS_MULT = 5;
export const FIRST_PURCHASE_MULT = 2;
export const DAILY_DEAL_BONUS = 0.5;

/** Oferta do dia: um pacote fixo por data (UTC-3), com +50%. Troca à meia-noite de Brasília. */
export function dailyDeal(now = new Date()) {
  const br = new Date(now.getTime() - 3 * 3600_000);
  const day = Math.floor(br.getTime() / 86_400_000);
  const candidates = CHIP_PACKS.slice(1, 5);
  const pack = candidates[day % candidates.length];
  const nextMidnightBr = (day + 1) * 86_400_000 + 3 * 3600_000;
  return { packId: pack.id, endsAt: nextMidnightBr, dayKey: String(day) };
}

export const SUPPORTER_TIERS = [
  { name: "Diamante", min: 2500 },
  { name: "Ouro", min: 500 },
  { name: "Prata", min: 100 },
  { name: "Bronze", min: 1 },
];

export function supporterTier(stars: number) {
  return SUPPORTER_TIERS.find((t) => stars >= t.min)?.name ?? null;
}

export function findProduct(id: string): Product | null {
  if (id === VIP.id) return VIP;
  const pack = CHIP_PACKS.find((p) => p.id === id);
  if (pack) return pack;
  const m = /^donate_(\d+)$/.exec(id);
  if (m) {
    const stars = Number(m[1]);
    if (stars >= 1 && stars <= 10_000) {
      return { id, kind: "donation", stars, title: `Doação de ${stars} ⭐`, chips: stars * DONATION_CHIPS_PER_STAR };
    }
  }
  return null;
}
