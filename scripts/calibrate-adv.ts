/**
 * Calibra os slots avançados (Onda 3) para ~96% de RTP.
 * Uso: npx tsx scripts/calibrate-adv.ts [giros] [filtro]   → grava server/src/games/advslots.calib.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { Rng } from "../server/src/fair.js";
import { __adv, BIG_WHEEL, CASCADES, PYR, WHEEL_SEGS, wheelsEval, type PyrState } from "../server/src/games/advslots.js";

class FastRng extends Rng {
  constructor() {
    super("x", "y", 0);
  }
  override float() {
    return Math.random();
  }
}
const rng = new FastRng();
const N = Number(process.argv[2] ?? 100_000);
const only = process.argv[3]?.split(",");
const TARGET = 0.96;
const file = new URL("../server/src/games/advslots.calib.json", import.meta.url);
const out: Record<string, { scale: number; buyPrice?: number }> = JSON.parse(readFileSync(file, "utf8"));
const want = (id: string) => !only || only.some((o) => id.startsWith(o));
const avg = (n: number, f: () => number) => {
  let t = 0;
  for (let i = 0; i < n; i++) t += f();
  return t / n;
};

for (const spec of CASCADES) {
  if (!want(spec.id)) continue;
  // tudo é linear na escala (sem pagamentos fixos)
  const a = avg(N, () => __adv.playCascade(spec, rng, false, 1).multiplier);
  let scale = TARGET / a;
  const check = avg(N, () => __adv.playCascade(spec, rng, false, scale).multiplier);
  scale = +(scale * (TARGET / check)).toFixed(4);
  const buy = avg(Math.floor(N / 12), () => __adv.playCascade(spec, rng, true, scale).multiplier);
  out[spec.id] = { scale, buyPrice: Math.max(20, Math.round(buy / 0.965)) };
  console.log(spec.id.padEnd(14), JSON.stringify({ ...out[spec.id], firstPass: +a.toFixed(4), check: +check.toFixed(4), buyEv: +buy.toFixed(1) }));
}

if (want("as-holdwin")) {
  // RTP = a·escala + b (a = linhas, b = recurso de moedas, que não depende da escala)
  let lines = 0;
  let feat = 0;
  let trig = 0;
  for (let i = 0; i < N * 3; i++) {
    const r = __adv.playHoldWin(rng, false, 1);
    lines += r.base!.lineWin;
    if (r.feature) {
      feat += r.feature.win;
      trig++;
    }
  }
  const a = lines / (N * 3);
  const b = feat / (N * 3);
  const scale = +((TARGET - b) / a).toFixed(4);
  const buy = avg(Math.floor(N / 5), () => __adv.playHoldWin(rng, true, scale).multiplier);
  out["as-holdwin"] = { scale, buyPrice: Math.max(20, Math.round(buy / 0.965)) };
  console.log("as-holdwin".padEnd(14), JSON.stringify({ ...out["as-holdwin"], lines: +a.toFixed(4), feature: +b.toFixed(4), every: Math.round((N * 3) / Math.max(1, trig)) }));
}

if (want("as-duplo")) {
  const a = avg(N, () => __adv.playTwin(rng, false, 1).multiplier);
  let scale = TARGET / a;
  const check = avg(N, () => __adv.playTwin(rng, false, scale).multiplier);
  scale = +(scale * (TARGET / check)).toFixed(4);
  const buy = avg(Math.floor(N / 10), () => __adv.playTwin(rng, true, scale).multiplier);
  out["as-duplo"] = { scale, buyPrice: Math.max(20, Math.round(buy / 0.965)) };
  console.log("as-duplo".padEnd(14), JSON.stringify(out["as-duplo"]));
}

if (want("as-piramide")) {
  let state: PyrState | null = null;
  let lines = 0;
  let prizes = 0;
  const M = N * 5;
  for (let i = 0; i < M; i++) {
    const r = __adv.playPyramid(rng, 100, state, 1);
    state = r.state;
    lines += r.result.lineWin;
    prizes += r.result.multiplier - r.result.lineWin;
  }
  const a = lines / M;
  const b = prizes / M;
  const scale = +((TARGET - b) / a).toFixed(4);
  out[PYR.id] = { scale };
  console.log(PYR.id.padEnd(14), JSON.stringify({ scale, lines: +a.toFixed(4), jackpot: +b.toFixed(4) }));
}

if (want("as-rodas")) {
  // enumeração exata das 16³ combinações
  const n = WHEEL_SEGS.length;
  let base = 0;
  let bonus = 0;
  for (const a of WHEEL_SEGS) for (const b of WHEEL_SEGS) for (const c of WHEEL_SEGS) {
    const e = wheelsEval([a, b, c]);
    if (e.kind === "bonus") bonus += BIG_WHEEL.reduce((x, y) => x + y, 0) / BIG_WHEEL.length;
    else base += e.mult;
  }
  base /= n ** 3;
  bonus /= n ** 3;
  const scale = +((TARGET - bonus) / base).toFixed(4);
  out["as-rodas"] = { scale };
  console.log("as-rodas".padEnd(14), JSON.stringify({ scale, base: +base.toFixed(4), bonus: +bonus.toFixed(4) }));
}

writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
console.log("\nCalibração gravada.");
