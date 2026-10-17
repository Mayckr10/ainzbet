import type { Rng } from "../fair.js";

export class GameError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
  }
}

export function assert(cond: unknown, code = "invalid_params", msg?: string): asserts cond {
  if (!cond) throw new GameError(code, msg);
}

/** Jogo resolvido em uma única chamada (dados, roleta, slots...). */
export type InstantGame = {
  kind: "instant";
  /** Valida os parâmetros e devolve o valor total apostado. */
  totalBet(params: any, bet: number): number;
  play(rng: Rng, params: any, bet: number): { payout: number; result: unknown };
};

export type SessionStep = {
  state: any;
  /** O que o cliente pode ver agora (sem segredos enquanto a rodada está ativa). */
  view: unknown;
  done: boolean;
  /** Valor total pago ao jogador (só quando done). */
  payout?: number;
  /** Aposta adicional a debitar nesta ação (dobrar, dividir, call...). */
  extraBet?: number;
};

/** Jogo com várias etapas (blackjack, mines, crash...). */
export type SessionGame = {
  kind: "session";
  totalBet(params: any, bet: number): number;
  start(rng: Rng, params: any, bet: number): SessionStep;
  action(state: any, action: string, payload: any, ctx: { bet: number; balance: number }): SessionStep;
};

export type Game = InstantGame | SessionGame;

export const floorPay = (x: number) => Math.max(0, Math.floor(x + 1e-9));
