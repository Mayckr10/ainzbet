import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authFromHeader, type AuthContext } from "./auth.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import { GameError } from "./games/types.js";
import { GAME_NAMES } from "./games/registry.js";
import { KENO_TABLE, PLINKO_TABLES, SCRATCH_TIERS, BINGO_PAYS, BINGO_BLACKOUT, BINGO_DRAWS, DICE_MULT } from "./games/simple.js";
import { CLASSIC, WHEELS, FRUIT, MAX_WIN } from "./games/slots.js";
import { LC, LC_PAYS, LC_SYMBOLS } from "./games/luckycards.js";
import { TOWER_MODES, TOWER_LEVELS, VP_PAYS } from "./games/sessions.js";
import * as svc from "./service.js";
import { CHIP_PACKS, VIP, DONATION_AMOUNTS, DONATION_CHIPS_PER_STAR, dailyDeal, SUPPORTER_TIERS, VIP_BONUS_MULT, FIRST_PURCHASE_MULT, DAILY_DEAL_BONUS } from "./store.js";
import { createInvoice, prepareShare } from "./bot.js";

declare module "fastify" {
  interface FastifyRequest {
    auth: AuthContext;
  }
}

/** Limite simples de requisições por usuário (evita spam de apostas). */
const hits = new Map<number, number[]>();
function rateLimited(userId: number) {
  const now = Date.now();
  const arr = (hits.get(userId) ?? []).filter((t) => now - t < 1000);
  arr.push(now);
  hits.set(userId, arr);
  return arr.length > 12;
}
setInterval(() => hits.clear(), 60_000).unref();

const fmt = (n: number) => Math.floor(n).toLocaleString("pt-BR");
const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

export async function routes(app: FastifyInstance) {
  app.addHook("preHandler", async (req: FastifyRequest, reply: FastifyReply) => {
    const auth = authFromHeader(req.headers.authorization);
    if (!auth) return reply.code(401).send({ error: "unauthorized", message: "Abra pelo Telegram" });
    if (req.method === "POST" && rateLimited(auth.user.id)) return reply.code(429).send({ error: "rate_limited", message: "Calma! Muitas jogadas por segundo." });
    req.auth = auth;
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof GameError) return reply.code(400).send({ error: err.code, message: err.message });
    console.error(err);
    return reply.code(500).send({ error: "internal", message: "Erro interno" });
  });

  app.get("/me", async (req) => ({ user: await svc.getMe(req.auth), context: { chatType: req.auth.chatType, inGroup: !!req.auth.chatInstance, startParam: req.auth.startParam } }));

  app.get("/config", async () => ({
    games: GAME_NAMES,
    dice: DICE_MULT,
    keno: KENO_TABLE,
    plinko: PLINKO_TABLES,
    scratch: SCRATCH_TIERS,
    bingo: { pays: BINGO_PAYS, blackout: BINGO_BLACKOUT, draws: BINGO_DRAWS },
    classic: { pays: CLASSIC.pays, anyBar: CLASSIC.anyBar, cherry2: CLASSIC.cherry2, cherry1: CLASSIC.cherry1, lines: CLASSIC.lines, wheels: WHEELS },
    fruit: { pays: FRUIT.pays, scatterPays: FRUIT.scatterPays, freeSpinsFor: FRUIT.freeSpinsFor, lines: FRUIT.lines, wildMults: FRUIT.wildMults, buyPrice: FRUIT.buyPrice },
    cosmic: { pays: LC_PAYS, symbols: LC_SYMBOLS, rules: LC },
    tower: { modes: TOWER_MODES, levels: TOWER_LEVELS },
    videopoker: VP_PAYS,
    maxWin: MAX_WIN,
  }));

  app.post<{ Body: { kind: "daily" | "rescue" } }>("/bonus", async (req) => ({ user: await svc.claimBonus(req.auth, req.body?.kind === "rescue" ? "rescue" : "daily") }));

  app.post<{ Params: { game: string }; Body: { bet: number; params: any } }>("/play/:game", async (req) =>
    svc.playInstant(req.auth, req.params.game, req.body?.bet, req.body?.params ?? {}),
  );

  app.post<{ Params: { game: string }; Body: { bet: number; params: any } }>("/session/:game/start", async (req) =>
    svc.startSession(req.auth, req.params.game, req.body?.bet, req.body?.params ?? {}),
  );
  app.get<{ Params: { game: string } }>("/session/:game/active", async (req) => ({ active: await svc.activeSession(req.auth, req.params.game) }));
  app.post<{ Params: { id: string }; Body: { action: string; payload: any } }>("/session/:id/action", async (req) =>
    svc.sessionAction(req.auth, Number(req.params.id), String(req.body?.action ?? ""), req.body?.payload ?? {}),
  );

  app.get("/cosmic/state", async (req) => ({ machine: await svc.machineState(req.auth) }));
  app.post<{ Body: { bet: number } }>("/cosmic/spin", async (req) => svc.machineSpin(req.auth, req.body?.bet));
  app.post<{ Body: { index: number } }>("/cosmic/pick", async (req) => svc.machinePick(req.auth, Number(req.body?.index)));

  app.get<{ Querystring: { game?: string } }>("/history", async (req) => ({ rounds: await svc.history(req.auth, req.query.game) }));
  app.get("/feed", async () => ({ wins: await svc.recentWins() }));
  app.get<{ Querystring: { scope?: string } }>("/leaderboard", async (req) => svc.leaderboard(req.auth, req.query.scope ?? "global"));

  app.post<{ Body: { clientSeed?: string } }>("/fair/rotate", async (req) =>
    req.body?.clientSeed ? svc.setClientSeed(req.auth, req.body.clientSeed) : svc.rotateSeed(req.auth),
  );
  app.get("/fair/revealed", async (req) => ({ seeds: await svc.revealedSeeds(req.auth) }));
  app.get<{ Params: { id: string } }>("/fair/round/:id", async (req) => svc.verifyRound(req.auth, Number(req.params.id)));

  /* ---------------- Loja de Estrelas */
  app.get("/store", async (req) => {
    const me = await svc.getMe(req.auth);
    const deal = dailyDeal();
    return {
      packs: CHIP_PACKS,
      vip: VIP,
      vipBonusMult: VIP_BONUS_MULT,
      donations: DONATION_AMOUNTS,
      donationChipsPerStar: DONATION_CHIPS_PER_STAR,
      firstPurchaseMult: FIRST_PURCHASE_MULT,
      deal: { ...deal, bonus: DAILY_DEAL_BONUS, claimed: me.store.dealClaimedToday },
      tiers: SUPPORTER_TIERS,
      me: { firstPurchase: me.store.firstPurchase, vip: me.vip, supporter: me.supporter },
    };
  });

  app.post<{ Body: { productId: string } }>("/store/invoice", async (req) => {
    if (!config.botToken) throw new GameError("store_offline", "Loja indisponível no modo de desenvolvimento");
    const q = await svc.quote(req.auth, String(req.body?.productId ?? ""));
    const link = await createInvoice(q.product.id, q.chips);
    return { link, chips: q.chips, notes: q.notes };
  });

  /* ---------------- Compartilhar no grupo */
  app.post<{ Body: { roundId?: number; text?: string } }>("/share", async (req) => {
    if (!config.botToken) throw new GameError("share_offline", "Compartilhar exige o bot configurado");
    const name = esc(req.auth.user.first_name);
    let text = `🔮 <b>${name}</b> está jogando no AinzBet!`;
    if (req.body?.roundId) {
      const r = await pool.query("SELECT game, bet, payout, params FROM rounds WHERE id = $1 AND user_id = $2 AND status = 'done'", [req.body.roundId, req.auth.user.id]);
      const row = r.rows[0];
      if (!row) throw new GameError("not_found");
      const base = Number(row.params?.bet ?? row.bet) || 1;
      const mult = row.payout / base;
      text =
        `🎉 <b>${name}</b> ganhou <b>${fmt(row.payout)} fichas</b>` +
        (mult >= 1.5 ? ` (<b>${mult >= 100 ? fmt(mult) : mult.toFixed(2)}x</b>)` : "") +
        ` no <b>${GAME_NAMES[row.game] ?? row.game}</b>!`;
    }
    return { id: await prepareShare(req.auth.user.id, text) };
  });
}
