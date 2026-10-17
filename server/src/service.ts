import type { AuthContext, TgUser } from "./auth.js";
import { config } from "./config.js";
import { tx, pool, type Tx } from "./db.js";
import { notifyAdmin } from "./notify.js";
import { newClientSeed, newServerSeed, Rng, sha256 } from "./fair.js";
import { GAMES } from "./games/registry.js";
import { GameError } from "./games/types.js";
import { emptyLcState, lcPick, lcSpin, type LcState } from "./games/luckycards.js";
import { dailyDeal, FIRST_PURCHASE_MULT, DAILY_DEAL_BONUS, findProduct, supporterTier, VIP_BONUS_MULT } from "./store.js";

export type UserRow = {
  id: number;
  first_name: string;
  username: string | null;
  photo_url: string | null;
  balance: number;
  last_bonus: Date | null;
  last_rescue: Date | null;
  server_seed: string;
  server_seed_hash: string;
  client_seed: string;
  nonce: number;
  total_wagered: number;
  total_won: number;
  rounds_played: number;
  biggest_win: number;
  vip_until: Date | null;
  stars_spent: number;
  stars_donated: number;
  first_purchase_done: boolean;
  last_deal_day: string | null;
};

const DAY = 24 * 3600_000;
const RESCUE_COOLDOWN = 3600_000;

/* ------------------------------------------------------------------ usuários */

/** Cria (se preciso) e trava a linha do usuário para a transação atual. */
export async function lockUser(c: Tx, u: TgUser, ctx?: AuthContext): Promise<UserRow> {
  const found = await c.query<UserRow>("SELECT * FROM users WHERE id = $1 FOR UPDATE", [u.id]);
  if (found.rows[0]) {
    const row = found.rows[0];
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
    if (row.first_name !== name || row.username !== (u.username ?? null) || row.photo_url !== (u.photo_url ?? null)) {
      await c.query("UPDATE users SET first_name = $2, username = $3, photo_url = $4 WHERE id = $1", [u.id, name, u.username ?? null, u.photo_url ?? null]);
    }
    return row;
  }
  const s = newServerSeed();
  const ins = await c.query<UserRow>(
    `INSERT INTO users (id, first_name, username, photo_url, balance, server_seed, server_seed_hash, client_seed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [u.id, [u.first_name, u.last_name].filter(Boolean).join(" "), u.username ?? null, u.photo_url ?? null, config.startingBalance, s.seed, s.hash, newClientSeed()],
  );
  if (!ins.rows[0]) {
    // outra requisição simultânea criou o jogador primeiro: só trava a linha (sem bônus nem aviso em dobro)
    const other = await c.query<UserRow>("SELECT * FROM users WHERE id = $1 FOR UPDATE", [u.id]);
    return other.rows[0];
  }
  await c.query("INSERT INTO transactions (user_id, amount, reason, balance_after) VALUES ($1, $2, 'welcome', $2)", [u.id, config.startingBalance]);
  // aviso de jogador novo para o administrador (só depois que a criação for confirmada)
  const total = (await c.query<{ n: number }>("SELECT count(*)::int AS n FROM users")).rows[0].n;
  c.afterCommit?.push(() => notifyNewPlayer(u, ctx, total));
  // trava a linha recém-criada
  const again = await c.query<UserRow>("SELECT * FROM users WHERE id = $1 FOR UPDATE", [u.id]);
  return again.rows[0];
}

/** Credita (valor positivo) ou debita (negativo) o saldo, registrando a transação. */
export async function moveBalance(c: Tx, userId: number, amount: number, reason: string, roundId: number | null = null) {
  if (amount === 0) {
    const r = await c.query<{ balance: number }>("SELECT balance FROM users WHERE id = $1", [userId]);
    return r.rows[0].balance;
  }
  const r = await c.query<{ balance: number }>("UPDATE users SET balance = balance + $2 WHERE id = $1 AND balance + $2 >= 0 RETURNING balance", [userId, amount]);
  if (!r.rows[0]) throw new GameError("insufficient_balance", "Saldo insuficiente");
  await c.query("INSERT INTO transactions (user_id, amount, reason, round_id, balance_after) VALUES ($1, $2, $3, $4, $5)", [userId, amount, reason, roundId, r.rows[0].balance]);
  return r.rows[0].balance;
}

async function nextRng(c: Tx, user: UserRow) {
  const r = await c.query<{ nonce: number }>("UPDATE users SET nonce = nonce + 1 WHERE id = $1 RETURNING nonce", [user.id]);
  const nonce = r.rows[0].nonce - 1;
  return { rng: new Rng(user.server_seed, user.client_seed, nonce), nonce };
}

function isVip(u: UserRow) {
  return !!u.vip_until && new Date(u.vip_until).getTime() > Date.now();
}

export function publicUser(u: UserRow) {
  const now = Date.now();
  const bonusAt = u.last_bonus ? new Date(u.last_bonus).getTime() + DAY : 0;
  const rescueAt = u.last_rescue ? new Date(u.last_rescue).getTime() + RESCUE_COOLDOWN : 0;
  const vip = isVip(u);
  return {
    id: u.id,
    name: u.first_name,
    username: u.username,
    photo: u.photo_url,
    balance: u.balance,
    stats: { wagered: u.total_wagered, won: u.total_won, rounds: u.rounds_played, biggestWin: u.biggest_win },
    bonus: {
      daily: config.dailyBonus * (vip ? VIP_BONUS_MULT : 1),
      availableAt: bonusAt,
      available: bonusAt <= now,
      rescue: config.rescueBonus,
      rescueAvailable: u.balance < config.minBet * 100 && rescueAt <= now,
      rescueAt,
    },
    fair: { serverSeedHash: u.server_seed_hash, clientSeed: u.client_seed, nonce: u.nonce },
    vip: vip ? { until: new Date(u.vip_until!).getTime() } : null,
    supporter: { stars: u.stars_donated + u.stars_spent, tier: supporterTier(u.stars_donated + u.stars_spent) },
    store: { firstPurchase: !u.first_purchase_done, dealClaimedToday: u.last_deal_day === dailyDeal().dayKey },
    limits: { minBet: config.minBet, maxBet: config.maxBet },
  };
}

export async function getMe(auth: AuthContext) {
  return tx(async (c) => publicUser(await lockUser(c, auth.user, auth)));
}

const esc = (s: string) => s.replace(/[<>&]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[ch]!);

function notifyNewPlayer(u: TgUser, ctx: AuthContext | undefined, total: number) {
  const name = esc([u.first_name, u.last_name].filter(Boolean).join(" ") || "Sem nome");
  const where = ctx?.chatInstance
    ? `um grupo (${ctx.chatType ?? "chat"})`
    : ctx?.chatType === "sender" || ctx?.chatType === "private"
      ? "o privado"
      : "o bot";
  notifyAdmin(
    `🆕 <b>Novo jogador</b>\n\n` +
      `👤 <a href="tg://user?id=${u.id}">${name}</a>${u.username ? ` (@${esc(u.username)})` : ""}\n` +
      `🆔 <code>${u.id}</code>${u.language_code ? ` · 🌐 ${esc(u.language_code)}` : ""}${(u as any).is_premium ? " · ⭐ Premium" : ""}\n` +
      `📍 Entrou por ${where}${ctx?.startParam ? ` · link: <code>${esc(ctx.startParam)}</code>` : ""}\n\n` +
      `👥 Total de jogadores: <b>${total.toLocaleString("pt-BR")}</b>`,
  );
}

export async function claimBonus(auth: AuthContext, kind: "daily" | "rescue") {
  return tx(async (c) => {
    const u = await lockUser(c, auth.user);
    const pu = publicUser(u);
    if (kind === "daily") {
      if (!pu.bonus.available) throw new GameError("bonus_cooldown", "Bônus diário ainda não disponível");
      await c.query("UPDATE users SET last_bonus = now() WHERE id = $1", [u.id]);
      await moveBalance(c, u.id, pu.bonus.daily, "daily_bonus");
    } else {
      if (!pu.bonus.rescueAvailable) throw new GameError("bonus_cooldown", "Resgate indisponível");
      await c.query("UPDATE users SET last_rescue = now() WHERE id = $1", [u.id]);
      await moveBalance(c, u.id, config.rescueBonus, "rescue_bonus");
    }
    const fresh = await c.query<UserRow>("SELECT * FROM users WHERE id = $1", [u.id]);
    return publicUser(fresh.rows[0]);
  });
}

/* ------------------------------------------------------------------ apostas */

function checkBet(bet: unknown): number {
  if (!Number.isInteger(bet) || (bet as number) < config.minBet) throw new GameError("invalid_bet", `Aposta mínima: ${config.minBet}`);
  return bet as number;
}

function checkTotal(total: number) {
  if (!Number.isInteger(total) || total < config.minBet) throw new GameError("invalid_bet", `Aposta mínima: ${config.minBet}`);
  if (total > config.maxBet) throw new GameError("invalid_bet", `Aposta máxima: ${config.maxBet.toLocaleString("pt-BR")}`);
}

async function finishRound(c: Tx, user: UserRow, roundId: number, game: string, totalBet: number, payout: number, chatInstance: string | null) {
  payout = Math.min(payout, config.maxPayout);
  if (payout > 0) await moveBalance(c, user.id, payout, "win", roundId);
  await c.query("UPDATE rounds SET status = 'done', payout = $2, finished_at = now() WHERE id = $1", [roundId, payout]);
  await c.query(
    `UPDATE users SET total_wagered = total_wagered + $2, total_won = total_won + $3, rounds_played = rounds_played + 1,
       biggest_win = GREATEST(biggest_win, $3) WHERE id = $1`,
    [user.id, totalBet, payout],
  );
  if (chatInstance) {
    await c.query(
      `INSERT INTO group_stats (chat_instance, user_id, wagered, profit, biggest_win, plays)
       VALUES ($1, $2, $3, $4, $5, 1)
       ON CONFLICT (chat_instance, user_id) DO UPDATE SET
         wagered = group_stats.wagered + EXCLUDED.wagered,
         profit = group_stats.profit + EXCLUDED.profit,
         biggest_win = GREATEST(group_stats.biggest_win, EXCLUDED.biggest_win),
         plays = group_stats.plays + 1, updated_at = now()`,
      [chatInstance, user.id, totalBet, payout - totalBet, payout],
    );
  }
  return payout;
}

async function balanceOf(c: Tx, id: number) {
  const r = await c.query<{ balance: number }>("SELECT balance FROM users WHERE id = $1", [id]);
  return r.rows[0].balance;
}

/** Jogos de rodada única. */
export async function playInstant(auth: AuthContext, game: string, betRaw: unknown, params: any) {
  const g = GAMES[game];
  if (!g || g.kind !== "instant") throw new GameError("unknown_game");
  return tx(async (c) => {
    const user = await lockUser(c, auth.user);
    const bet = checkBet(betRaw);
    const total = g.totalBet(params, bet);
    checkTotal(total);
    if (user.balance < total) throw new GameError("insufficient_balance", "Saldo insuficiente");
    const { rng, nonce } = await nextRng(c, user);
    const out = g.play(rng, params, bet);
    const r = await c.query<{ id: number }>(
      `INSERT INTO rounds (user_id, game, status, bet, params, result, server_seed_hash, client_seed, nonce, chat_instance)
       VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [user.id, game, total, params ?? {}, out.result, user.server_seed_hash, user.client_seed, nonce, auth.chatInstance],
    );
    const roundId = r.rows[0].id;
    await moveBalance(c, user.id, -total, "bet", roundId);
    const payout = await finishRound(c, user, roundId, game, total, out.payout, auth.chatInstance);
    return { roundId, bet: total, payout, result: out.result, balance: await balanceOf(c, user.id), nonce };
  });
}

/* ------------------------------------------------------------------ jogos com etapas */

type RoundRow = { id: number; user_id: number; game: string; status: string; bet: number; state: any; result: any; chat_instance: string | null; nonce: number };

export async function startSession(auth: AuthContext, game: string, betRaw: unknown, params: any) {
  const g = GAMES[game];
  if (!g || g.kind !== "session") throw new GameError("unknown_game");
  return tx(async (c) => {
    const user = await lockUser(c, auth.user);
    const active = await c.query<RoundRow>("SELECT * FROM rounds WHERE user_id = $1 AND game = $2 AND status = 'active' FOR UPDATE", [user.id, game]);
    if (active.rows[0]) {
      if (game === "crash") {
        // fecha a rodada anterior de crash (o tempo já correu)
        await actOnRound(c, user, active.rows[0], "poll", {});
      } else {
        throw new GameError("session_active", "Termine a rodada em andamento");
      }
    }
    const bet = checkBet(betRaw);
    const total = g.totalBet(params, bet);
    checkTotal(total);
    const balance = await balanceOf(c, user.id);
    if (balance < total) throw new GameError("insufficient_balance", "Saldo insuficiente");
    const { rng, nonce } = await nextRng(c, user);
    const step = g.start(rng, params, bet);
    const r = await c.query<{ id: number }>(
      `INSERT INTO rounds (user_id, game, status, bet, params, state, result, server_seed_hash, client_seed, nonce, chat_instance)
       VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [user.id, game, total, { ...(params ?? {}), bet }, step.state, step.view, user.server_seed_hash, user.client_seed, nonce, auth.chatInstance],
    );
    const roundId = r.rows[0].id;
    await moveBalance(c, user.id, -total, "bet", roundId);
    let payout = 0;
    if (step.done) payout = await finishRound(c, user, roundId, game, total, step.payout ?? 0, auth.chatInstance);
    return { roundId, bet: total, done: step.done, payout, view: step.view, balance: await balanceOf(c, user.id), nonce };
  });
}

async function actOnRound(c: Tx, user: UserRow, round: RoundRow, action: string, payload: any) {
  const g = GAMES[round.game];
  if (!g || g.kind !== "session") throw new GameError("unknown_game");
  const balance = await balanceOf(c, user.id);
  const baseBet = Number((await c.query<{ b: number }>("SELECT (params->>'bet')::bigint AS b FROM rounds WHERE id = $1", [round.id])).rows[0].b) || round.bet;
  const step = g.action(round.state, action, payload, { bet: baseBet, balance });
  let total = round.bet;
  if (step.extraBet) {
    await moveBalance(c, user.id, -step.extraBet, "bet", round.id);
    total += step.extraBet;
  }
  await c.query("UPDATE rounds SET state = $2, result = $3, bet = $4 WHERE id = $1", [round.id, step.state, step.view, total]);
  let payout = 0;
  if (step.done) payout = await finishRound(c, user, round.id, round.game, total, step.payout ?? 0, round.chat_instance);
  return { roundId: round.id, bet: total, done: step.done, payout, view: step.view, balance: await balanceOf(c, user.id) };
}

export async function sessionAction(auth: AuthContext, roundId: number, action: string, payload: any) {
  return tx(async (c) => {
    const user = await lockUser(c, auth.user);
    const r = await c.query<RoundRow>("SELECT * FROM rounds WHERE id = $1 AND user_id = $2 FOR UPDATE", [roundId, user.id]);
    const round = r.rows[0];
    if (!round) throw new GameError("not_found");
    if (round.status !== "active") throw new GameError("round_finished");
    return actOnRound(c, user, round, action, payload);
  });
}

export async function activeSession(auth: AuthContext, game: string) {
  const r = await pool.query<RoundRow>("SELECT id, bet, result, status FROM rounds WHERE user_id = $1 AND game = $2 AND status = 'active' ORDER BY id DESC LIMIT 1", [auth.user.id, game]);
  const row = r.rows[0];
  return row ? { roundId: row.id, bet: row.bet, view: row.result } : null;
}

/* ------------------------------------------------------------------ Oráculo Cósmico (estado persistente) */

async function loadMachine(c: Tx, userId: number, game: string): Promise<LcState> {
  const r = await c.query<{ state: LcState }>("SELECT state FROM user_game_state WHERE user_id = $1 AND game = $2 FOR UPDATE", [userId, game]);
  return r.rows[0]?.state ?? emptyLcState();
}
async function saveMachine(c: Tx, userId: number, game: string, state: LcState) {
  await c.query(
    `INSERT INTO user_game_state (user_id, game, state) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, game) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    [userId, game, state],
  );
}

function machineView(s: LcState) {
  return {
    queenMult: s.queenMult,
    nextWilds: s.nextWilds,
    free: s.free,
    bonus: s.bonus ? { picks: s.bonus.picks, revealed: s.bonus.picks.map((i) => ({ index: i, prize: s.bonus!.cards[i] })), bet: s.bonus.bet } : null,
  };
}

export async function machineState(auth: AuthContext) {
  return tx(async (c) => {
    const user = await lockUser(c, auth.user);
    return machineView(await loadMachine(c, user.id, "cosmic"));
  });
}

export async function machineSpin(auth: AuthContext, betRaw: unknown) {
  return tx(async (c) => {
    const user = await lockUser(c, auth.user);
    const prev = await loadMachine(c, user.id, "cosmic");
    const isFree = !!prev.free && prev.free.left > 0;
    const bet = isFree ? prev.free!.bet : checkBet(betRaw);
    if (!isFree) {
      checkTotal(bet);
      if (user.balance < bet) throw new GameError("insufficient_balance", "Saldo insuficiente");
    }
    const { rng, nonce } = await nextRng(c, user);
    const { state, result } = lcSpin(rng, prev);
    // registra a aposta-base em giros grátis e bônus recém-ativados
    if (state.free && !state.free.bet) state.free.bet = bet;
    if (state.bonus && !state.bonus.bet) state.bonus.bet = bet;
    if (result.free && !result.free.bet) result.free.bet = bet;
    const stake = isFree ? 0 : bet;
    const r = await c.query<{ id: number }>(
      `INSERT INTO rounds (user_id, game, status, bet, params, result, server_seed_hash, client_seed, nonce, chat_instance)
       VALUES ($1, 'cosmic', 'active', $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [user.id, stake, { bet, free: isFree }, result, user.server_seed_hash, user.client_seed, nonce, auth.chatInstance],
    );
    const roundId = r.rows[0].id;
    if (stake) await moveBalance(c, user.id, -stake, "bet", roundId);
    const payout = await finishRound(c, user, roundId, "cosmic", stake, Math.floor(bet * result.multiplier + 1e-9), auth.chatInstance);
    await saveMachine(c, user.id, "cosmic", state);
    return { roundId, bet, payout, result, machine: machineView(state), balance: await balanceOf(c, user.id), nonce };
  });
}

export async function machinePick(auth: AuthContext, index: number) {
  return tx(async (c) => {
    const user = await lockUser(c, auth.user);
    const prev = await loadMachine(c, user.id, "cosmic");
    const bet = prev.bonus?.bet ?? 0;
    const out = lcPick(prev, index);
    let payout = 0;
    let roundId: number | null = null;
    if (out.done) {
      if (out.state.free && !out.state.free.bet) out.state.free.bet = bet;
      const r = await c.query<{ id: number }>(
        `INSERT INTO rounds (user_id, game, status, bet, params, result, server_seed_hash, client_seed, nonce, chat_instance)
         VALUES ($1, 'cosmic', 'active', 0, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [user.id, { bet, bonus: true }, { bonus: out }, user.server_seed_hash, user.client_seed, user.nonce, auth.chatInstance],
      );
      roundId = r.rows[0].id;
      payout = await finishRound(c, user, roundId, "cosmic", 0, Math.floor(bet * out.total.multiplier), auth.chatInstance);
    }
    await saveMachine(c, user.id, "cosmic", out.state);
    return { ...out, payout, roundId, machine: machineView(out.state), balance: await balanceOf(c, user.id) };
  });
}

/* ------------------------------------------------------------------ histórico, ranking, feed */

export async function history(auth: AuthContext, game?: string, limit = 30) {
  const r = await pool.query(
    `SELECT id, game, bet, payout, result, params, server_seed_hash, client_seed, nonce, created_at
     FROM rounds WHERE user_id = $1 AND status = 'done' ${game ? "AND game = $3" : ""}
     ORDER BY id DESC LIMIT $2`,
    game ? [auth.user.id, Math.min(limit, 100), game] : [auth.user.id, Math.min(limit, 100)],
  );
  return r.rows;
}

export async function recentWins() {
  const r = await pool.query(
    `SELECT r.id, r.game, r.bet, r.payout, u.first_name AS name, u.vip_until > now() AS vip
     FROM rounds r JOIN users u ON u.id = r.user_id
     WHERE r.status = 'done' AND r.payout > 0 AND r.payout >= GREATEST(r.bet, 1) * 3
     ORDER BY r.id DESC LIMIT 25`,
  );
  return r.rows;
}

export async function leaderboard(auth: AuthContext, scope: string) {
  if (scope === "group") {
    if (!auth.chatInstance) return { scope, rows: [], note: "Abra o cassino a partir de um grupo para ver o ranking do grupo." };
    const r = await pool.query(
      `SELECT u.id, u.first_name AS name, u.photo_url AS photo, g.profit AS value, g.biggest_win, g.plays,
              u.vip_until > now() AS vip, (u.stars_donated + u.stars_spent) AS stars
       FROM group_stats g JOIN users u ON u.id = g.user_id
       WHERE g.chat_instance = $1 ORDER BY g.profit DESC LIMIT 50`,
      [auth.chatInstance],
    );
    return { scope, rows: r.rows.map(withTier) };
  }
  if (scope === "supporters") {
    const r = await pool.query(
      `SELECT id, first_name AS name, photo_url AS photo, (stars_donated + stars_spent) AS value, vip_until > now() AS vip,
              (stars_donated + stars_spent) AS stars
       FROM users WHERE stars_donated + stars_spent > 0 ORDER BY value DESC LIMIT 50`,
    );
    return { scope, rows: r.rows.map(withTier) };
  }
  const r = await pool.query(
    `SELECT id, first_name AS name, photo_url AS photo, balance AS value, vip_until > now() AS vip,
            (stars_donated + stars_spent) AS stars
     FROM users ORDER BY balance DESC LIMIT 50`,
  );
  return { scope: "global", rows: r.rows.map(withTier) };
}

function withTier<T extends { stars: number }>(row: T) {
  return { ...row, tier: supporterTier(Number(row.stars)) };
}

/* ------------------------------------------------------------------ provably fair */

export async function setClientSeed(auth: AuthContext, seed: string) {
  if (typeof seed !== "string" || seed.length < 1 || seed.length > 64) throw new GameError("invalid_params", "Seed inválida");
  return rotateSeed(auth, seed.trim());
}

/** Revela o server seed atual e gera um novo (o nonce volta a 0). */
export async function rotateSeed(auth: AuthContext, newClient?: string) {
  return tx(async (c) => {
    const u = await lockUser(c, auth.user);
    const active = await c.query("SELECT 1 FROM rounds WHERE user_id = $1 AND status = 'active' LIMIT 1", [u.id]);
    const machine = await loadMachine(c, u.id, "cosmic");
    if (active.rowCount || machine.free || machine.bonus) throw new GameError("session_active", "Termine as rodadas e bônus em andamento antes de trocar a seed");
    await c.query(
      "INSERT INTO revealed_seeds (user_id, server_seed, server_seed_hash, client_seed, last_nonce) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
      [u.id, u.server_seed, u.server_seed_hash, u.client_seed, u.nonce],
    );
    const s = newServerSeed();
    await c.query("UPDATE users SET server_seed = $2, server_seed_hash = $3, client_seed = $4, nonce = 0 WHERE id = $1", [u.id, s.seed, s.hash, newClient || newClientSeed()]);
    return { revealed: { serverSeed: u.server_seed, serverSeedHash: u.server_seed_hash, clientSeed: u.client_seed, lastNonce: u.nonce }, next: { serverSeedHash: s.hash } };
  });
}

export async function revealedSeeds(auth: AuthContext) {
  const r = await pool.query("SELECT server_seed, server_seed_hash, client_seed, last_nonce, revealed_at FROM revealed_seeds WHERE user_id = $1 ORDER BY id DESC LIMIT 20", [auth.user.id]);
  return r.rows;
}

export async function verifyRound(auth: AuthContext, roundId: number) {
  const r = await pool.query("SELECT id, game, params, result, server_seed_hash, client_seed, nonce FROM rounds WHERE id = $1 AND user_id = $2", [roundId, auth.user.id]);
  const round = r.rows[0];
  if (!round) throw new GameError("not_found");
  const s = await pool.query("SELECT server_seed FROM revealed_seeds WHERE server_seed_hash = $1", [round.server_seed_hash]);
  const serverSeed = s.rows[0]?.server_seed ?? null;
  if (!serverSeed) return { round, serverSeed: null, note: "Troque a seed para revelar o server seed desta rodada." };
  const g = GAMES[round.game];
  let recomputed: unknown = null;
  let matches: boolean | null = null;
  if (g && g.kind === "instant") {
    const out = g.play(new Rng(serverSeed, round.client_seed, round.nonce), round.params, Number(round.params?.bet ?? 1));
    recomputed = out.result;
    matches = stableJson(out.result) === stableJson(round.result);
  }
  return { round, serverSeed, hashOk: sha256(serverSeed) === round.server_seed_hash, recomputed, matches };
}

/* ------------------------------------------------------------------ Loja de Estrelas */

export function priceFor(u: UserRow, productId: string) {
  const p = findProduct(productId);
  if (!p) throw new GameError("unknown_product");
  let chips = p.chips;
  const notes: string[] = [];
  if (p.kind === "chips") {
    const deal = dailyDeal();
    if (deal.packId === p.id && u.last_deal_day !== deal.dayKey) {
      chips = Math.floor(chips * (1 + DAILY_DEAL_BONUS));
      notes.push("deal");
    }
    if (!u.first_purchase_done) {
      chips *= FIRST_PURCHASE_MULT;
      notes.push("first");
    }
  }
  return { product: p, chips, notes };
}

export async function quote(auth: AuthContext, productId: string) {
  return tx(async (c) => priceFor(await lockUser(c, auth.user), productId));
}

/** Aplica um pagamento confirmado pelo Telegram (idempotente pelo charge_id). */
export async function applyPayment(user: TgUser, productId: string, stars: number, chargeId: string) {
  return tx(async (c) => {
    const u = await lockUser(c, user);
    const dup = await c.query("SELECT 1 FROM payments WHERE charge_id = $1", [chargeId]);
    if (dup.rowCount) return null;
    const { product, chips, notes } = priceFor(u, productId);
    if (product.stars !== stars) throw new Error(`valor divergente para ${productId}: ${stars} != ${product.stars}`);
    await c.query("INSERT INTO payments (charge_id, user_id, product_id, stars, chips) VALUES ($1, $2, $3, $4, $5)", [chargeId, u.id, productId, stars, chips]);
    if (chips) await moveBalance(c, u.id, chips, `stars:${productId}`);
    if (product.kind === "donation") {
      await c.query("UPDATE users SET stars_donated = stars_donated + $2 WHERE id = $1", [u.id, stars]);
    } else {
      await c.query("UPDATE users SET stars_spent = stars_spent + $2 WHERE id = $1", [u.id, stars]);
    }
    if (product.kind === "chips") {
      await c.query("UPDATE users SET first_purchase_done = true WHERE id = $1", [u.id]);
      if (notes.includes("deal")) await c.query("UPDATE users SET last_deal_day = $2 WHERE id = $1", [u.id, dailyDeal().dayKey]);
    }
    if (product.kind === "vip") {
      await c.query(
        "UPDATE users SET vip_until = GREATEST(COALESCE(vip_until, now()), now()) + make_interval(days => $2) WHERE id = $1",
        [u.id, product.days],
      );
    }
    return { product, chips };
  });
}

/* ------------------------------------------------------------------ administração */

export async function adminStats() {
  const q = (sql: string) => pool.query(sql).then((r) => Number(Object.values(r.rows[0])[0] ?? 0));
  return {
    users: await q("SELECT count(*) FROM users"),
    active24h: await q("SELECT count(DISTINCT user_id) FROM rounds WHERE created_at > now() - interval '24 hours'"),
    rounds24h: await q("SELECT count(*) FROM rounds WHERE created_at > now() - interval '24 hours'"),
    starsToday: await q("SELECT COALESCE(sum(stars),0) FROM payments WHERE NOT refunded AND created_at > date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'"),
    starsTotal: await q("SELECT COALESCE(sum(stars),0) FROM payments WHERE NOT refunded"),
    payments: await q("SELECT count(*) FROM payments WHERE product_id NOT LIKE 'donate_%'"),
    donations: await q("SELECT count(*) FROM payments WHERE product_id LIKE 'donate_%'"),
  };
}

/** Marca um pagamento como reembolsado e retira as fichas entregues (sem deixar saldo negativo). */
export async function markRefunded(chargeId: string) {
  return tx(async (c) => {
    const r = await c.query<{ user_id: number; chips: number; refunded: boolean }>("SELECT user_id, chips, refunded FROM payments WHERE charge_id = $1 FOR UPDATE", [chargeId]);
    const p = r.rows[0];
    if (!p || p.refunded) return;
    await c.query("UPDATE payments SET refunded = true WHERE charge_id = $1", [chargeId]);
    const bal = await c.query<{ balance: number }>("SELECT balance FROM users WHERE id = $1 FOR UPDATE", [p.user_id]);
    const take = Math.min(p.chips, bal.rows[0].balance);
    if (take > 0) await moveBalance(c, p.user_id, -take, "refund");
  });
}

/** JSON com chaves ordenadas (o jsonb do Postgres reordena as chaves). */
function stableJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableJson).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${stableJson((v as any)[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}
