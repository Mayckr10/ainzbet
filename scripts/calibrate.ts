/**
 * Calibra os 10 video slots para ~96% de RTP e calcula o preço justo da compra de bônus.
 * Uso: npm run calibrate   (grava server/src/games/videoslots.calib.json)
 */
import { writeFileSync } from "node:fs";
import { Rng } from "../server/src/fair.js";
import { THEMES, __internals } from "../server/src/games/videoslots.js";

class FastRng extends Rng {
  constructor() {
    super("x", "y", 0);
  }
  override float() {
    return Math.random();
  }
}
const rng = new FastRng();
const N = Number(process.argv[2] ?? 300_000);
const TARGET = 0.96;
const out: Record<string, { scale: number; buyPrice: number; rtp: number; hit: number; fsEvery: number; buyEv: number }> = {};

for (const t of THEMES) {
  let total = 0, scat = 0, hits = 0, fs = 0;
  for (let i = 0; i < N; i++) {
    const r = __internals.playTheme(t, rng, false, 1);
    total += r.multiplier;
    const spins = [r.base!, ...r.free];
    scat += spins.reduce((a, s) => a + s.scatter.mult, 0);
    if (r.multiplier > 0) hits++;
    if (r.free.length) fs++;
  }
  const b = scat / N;
  const a = (total - scat) / N; // parte linear na escala
  let scale = (TARGET - b) / a;
  // refinamento: mede de novo na escala estimada e corrige (a variância dos bônus é alta)
  let check = 0;
  for (let i = 0; i < N; i++) check += __internals.playTheme(t, rng, false, scale).multiplier;
  check /= N;
  scale = +(scale * ((TARGET - b) / Math.max(0.2, check - b))).toFixed(4);
  check = 0;
  for (let i = 0; i < N / 2; i++) check += __internals.playTheme(t, rng, false, scale).multiplier;
  let buy = 0;
  const NB = Math.floor(N / 15);
  for (let i = 0; i < NB; i++) buy += __internals.playTheme(t, rng, true, scale).multiplier;
  const buyEv = buy / NB;
  out[t.id] = { scale, buyPrice: Math.max(20, Math.round(buyEv / 0.965)), rtp: +(check / (N / 2)).toFixed(4), hit: +(hits / N).toFixed(3), fsEvery: Math.round(N / Math.max(1, fs)), buyEv: +buyEv.toFixed(1) };
  console.log(t.id.padEnd(13), JSON.stringify(out[t.id]));
}
writeFileSync(new URL("../server/src/games/videoslots.calib.json", import.meta.url), JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { scale: v.scale, buyPrice: v.buyPrice }])), null, 2) + "\n");
console.log("\nCalibração gravada.");
