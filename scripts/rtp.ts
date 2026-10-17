/**
 * Confere o RTP (retorno ao jogador) de cada jogo.
 * Uso: npm run rtp
 */
import { Rng } from "../server/src/fair.js";
import {
  KENO_TABLE, kenoHitProb, PLINKO_TABLES, SCRATCH_TIERS, bingo, baccarat,
} from "../server/src/games/simple.js";
import { WHEELS, CLASSIC, CLASSIC_STRIPS, evalClassic, playFruit, FRUIT_STRIPS } from "../server/src/games/slots.js";

class FastRng extends Rng {
  constructor() {
    super("x", "y", 0);
  }
  override float() {
    return Math.random();
  }
}
const rng = new FastRng();
const pct = (x: number) => (x * 100).toFixed(2) + "%";
const only = process.argv[2];

function binom(n: number, k: number) {
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

if (!only || only === "keno") {
  console.log("\n== Keno (exato)");
  for (let p = 1; p <= 10; p++) {
    const ev = KENO_TABLE[p].reduce((s, m, h) => s + m * kenoHitProb(p, h), 0);
    console.log(`  ${p} números: RTP ${pct(ev)}  tabela ${JSON.stringify(KENO_TABLE[p])}`);
  }
}

if (!only || only === "plinko") {
  console.log("\n== Plinko (exato)");
  for (const [k, t] of Object.entries(PLINKO_TABLES)) {
    const n = t.length - 1;
    const ev = t.reduce((s, m, i) => s + (m * binom(n, i)) / 2 ** n, 0);
    console.log(`  ${k.padEnd(10)} RTP ${pct(ev)}`);
  }
}

if (!only || only === "scratch") {
  const ev = SCRATCH_TIERS.reduce((s, t) => s + t.mult * t.p, 0);
  const hit = SCRATCH_TIERS.reduce((s, t) => s + t.p, 0);
  console.log(`\n== Raspadinha (exato): RTP ${pct(ev)}  chance de prêmio ${pct(hit)}`);
}

if (!only || only === "classic") {
  let sum = 0;
  let hits = 0;
  const [a, b, c] = CLASSIC_STRIPS;
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++)
      for (let k = 0; k < c.length; k++) {
        const g = [
          [a[i], a[(i + 1) % a.length], a[(i + 2) % a.length]],
          [b[j], b[(j + 1) % b.length], b[(j + 2) % b.length]],
          [c[k], c[(k + 1) % c.length], c[(k + 2) % c.length]],
        ];
        const { lineMultSum } = evalClassic(g);
        sum += lineMultSum / CLASSIC.lines.length;
        if (g.every((col) => col.includes(0))) sum += wheelEV();
        if (lineMultSum > 0) hits++;
      }
  const n = a.length * b.length * c.length;
  console.log(`  roda: EV ${wheelEV().toFixed(2)}x`);
  console.log(`\n== Clássico (exato, ${a.length}/${b.length}/${c.length} posições): RTP ${pct(sum / n)}  frequência de prêmio ${pct(hits / n)}`);
}

if (!only || only === "fruit") {
  const N = Number(process.argv[3] ?? 1_000_000);
  let sum = 0;
  let hits = 0;
  let fs = 0;
  let baseSum = 0;
  let max = 0;
  for (let i = 0; i < N; i++) {
    const r = playFruit(rng);
    sum += r.multiplier;
    baseSum += r.base.multiplier;
    if (r.multiplier > 0) hits++;
    if (r.free.length) fs++;
    if (r.multiplier > max) max = r.multiplier;
  }
  let buySum = 0;
  const NB = Math.floor(N / 20);
  for (let i = 0; i < NB; i++) buySum += playFruit(rng, true).multiplier;
  console.log(`  compra de bônus: média ${(buySum / NB).toFixed(1)}x -> preço justo a 96.5% = ${(buySum / NB / 0.965).toFixed(0)}x`);
  console.log(`\n== Frutas (simulação ${N}): RTP ${pct(sum / N)}  (base ${pct(baseSum / N)})  freq ${pct(hits / N)}  giros grátis 1 a cada ${(N / fs).toFixed(0)}  máx ${max.toFixed(1)}x  fitas ${FRUIT_STRIPS.map((s) => s.length)}`);
}

if (!only || only === "bingo") {
  const N = 200_000;
  let sum = 0;
  let hits = 0;
  const dist: Record<number, number> = {};
  for (let i = 0; i < N; i++) {
    const card: number[] = [];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) card.push(0);
    for (let c = 0; c < 5; c++) {
      const nums = rng.pickUnique(15, 5).map((x) => x + 1 + c * 15);
      for (let r = 0; r < 5; r++) card[r * 5 + c] = nums[r];
    }
    card[12] = 0;
    const { result, payout } = bingo.play(rng, { card }, 100);
    const lines = (result as any).lines.length;
    dist[lines] = (dist[lines] ?? 0) + 1;
    sum += payout / 100;
    if (payout) hits++;
  }
  console.log(`\n== Bingo (simulação ${N}): RTP ${pct(sum / N)}  freq ${pct(hits / N)}  linhas ${JSON.stringify(dist)}`);
}

if (!only || only === "baccarat") {
  const N = 500_000;
  const t = { player: 0, banker: 0, tie: 0, pp: 0 };
  for (let i = 0; i < N; i++) {
    const { result } = baccarat.play(rng, { bets: { player: 1 } }, 1) as any;
    t[result.winner as "player"]++;
    if (result.player[0] % 13 === result.player[1] % 13) t.pp++;
  }
  const P = t.player / N, B = t.banker / N, T = t.tie / N;
  console.log(`\n== Bacará: jogador ${pct(P * 2 + T)} | banca ${pct(B * 1.95 + T)} | empate ${pct(T * 9)} | par ${pct((t.pp / N) * 12)}`);
}

function wheelEV(level = 0): number {
  const w = WHEELS[level];
  return w.reduce((s, v) => s + (v === -1 ? wheelEV(level + 1) : v), 0) / w.length;
}

import { lcSpin, lcPick, emptyLcState, LC_PAY_SCALE } from "../server/src/games/luckycards.js";
if (!only || only === "cosmic") {
  if (process.argv[4]) LC_PAY_SCALE.value = Number(process.argv[4]);
  const N = Number(process.argv[3] ?? 500_000);
  let state = emptyLcState();
  let paid = 0, staked = 0, baseSpins = 0, fsTriggers = 0, bonusTriggers = 0, max = 0, fsWin = 0, bonusWin = 0, hits = 0;
  while (baseSpins < N) {
    if (state.bonus) {
      const opts = [0,1,2,3,4,5,6,7,8].filter((i) => !state.bonus!.picks.includes(i));
      const out = lcPick(state, opts[Math.floor(Math.random() * opts.length)]);
      state = out.state;
      if (out.done) { paid += out.total.multiplier; bonusWin += out.total.multiplier; }
      continue;
    }
    const free = !!state.free && state.free.left > 0;
    const { state: s, result } = lcSpin(rng, state);
    state = s;
    if (!free) { staked += 1; baseSpins++; if (result.multiplier > 0) hits++; if (result.freeSpinsWon) fsTriggers++; } else fsWin += result.multiplier;
    if (result.bonusTriggered) bonusTriggers++;
    paid += result.multiplier;
    if (result.multiplier > max) max = result.multiplier;
  }
  console.log(`\n== Oráculo Cósmico (simulação ${N}): RTP ${pct(paid / staked)}  freq ${pct(hits / N)}  giros grátis 1/${(N / fsTriggers).toFixed(0)} (${pct(fsWin / staked)})  bônus 1/${(N / bonusTriggers).toFixed(0)} (${pct(bonusWin / staked)})  máx ${max.toFixed(1)}x`);
}
