/**
 * Teste de ponta a ponta da API (servidor rodando com DEV_AUTH=1).
 * Uso: npx tsx scripts/smoke.ts [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";
const USER = String(100000 + Math.floor(Math.random() * 1e6));
let failures = 0;

async function call(method: string, path: string, body?: unknown) {
  await new Promise((r) => setTimeout(r, 90));
  const r = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { Authorization: `dev ${USER}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j: any = await r.json();
  if (!r.ok) throw new Error(`${path}: ${j.error} ${j.message}`);
  return j;
}
const ok = (name: string, cond: boolean, extra = "") => {
  if (!cond) failures++;
  console.log(`${cond ? "✓" : "✗"} ${name} ${extra}`);
};

const me = await call("GET", "/me");
ok("cria usuário com saldo inicial", me.user.balance === 10000);
const bonus = await call("POST", "/bonus", { kind: "daily" });
ok("bônus diário", bonus.user.balance === 11000);
try {
  await call("POST", "/bonus", { kind: "daily" });
  ok("bônus repetido bloqueado", false);
} catch {
  ok("bônus repetido bloqueado", true);
}

let balance = 11000;
const instant: [string, any][] = [
  ["dice", { type: "number", value: 3 }],
  ["coinflip", { side: "heads" }],
  ["limbo", { target: 2 }],
  ["roulette-eu", { bets: [{ type: "red", amount: 10 }, { type: "straight", value: 17, amount: 5 }] }],
  ["roulette-us", { bets: [{ type: "straight", value: 37, amount: 10 }, { type: "dozen", value: 2, amount: 10 }] }],
  ["keno", { picks: [1, 5, 9, 13, 22] }],
  ["scratch", {}],
  ["plinko", { rows: 16, risk: "high" }],
  ["baccarat", { bets: { player: 10, tie: 5, bankerPair: 5 } }],
  ["slots-classic", {}],
  ["slots-fruit", {}],
  ["slots-fruit", { buy: true }],
];
const card = Array.from({ length: 25 }, (_, i) => (i === 12 ? 0 : (i % 5) * 15 + Math.floor(i / 5) + 1));
instant.push(["bingo", { card }]);
for (const id of ["vs-savana", "vs-gemas", "vs-farao", "vs-piratas", "vs-dragao", "vs-floresta", "vs-olimpo", "vs-cyber", "vs-asteca", "vs-artico"]) {
  instant.push([id, {}]);
}
instant.push(["vs-farao", { buy: true }]);
for (const [g, params] of instant) {
  const r = await call("POST", `/play/${g}`, { bet: 10, params });
  const expected = balance - r.bet + r.payout;
  ok(`${g}`, r.balance === expected, `aposta ${r.bet} prêmio ${r.payout}`);
  balance = r.balance;
}

// Oráculo Cósmico (máquina com estado)
for (let i = 0; i < 40; i++) {
  const st = await call("GET", "/cosmic/state");
  if (st.machine.bonus) {
    const opts = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((x) => !st.machine.bonus.picks.includes(x));
    const p = await call("POST", "/cosmic/pick", { index: opts[0] });
    balance = p.balance;
    continue;
  }
  const r = await call("POST", "/cosmic/spin", { bet: 10 });
  const stake = r.result.isFree ? 0 : 10;
  if (r.balance !== balance - stake + r.payout) ok("cosmic saldo", false, JSON.stringify({ balance, b: r.balance, stake, p: r.payout }));
  balance = r.balance;
}
ok("cosmic 40 giros", true, `saldo ${balance}`);

// sessões
async function session(game: string, params: any, steps: (view: any) => [string, any] | null) {
  const s = await call("POST", `/session/${game}/start`, { bet: 20, params });
  let r = s;
  let guard = 0;
  while (!r.done && guard++ < 30) {
    const step = steps(r.view);
    if (!step) break;
    r = await call("POST", `/session/${s.roundId}/action`, { action: step[0], payload: step[1] });
  }
  const me2 = await call("GET", "/me");
  ok(`${game}`, r.done && me2.user.balance === balance - r.bet + r.payout, `aposta ${r.bet} prêmio ${r.payout}`);
  balance = me2.user.balance;
  return r;
}
await session("blackjack", {}, (v) => [v.hands[v.active]?.total < 17 ? "hit" : "stand", {}]);
await session("videopoker", {}, () => ["draw", { hold: [true, true, false, false, false] }]);
await session("threecard", { pairPlus: 10 }, () => ["play", {}]);
await session("caribbean", {}, () => ["call", {}]);
let cell = 0;
await session("mines", { mines: 3 }, (v) => (v.revealed.length >= 2 ? ["cashout", {}] : ["reveal", { cell: cell++ }]));
await session("tower", { mode: "easy" }, (v) => (v.level >= 2 ? ["cashout", {}] : ["pick", { col: 0 }]));
// crash: saque automático em 1.01x
const c = await call("POST", "/session/crash/start", { bet: 20, params: { autoCashout: 1.01 } });
await new Promise((r) => setTimeout(r, 2200));
const cr = await call("POST", `/session/${c.roundId}/action`, { action: "poll", payload: {} });
const me3 = await call("GET", "/me");
ok("crash", cr.done && me3.user.balance === balance - 20 + cr.payout, `${cr.view.outcome} @ ${cr.view.point} prêmio ${cr.payout}`);
balance = me3.user.balance;

// validações
for (const [name, path, body] of [
  ["aposta acima do saldo", "/play/dice", { bet: 10_000_000, params: { type: "even" } }],
  ["aposta negativa", "/play/dice", { bet: -5, params: { type: "even" } }],
  ["parâmetro inválido", "/play/dice", { bet: 10, params: { type: "number", value: 9 } }],
  ["cartela inválida", "/play/bingo", { bet: 10, params: { card: [1, 2, 3] } }],
] as const) {
  try {
    await call("POST", path, body);
    ok(name, false);
  } catch {
    ok(name, true);
  }
}

// provably fair: troca seed e confere rodada
const h = await call("GET", "/history?game=dice");
const rot = await call("POST", "/fair/rotate", {});
ok("seed revelada", !!rot.revealed.serverSeed);
const v = await call("GET", `/fair/round/${h.rounds[0].id}`);
ok("verificação provably fair", v.hashOk && v.matches === true);

const lb = await call("GET", "/leaderboard?scope=group");
ok("ranking do grupo", lb.rows.some((r: any) => String(r.id) === USER));
const store = await call("GET", "/store");
ok("loja", store.packs.length === 6 && store.me.firstPurchase === true);
const feed = await call("GET", "/feed");
ok("feed", Array.isArray(feed.wins));

console.log(failures ? `\n${failures} FALHA(S)` : "\nTudo certo ✔");
process.exit(failures ? 1 : 0);
