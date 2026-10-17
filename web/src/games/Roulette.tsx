import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtCompact, sleep } from "../lib/format";
import { sfx } from "../lib/sound";
import { appStore, speedFactor } from "../lib/store";
import { haptic } from "../lib/tg";
import { celebrate } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { Btn, ChipIcon, toast } from "../ui/kit";

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const EU = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const US = [0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, 37, 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2];
const CHIPS = [10, 50, 100, 500, 1000, 5000, 25000];
const CHIP_COLORS: Record<number, string> = { 10: "#64748b", 50: "#2563eb", 100: "#16a34a", 500: "#7c3aed", 1000: "#f59e0b", 5000: "#e11d48", 25000: "#0f172a" };

type Bet = { type: string; value?: number; amount: number };
const keyOf = (b: { type: string; value?: number }) => `${b.type}:${b.value ?? ""}`;
const label = (n: number) => (n === 37 ? "00" : String(n));
const colorOf = (n: number) => (n === 0 || n === 37 ? "#16a34a" : RED.has(n) ? "#dc2626" : "#111827");

export function Roulette({ american }: { american: boolean }) {
  const game = american ? "roulette-us" : "roulette-eu";
  const wheel = american ? US : EU;
  const [chip, setChip] = useState(() => Number(localStorage.getItem("cc_roul_chip")) || 100);
  const [bets, setBets] = useState<Map<string, Bet>>(new Map());
  const [lastBets, setLastBets] = useState<Map<string, Bet> | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [winKeys, setWinKeys] = useState<Set<string>>(new Set());
  const [hist, setHist] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState<{ id: number; amount: number } | null>(null);
  const wheelRot = useMotionValue(0);
  const ballRot = useMotionValue(0);
  const ballR = useMotionValue(86);
  const total = [...bets.values()].reduce((s, b) => s + b.amount, 0);

  function place(type: string, value?: number) {
    if (busy) return;
    const bal = appStore.get().user?.balance ?? 0;
    if (total + chip > bal) return toast("Saldo insuficiente", "error");
    haptic.tap();
    sfx.chip();
    setWinKeys(new Set());
    setBets((m) => {
      const n = new Map(m);
      const k = keyOf({ type, value });
      const cur = n.get(k);
      n.set(k, { type, value, amount: (cur?.amount ?? 0) + chip });
      return n;
    });
  }

  async function spin() {
    if (busy || total === 0) return;
    setBusy(true);
    setResult(null);
    setWinKeys(new Set());
    const placed = [...bets.values()];
    setLastBets(new Map(bets));
    haptic.impact("medium");
    sfx.whoosh();
    // gira enquanto espera
    const w0 = wheelRot.get();
    const spinW = animate(wheelRot, w0 + 360 * 20, { duration: 20, ease: "linear" });
    const spinB = animate(ballRot, ballRot.get() - 360 * 40, { duration: 20, ease: "linear" });
    const r = await playInstant<{ number: number; wins: number[] }>(game, 1, { bets: placed }, total);
    spinW.stop();
    spinB.stop();
    if (!r) {
      setBusy(false);
      return;
    }
    const n = r.result.number;
    const idx = wheel.indexOf(n);
    const seg = 360 / wheel.length;
    const sf = speedFactor();
    const dur = 4.2 * sf + 0.8;
    const wTarget = wheelRot.get() + 360 * 3 + Math.random() * 360;
    const wFinal = wTarget;
    // posição do número na roda no fim (ângulo absoluto do bolso)
    const pocketAngle = ((wFinal % 360) + idx * seg + seg / 2) % 360;
    let bFinal = ballRot.get() - 360 * 6;
    bFinal = bFinal - (((bFinal % 360) + 360) % 360) + pocketAngle - 360;
    let last = 0;
    animate(wheelRot, wFinal, { duration: dur, ease: [0.15, 0.6, 0.3, 1] });
    animate(ballR, [86, 86, 70, 63], { duration: dur, times: [0, 0.65, 0.85, 1], ease: "easeOut" });
    await animate(ballRot, bFinal, {
      duration: dur,
      ease: [0.1, 0.55, 0.25, 1],
      onUpdate: (v) => {
        if (Math.abs(v - last) > 40) {
          last = v;
          sfx.tick();
        }
      },
    });
    sfx.reelStop();
    haptic.impact("heavy");
    setResult(n);
    setHist((h) => [n, ...h].slice(0, 16));
    const wk = new Set(r.result.wins.map((i) => keyOf(placed[i])));
    setWinKeys(wk);
    await sleep(400);
    if (r.payout > 0) setLastWin({ id: r.roundId, amount: r.payout });
    else {
      setLastWin(null);
      sfx.lose();
    }
    await celebrate(r.payout, total);
    setBets(new Map());
    setBusy(false);
  }

  const chipOn = (type: string, value?: number) => {
    const b = bets.get(keyOf({ type, value })) ?? (busy || result !== null ? lastBets?.get(keyOf({ type, value })) : undefined);
    if (!b) return null;
    const win = winKeys.has(keyOf({ type, value }));
    return (
      <motion.div initial={{ scale: 0, y: -10 }} animate={{ scale: 1, y: 0 }} className={cls("absolute inset-0 m-auto w-6 h-6 rounded-full grid place-items-center text-[8px] font-black text-white border-2 border-dashed border-white/70 shadow-md pointer-events-none z-10", win && "ring-2 ring-gold-300 animate-bounce")} style={{ background: CHIP_COLORS[[...CHIPS].reverse().find((c) => c <= b.amount) ?? 10] }}>
        {fmtCompact(b.amount)}
      </motion.div>
    );
  };

  const cell = (n: number) => {
    const hit = result === n;
    return (
      <button key={n} onClick={() => place("straight", n)} className={cls("relative h-8 rounded-md text-[12px] font-extrabold text-white border border-white/10", hit && "ring-2 ring-gold-300 z-20")} style={{ background: colorOf(n) }}>
        {label(n)}
        {chipOn("straight", n)}
      </button>
    );
  };
  const outside = (type: string, text: React.ReactNode, value?: number, style?: React.CSSProperties) => (
    <button key={`${type}${value}`} onClick={() => place(type, value)} className="relative h-9 rounded-md text-[11px] font-extrabold text-white/90 bg-emerald-900/60 border border-white/10" style={style}>
      {text}
      {chipOn(type, value)}
    </button>
  );

  const ballX = useTransform([ballRot, ballR] as any, ([a, r]: number[]) => Math.sin((a * Math.PI) / 180) * r);
  const ballY = useTransform([ballRot, ballR] as any, ([a, r]: number[]) => -Math.cos((a * Math.PI) / 180) * r);

  return (
    <GameShell title={american ? "Roleta Americana" : "Roleta Europeia"} game={game} className="bg-[#03140b]" info={<><p>Toque nos números e áreas para apostar com a ficha selecionada. Número exato paga 35:1; dúzias e colunas 2:1; vermelho/preto, par/ímpar e 1–18/19–36 pagam 1:1.</p><p>{american ? "Roleta com 0 e 00 (RTP 94,7%)." : "Roleta com um zero (RTP 97,3%)."}</p></>}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(70% 45% at 50% 20%, rgba(22,163,74,0.25), transparent 70%)" }} />
      <div className="relative flex-1 min-h-0 overflow-y-auto no-scrollbar px-3">
        <div className="flex items-center gap-3">
          <div className="relative w-[180px] h-[180px] shrink-0">
            <motion.svg style={{ rotate: wheelRot }} viewBox="-100 -100 200 200" className="absolute inset-0 w-full h-full drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
              <circle r="99" fill="url(#a-gold-d)" />
              <circle r="93" fill="#2a1505" />
              {wheel.map((n, i) => {
                const seg = (Math.PI * 2) / wheel.length;
                const a0 = i * seg - Math.PI / 2;
                const a1 = a0 + seg;
                const p = (a: number, r: number) => `${Math.cos(a) * r} ${Math.sin(a) * r}`;
                const mid = a0 + seg / 2;
                return (
                  <g key={i}>
                    <path d={`M ${p(a0, 90)} A 90 90 0 0 1 ${p(a1, 90)} L ${p(a1, 58)} A 58 58 0 0 0 ${p(a0, 58)} Z`} fill={colorOf(n)} stroke="#d4a64a" strokeWidth=".6" />
                    <text x={Math.cos(mid) * 80} y={Math.sin(mid) * 80} transform={`rotate(${(mid * 180) / Math.PI + 90} ${Math.cos(mid) * 80} ${Math.sin(mid) * 80})`} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="800" fill="#fff">{label(n)}</text>
                  </g>
                );
              })}
              <circle r="56" fill="url(#a-gold-d)" />
              <circle r="44" fill="#3b1d0a" />
              {[0, 45, 90, 135].map((a) => <rect key={a} x="-3" y="-42" width="6" height="84" rx="3" fill="url(#a-gold)" transform={`rotate(${a})`} />)}
              <circle r="10" fill="url(#a-gold)" />
            </motion.svg>
            <motion.div className="absolute left-1/2 top-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-white shadow-[0_0_6px_white]" style={{ x: ballX, y: ballY }} />
          </div>
          <div className="flex-1 min-w-0 text-center">
            {result !== null ? (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="mx-auto w-16 h-16 rounded-full grid place-items-center font-display font-black text-2xl border-2 border-gold-300" style={{ background: colorOf(result) }}>{label(result)}</div>
                {lastWin ? <div className="text-win-400 font-black mt-2">+{fmt(lastWin.amount)}</div> : <div className="text-white/50 text-sm font-bold mt-2">Sem acertos</div>}
                {lastWin && !busy && <button onClick={() => shareRound(lastWin.id)} className="text-[10px] font-black text-plasma-400 mt-1 press">COMPARTILHAR ↗</button>}
              </motion.div>
            ) : (
              <div className="text-white/60 text-sm font-bold">{busy ? "Bola girando…" : "Faça suas apostas"}</div>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {hist.map((n, i) => <span key={i} className="w-6 h-6 rounded-full text-[10px] font-black grid place-items-center" style={{ background: colorOf(n), opacity: 1 - i * 0.05 }}>{label(n)}</span>)}
            </div>
          </div>
        </div>

        {/* mesa */}
        <div className="mt-3 rounded-2xl p-2 bg-emerald-950/70 border border-emerald-700/40">
          <div className={cls("grid gap-1 mb-1", american ? "grid-cols-2" : "grid-cols-1")}>
            {american ? [cell(0), cell(37)] : cell(0)}
          </div>
          <div className="grid grid-cols-[1fr_1fr_1fr_44px] gap-1">
            <div className="col-span-3 grid grid-cols-3 gap-1">
              {Array.from({ length: 12 }).flatMap((_, r) => [1, 2, 3].map((c) => cell(r * 3 + c)))}
            </div>
            <div className="grid grid-rows-3 gap-1">
              {outside("dozen", <span className="[writing-mode:vertical-rl]">1ª 12</span>, 1, { height: "100%" })}
              {outside("dozen", <span className="[writing-mode:vertical-rl]">2ª 12</span>, 2, { height: "100%" })}
              {outside("dozen", <span className="[writing-mode:vertical-rl]">3ª 12</span>, 3, { height: "100%" })}
            </div>
            {[1, 2, 3].map((c) => outside("column", "2:1", c))}
            <div />
          </div>
          <div className="grid grid-cols-6 gap-1 mt-1">
            {outside("low", "1–18")}
            {outside("even", "PAR")}
            {outside("red", <span className="inline-block w-4 h-4 rotate-45 bg-red-600 rounded-sm" />)}
            {outside("black", <span className="inline-block w-4 h-4 rotate-45 bg-gray-900 rounded-sm border border-white/30" />)}
            {outside("odd", "ÍMPAR")}
            {outside("high", "19–36")}
          </div>
        </div>
      </div>
      <div className="relative px-3 pt-2 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <div className="flex gap-1.5 justify-between">
          {CHIPS.map((c) => (
            <button key={c} onClick={() => { setChip(c); localStorage.setItem("cc_roul_chip", String(c)); haptic.tap(); sfx.chip(); }} className={cls("press w-11 h-11 rounded-full grid place-items-center text-[10px] font-black text-white border-[3px] border-dashed border-white/60 transition-transform", chip === c && "scale-115 ring-2 ring-gold-300 -translate-y-1")} style={{ background: CHIP_COLORS[c] }}>
              {fmtCompact(c)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-20 text-xs" disabled={busy || total === 0} onClick={() => setBets(new Map())}>LIMPAR</Btn>
          <Btn variant="glass" size="lg" className="w-20 text-xs" disabled={busy || !lastBets || total > 0} onClick={() => lastBets && setBets(new Map(lastBets))}>REPETIR</Btn>
          <Btn variant="gold" size="lg" className="flex-1" disabled={busy || total === 0} pulse={total > 0 && !busy} onClick={spin}>
            <ChipIcon size={18} /> GIRAR · {fmt(total)}
          </Btn>
        </div>
      </div>
    </GameShell>
  );
}
