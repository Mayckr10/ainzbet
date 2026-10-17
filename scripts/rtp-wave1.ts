/** Simula o RTP dos jogos da Onda 1.  npx tsx scripts/rtp-wave1.ts [rodadas] [filtro] */
import { Rng } from "../server/src/fair.js";
import { GAMES } from "../server/src/games/registry.js";
import { bjTotal } from "../server/src/games/cards2.js";

const N = Number(process.argv[2] ?? 200_000);
const only = process.argv[3];
let nonce = 0;
const rng = () => new Rng("seed-" + Math.random(), "c", nonce++);

function instant(id: string, params: any, bet = 100, n = N) {
  const g = GAMES[id] as any;
  let wag = 0;
  let pay = 0;
  for (let i = 0; i < n; i++) {
    const t = g.totalBet(params, bet);
    wag += t;
    pay += g.play(rng(), params, bet).payout;
  }
  return pay / wag;
}

function session(id: string, params: any, policy: (view: any, i: number) => [string, any] | null, bet = 100, n = N) {
  const g = GAMES[id] as any;
  let wag = 0;
  let pay = 0;
  for (let k = 0; k < n; k++) {
    let total = g.totalBet(params, bet);
    let step = g.start(rng(), params, bet);
    let i = 0;
    while (!step.done) {
      const a = policy(step.view, i++);
      if (!a) break;
      step = g.action(step.state, a[0], a[1], { bet, balance: 1e12 });
      total += step.extraBet ?? 0;
    }
    wag += total;
    pay += step.payout ?? 0;
  }
  return pay / wag;
}

const bjPolicy = (v: any): [string, any] => {
  if (v.phase === "switch") {
    const [a, b] = v.hands;
    const sc = (c: number[]) => { const x = bjTotal(c).total; return x >= 17 ? x : x >= 12 ? 10 : x === 11 || x === 10 ? 19 : 16; };
    const cur = sc(a.cards) + sc(b.cards);
    const sw = sc([a.cards[0], b.cards[1]]) + sc([b.cards[0], a.cards[1]]);
    return [sw > cur ? "switch" : "noswitch", {}];
  }
  const h = v.hands[v.active];
  const t = bjTotal(h.cards);
  const up = v.dealerTotal;
  if (v.actions.includes("split") && [8, 11].includes(bjTotal([h.cards[0]]).total)) return ["split", {}];
  if (v.actions.includes("double") && !t.soft && (t.total === 11 || (t.total === 10 && up < 10))) return ["double", {}];
  if (t.soft) return [t.total >= 18 ? "stand" : "hit", {}];
  if (t.total >= 17) return ["stand", {}];
  if (t.total >= 13 && up <= 6) return ["stand", {}];
  if (t.total === 12 && up >= 4 && up <= 6) return ["stand", {}];
  return ["hit", {}];
};

const tests: [string, () => number][] = [
  ["overunder 50 under", () => instant("overunder", { target: 50, dir: "under" })],
  ["overunder 90 over", () => instant("overunder", { target: 90, dir: "over" })],
  ...["low", "medium", "high"].flatMap((r) => [10, 50].map((s): [string, () => number] => [`wheel ${s} ${r}`, () => instant("wheel", { segments: s, risk: r })])),
  ["limbo-turbo 2x", () => instant("limbo-turbo", { target: 2, count: 10 })],
  ["cofre-secreto 2", () => instant("cofre-secreto", { digits: 2, code: "42" })],
  ["diamantes", () => instant("diamantes", {})],
  ["loto exact 17", () => instant("loto-dados", { type: "exact", value: 17 })],
  ["loto over 20", () => instant("loto-dados", { type: "over", value: 20 })],
  ...[0, 3].map((r): [string, () => number] => [`foguetes ${r}`, () => instant("foguetes", { rocket: r })]),
  ...["low", "medium", "high"].map((r): [string, () => number] => [`tiro ${r}`, () => instant("tiro-alvo", { risk: r })]),
  ["dardos", () => instant("dardos", {})],
  ["garra", () => instant("garra", {})],
  ["fruta-neon", () => instant("fruta-neon", {})],
  ["plinko-duo 16 high", () => instant("plinko-duo", { rows: 16, risk: "high" })],
  ["dragon-tiger dragon", () => instant("dragon-tiger", { bets: { dragon: 100 } })],
  ["dragon-tiger tie", () => instant("dragon-tiger", { bets: { tie: 100 } })],
  ["andar", () => instant("andar-bahar", { bets: { andar: 100 } })],
  ["bahar", () => instant("andar-bahar", { bets: { bahar: 100 } })],
  ["lightning player", () => instant("baccarat-lightning", { bets: { player: 100 } })],
  ["lightning banker", () => instant("baccarat-lightning", { bets: { banker: 100 } })],
  ["lightning tie", () => instant("baccarat-lightning", { bets: { tie: 100 } })],
  ["scratch-farao", () => instant("scratch-farao", {})],
  ["scratch-mult", () => instant("scratch-mult", {})],
  ["megasena", () => instant("megasena", { picks: [1, 2, 3, 4, 5, 6] })],
  ["bingo90", () => instant("bingo90", {})],
  ["bingo-flash", () => instant("bingo-flash", {})],
  ["bicho grupo", () => instant("bicho", { mode: "grupo", value: 7 })],
  ["bicho grupo15", () => instant("bicho", { mode: "grupo15", value: 7 })],
  ["bicho milhar", () => instant("bicho", { mode: "milhar", value: 1234 })],
  ["cofre-banco", () => session("cofre-banco", {}, (_v, i) => ["pick", { index: i }])],
  ["pescaria", () => session("pescaria", {}, (_v, i) => ["pick", { index: i }])],
  ["bau-pirata", () => session("bau-pirata", {}, (_v, i) => ["pick", { index: i }])],
  ["caixas troca", () => session("caixas", {}, (v) => (v.phase === "pick" ? ["pick", { box: 0 }] : ["final", { switch: true }]))],
  ["red-dog (aumenta 7+)", () => session("red-dog", {}, (v) => [v.spread >= 7 ? "raise" : "call", {}])],
  ["guerra (sempre guerra)", () => session("guerra", {}, () => ["war", {}])],
  ["let-it-ride (sempre recolhe)", () => session("let-it-ride", {}, () => ["pull", {}])],
  ["hilo 3 passos", () => session("hilo", {}, (v, i) => (i >= 3 ? ["cashout", {}] : [v.hi.p >= v.lo.p ? "hi" : "lo", {}]))],
  ["escada hard 3", () => session("escada", { mode: "hard" }, (_v, i) => (i >= 3 ? ["cashout", {}] : ["pick", { col: 0 }]))],
  ["tesouro 5 bombs 4", () => session("tesouro", { bombs: 5 }, (_v, i) => (i >= 4 ? ["cashout", {}] : ["reveal", { cell: i }]))],
  ...["bj-eu", "bj-multi", "bj-switch"].map((id): [string, () => number] => [id, () => session(id, { hands: 1 }, bjPolicy, 100, N / 4)]),
  ["bj-213 side only", () => {
    const g = GAMES["bj-213"] as any;
    let pay = 0;
    for (let i = 0; i < N; i++) pay += g.start(rng(), { side: 100 }, 100).state.sidePay;
    return pay / (100 * N);
  }],
];

for (const [name, f] of tests) {
  if (only && !name.includes(only)) continue;
  console.log(name.padEnd(30), (f() * 100).toFixed(2) + "%");
}
