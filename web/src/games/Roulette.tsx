import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { cls, fmt, fmtCompact, sleep } from "../lib/format";
import { sfx } from "../lib/sound";
import { appStore, speedFactor } from "../lib/store";
import { haptic } from "../lib/tg";
import { celebrate } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { ChipIcon, toast } from "../ui/kit";
import { CasinoChip } from "../ui/chips";

/* ============================================================== dados da mesa */
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const EU = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const US = [0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, 37, 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2];
const CHIPS = [10, 50, 100, 500, 1000, 5000, 25000];


type Bet = { type: string; value?: number; amount: number };
const keyOf = (b: { type: string; value?: number }) => `${b.type}:${b.value ?? ""}`;
const label = (n: number) => (n === 37 ? "00" : String(n));
const isRed = (n: number) => RED.has(n);
const isGreen = (n: number) => n === 0 || n === 37;
const fill = (n: number) => (isGreen(n) ? "#0f8a3c" : isRed(n) ? "#c8102e" : "#111111");
const chipFor = (amount: number) => [...CHIPS].reverse().find((c) => c <= amount) ?? 10;

/** Ganha a aposta com este número? (espelha o servidor, só para a animação) */
function wins(b: Bet, n: number) {
  const z = isGreen(n);
  switch (b.type) {
    case "straight": return b.value === n;
    case "red": return !z && isRed(n);
    case "black": return !z && !isRed(n);
    case "even": return !z && n % 2 === 0;
    case "odd": return !z && n % 2 === 1;
    case "low": return !z && n <= 18;
    case "high": return !z && n >= 19;
    case "dozen": return !z && Math.ceil(n / 12) === b.value;
    case "column": return !z && ((n - 1) % 3) + 1 === b.value;
  }
  return false;
}

/* ============================================================== roda */
type WheelApi = { spinTo: (n: number) => Promise<void> };

function Wheel({ order, size, apiRef }: { order: number[]; size: number; apiRef: React.MutableRefObject<WheelApi | null> }) {
  const n = order.length;
  const seg = 360 / n;
  const wheelG = useRef<SVGGElement>(null);
  const ballEl = useRef<SVGCircleElement>(null);
  const ballShadow = useRef<SVGCircleElement>(null);
  const state = useRef({ wheel: 0, ball: 0, r: 82, seated: -1 as number, raf: 0, idle: true });

  const R_TRACK = 82;
  const R_POCKET = 57;

  const draw = () => {
    const s = state.current;
    wheelG.current?.setAttribute("transform", `rotate(${s.wheel})`);
    const a = ((s.ball - 90) * Math.PI) / 180;
    const x = Math.cos(a) * s.r;
    const y = Math.sin(a) * s.r;
    ballEl.current?.setAttribute("cx", String(x));
    ballEl.current?.setAttribute("cy", String(y));
    ballShadow.current?.setAttribute("cx", String(x + 1.2));
    ballShadow.current?.setAttribute("cy", String(y + 1.8));
  };

  // giro lento contínuo da roda (com a bola assentada no bolso, se houver)
  useEffect(() => {
    let last = performance.now();
    const loop = (now: number) => {
      const s = state.current;
      if (s.idle) {
        const dt = Math.min(50, now - last);
        s.wheel = (s.wheel + dt * 0.006) % 360;
        if (s.seated >= 0) s.ball = s.wheel + s.seated * seg + seg / 2;
        draw();
      }
      last = now;
      s.raf = requestAnimationFrame(loop);
    };
    state.current.raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(state.current.raf);
  }, [seg]);

  apiRef.current = {
    spinTo(target: number) {
      return new Promise<void>((resolve) => {
        const s = state.current;
        s.idle = false;
        s.seated = -1;
        const idx = order.indexOf(target);
        const T = (5200 * speedFactor() + 1200);
        const w0 = s.wheel;
        const wTot = 360 * 1.6 + Math.random() * 120;
        const wEnd = w0 + wTot;
        const targetWorld = wEnd + idx * seg + seg / 2;
        const b0 = s.ball;
        // bola gira no sentido oposto, com várias voltas
        let bTot = b0 - targetWorld;
        bTot = ((bTot % 360) + 360) % 360 + 360 * 7;
        const t0 = performance.now();
        const bounceAt = [0.74, 0.8, 0.85, 0.89, 0.93];
        let nextBounce = 0;
        let lastTick = 0;
        const outQuart = (t: number) => 1 - Math.pow(1 - t, 4);
        const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const bounce = (u: number) => {
          // queda do trilho para o bolso com quiques decrescentes
          const n1 = 7.5625;
          const d1 = 2.75;
          if (u < 1 / d1) return n1 * u * u;
          if (u < 2 / d1) return n1 * (u -= 1.5 / d1) * u + 0.75;
          if (u < 2.5 / d1) return n1 * (u -= 2.25 / d1) * u + 0.9375;
          return n1 * (u -= 2.625 / d1) * u + 0.984375;
        };
        const finish = () => {
          s.wheel = wEnd % 360;
          s.seated = idx;
          s.ball = s.wheel + idx * seg + seg / 2;
          s.r = R_POCKET;
          s.idle = true;
          draw();
          resolve();
        };
        const safety = setTimeout(finish, T + 400);
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / T);
          s.wheel = w0 + wTot * outCubic(t);
          s.ball = b0 - bTot * outQuart(t);
          const u = t < 0.7 ? 0 : (t - 0.7) / 0.3;
          s.r = t < 0.7 ? R_TRACK : R_TRACK - (R_TRACK - R_POCKET) * bounce(Math.min(1, u));
          draw();
          // som da bola rolando (cada vez mais lento) e dos quiques
          const speed = 1 - outQuart(t);
          if (t < 0.7 && now - lastTick > 40 + (1 - speed) * 160) {
            lastTick = now;
            sfx.ball();
          }
          if (nextBounce < bounceAt.length && t >= bounceAt[nextBounce]) {
            nextBounce++;
            sfx.tick();
            haptic.impact("light");
          }
          if (t < 1) requestAnimationFrame(step);
          else {
            clearTimeout(safety);
            finish();
          }
        };
        requestAnimationFrame(step);
      });
    },
  };

  const p = (a: number, r: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return `${(Math.cos(rad) * r).toFixed(2)} ${(Math.sin(rad) * r).toFixed(2)}`;
  };

  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} className="drop-shadow-[0_14px_30px_rgba(0,0,0,0.7)]">
      <defs>
        <radialGradient id="rw-wood" cx="50%" cy="40%" r="60%">
          <stop offset="0.7" stopColor="#6b3410" />
          <stop offset="0.88" stopColor="#3d1a06" />
          <stop offset="1" stopColor="#1f0d03" />
        </radialGradient>
        <radialGradient id="rw-track" cx="50%" cy="45%" r="55%">
          <stop offset="0.75" stopColor="#2b1608" />
          <stop offset="0.9" stopColor="#5b3416" />
          <stop offset="1" stopColor="#2b1608" />
        </radialGradient>
        <radialGradient id="rw-cone" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff4cf" />
          <stop offset="0.35" stopColor="#d9a845" />
          <stop offset="1" stopColor="#6b4410" />
        </radialGradient>
        <radialGradient id="rw-ball" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#e5e7eb" />
          <stop offset="1" stopColor="#9ca3af" />
        </radialGradient>
        <linearGradient id="rw-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1c1" />
          <stop offset="0.5" stopColor="#c9962e" />
          <stop offset="1" stopColor="#7a5312" />
        </linearGradient>
      </defs>
      {/* aro de madeira e trilho da bola (fixos) */}
      <circle r="99" fill="url(#rw-wood)" />
      <circle r="96" fill="none" stroke="url(#rw-gold)" strokeWidth="1.6" />
      <circle r="90" fill="url(#rw-track)" />
      <circle r="74" fill="#140a03" />
      {/* losangos defletores */}
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={i} d="M0 -79 L2.6 -75 L0 -71 L-2.6 -75 Z" fill="url(#rw-gold)" transform={`rotate(${i * 45 + 22.5})`} />
      ))}
      {/* parte que gira */}
      <g ref={wheelG}>
        {order.map((num, i) => {
          const a0 = i * seg;
          const a1 = a0 + seg;
          return (
            <g key={i}>
              <path d={`M ${p(a0, 72)} A 72 72 0 0 1 ${p(a1, 72)} L ${p(a1, 60)} A 60 60 0 0 0 ${p(a0, 60)} Z`} fill={fill(num)} />
              <path d={`M ${p(a0, 60)} A 60 60 0 0 1 ${p(a1, 60)} L ${p(a1, 50)} A 50 50 0 0 0 ${p(a0, 50)} Z`} fill={fill(num)} opacity="0.75" />
              <text
                x={p(a0 + seg / 2, 66).split(" ")[0]}
                y={p(a0 + seg / 2, 66).split(" ")[1]}
                transform={`rotate(${a0 + seg / 2} ${p(a0 + seg / 2, 66)})`}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Manrope, sans-serif"
                fontWeight="800"
                fontSize="6.4"
                fill="#fff"
              >
                {label(num)}
              </text>
              <line x1={p(a0, 72).split(" ")[0]} y1={p(a0, 72).split(" ")[1]} x2={p(a0, 50).split(" ")[0]} y2={p(a0, 50).split(" ")[1]} stroke="url(#rw-gold)" strokeWidth="0.7" />
            </g>
          );
        })}
        <circle r="72" fill="none" stroke="url(#rw-gold)" strokeWidth="1.2" />
        <circle r="60" fill="none" stroke="url(#rw-gold)" strokeWidth="0.6" />
        <circle r="50" fill="none" stroke="url(#rw-gold)" strokeWidth="1.4" />
        {/* cone central com a cruz */}
        <circle r="49" fill="#3a1d08" />
        <circle r="40" fill="url(#rw-cone)" opacity="0.35" />
        <circle r="22" fill="url(#rw-cone)" />
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <rect x="-2.2" y="-38" width="4.4" height="24" rx="2" fill="url(#rw-gold)" />
            <circle cx="0" cy="-39" r="3.6" fill="url(#rw-cone)" stroke="#7a5312" strokeWidth=".6" />
          </g>
        ))}
        <circle r="9" fill="url(#rw-cone)" stroke="#7a5312" strokeWidth=".8" />
        <circle r="3" cy="-2" cx="-2" fill="#fff8e1" opacity=".8" />
      </g>
      {/* bola */}
      <circle ref={ballShadow} r="3.6" fill="rgba(0,0,0,0.45)" />
      <circle ref={ballEl} r="3.4" fill="url(#rw-ball)" />
    </svg>
  );
}

/* ============================================================== jogo */
export function Roulette({ american }: { american: boolean }) {
  const game = american ? "roulette-us" : "roulette-eu";
  const order = american ? US : EU;
  const [chip, setChip] = useState(() => Number(localStorage.getItem("cc_roul_chip")) || 100);
  const [bets, setBets] = useState<Map<string, Bet>>(new Map());
  const [placed, setPlaced] = useState<string[]>([]); // ordem das fichas (para desfazer)
  const [lastBets, setLastBets] = useState<Map<string, Bet> | null>(null);
  const [phase, setPhase] = useState<"bet" | "spin" | "result">("bet");
  const [result, setResult] = useState<number | null>(null);
  const [hist, setHist] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`cc_hist_${game}`) ?? "[]");
    } catch {
      return [];
    }
  });
  const [lastWin, setLastWin] = useState<{ id: number; amount: number } | null>(null);
  const wheelApi = useRef<WheelApi | null>(null);
  const total = [...bets.values()].reduce((s, b) => s + b.amount, 0);
  const busy = phase === "spin";

  useEffect(() => {
    localStorage.setItem(`cc_hist_${game}`, JSON.stringify(hist.slice(0, 40)));
  }, [hist]);

  const stats = useMemo(() => {
    const h = hist.slice(0, 40);
    const c = { red: 0, black: 0, green: 0 };
    h.forEach((n) => (isGreen(n) ? c.green++ : isRed(n) ? c.red++ : c.black++));
    const t = Math.max(1, h.length);
    return { red: Math.round((c.red / t) * 100), black: Math.round((c.black / t) * 100), green: Math.round((c.green / t) * 100) };
  }, [hist]);

  function clearResult() {
    if (phase === "result") {
      setPhase("bet");
      setResult(null);
    }
  }

  function place(type: string, value?: number) {
    if (busy) return;
    const startFresh = phase === "result";
    const current = startFresh ? new Map<string, Bet>() : bets;
    const t = [...current.values()].reduce((s, b) => s + b.amount, 0);
    const bal = appStore.get().user?.balance ?? 0;
    if (t + chip > bal) return toast("Saldo insuficiente", "error");
    haptic.tap();
    sfx.chip();
    clearResult();
    const k = keyOf({ type, value });
    const next = new Map(current);
    next.set(k, { type, value, amount: (next.get(k)?.amount ?? 0) + chip });
    setBets(next);
    setPlaced((p) => (startFresh ? [k] : [...p, k]));
  }

  function undo() {
    if (busy || !placed.length) return;
    const k = placed[placed.length - 1];
    setPlaced((p) => p.slice(0, -1));
    setBets((m) => {
      const n = new Map(m);
      const b = n.get(k);
      if (!b) return n;
      const amt = b.amount - chip > 0 ? b.amount - Math.min(chip, b.amount) : 0;
      if (amt <= 0) n.delete(k);
      else n.set(k, { ...b, amount: amt });
      return n;
    });
    sfx.click();
  }

  function double() {
    if (busy) return;
    const base = phase === "result" && lastBets ? lastBets : bets;
    const t = [...base.values()].reduce((s, b) => s + b.amount, 0) * 2;
    if (!t) return;
    if (t > (appStore.get().user?.balance ?? 0)) return toast("Saldo insuficiente", "error");
    clearResult();
    setBets(new Map([...base].map(([k, b]) => [k, { ...b, amount: b.amount * 2 }])));
    sfx.chip();
  }

  function repeat() {
    if (busy || !lastBets) return;
    const t = [...lastBets.values()].reduce((s, b) => s + b.amount, 0);
    if (t > (appStore.get().user?.balance ?? 0)) return toast("Saldo insuficiente", "error");
    clearResult();
    setBets(new Map(lastBets));
    setPlaced([...lastBets.keys()]);
    sfx.chip();
  }

  async function spin() {
    if (busy) return;
    const current = phase === "result" && lastBets ? lastBets : bets;
    const t = [...current.values()].reduce((s, b) => s + b.amount, 0);
    if (!t) return toast("Coloque suas fichas na mesa", "info");
    const list = [...current.values()];
    setBets(new Map(current));
    setLastBets(new Map(current));
    setPhase("spin");
    setResult(null);
    haptic.impact("medium");
    sfx.whoosh();
    const r = await playInstant<{ number: number; wins: number[] }>(game, 1, { bets: list }, t);
    if (!r) {
      setPhase("bet");
      return;
    }
    await sleep(250);
    await wheelApi.current?.spinTo(r.result.number);
    sfx.reelStop();
    haptic.impact("heavy");
    setResult(r.result.number);
    setHist((h) => [r.result.number, ...h].slice(0, 40));
    await sleep(900);
    setPhase("result");
    setPlaced([]);
    if (r.payout > 0) setLastWin({ id: r.roundId, amount: r.payout });
    else {
      setLastWin(null);
      sfx.lose();
    }
    await celebrate(r.payout, t);
  }

  /* -------------------------------------------------- células da mesa */
  const chipOn = (type: string, value?: number) => {
    const b = bets.get(keyOf({ type, value }));
    if (!b) return null;
    const won = phase === "result" && result !== null && wins(b, result);
    const lost = phase === "result" && result !== null && !won;
    return (
      <motion.div
        key={`${keyOf({ type, value })}-${phase === "result"}`}
        initial={phase === "result" ? false : { scale: 0.3, y: 60, opacity: 0 }}
        animate={lost ? { scale: 0.4, y: -30, opacity: 0 } : won ? { scale: [1, 1.25, 1], y: 0, opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
        transition={lost ? { duration: 0.45, delay: 0.3 } : won ? { repeat: Infinity, duration: 0.9 } : { type: "spring", damping: 14, stiffness: 300 }}
        className="absolute inset-0 m-auto w-[26px] h-[30px] pointer-events-none z-10 grid place-items-center"
      >
        <CasinoChip value={chipFor(b.amount)} size={26} label={fmtCompact(b.amount)} stack={Math.min(3, Math.ceil(b.amount / chipFor(b.amount)))} glow={won} />
      </motion.div>
    );
  };

  const numCell = (n: number) => {
    const hit = result === n && phase !== "spin";
    return (
      <button
        key={n}
        onClick={() => place("straight", n)}
        className={cls("relative border-r border-b border-white/55 grid place-items-center active:brightness-125", hit && "z-20")}
      >
        <span className={cls("w-[30px] h-[22px] rounded-[5px] grid place-items-center text-[13px] font-extrabold text-white shadow-inner", hit && "ring-2 ring-gold-300 animate-pulse")} style={{ background: fill(n) }}>
          {label(n)}
        </span>
        {hit && (
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-1 right-1 z-30 w-3.5 h-3.5 rounded-full border-2 border-white shadow" style={{ background: "radial-gradient(circle at 35% 30%, #fff, #fbbf24 60%, #92400e)" }} />
        )}
        {chipOn("straight", n)}
      </button>
    );
  };

  const sideCell = (type: string, content: React.ReactNode, value?: number, rows = 2, highlight?: boolean) => (
    <button key={`${type}${value}`} onClick={() => place(type, value)} className={cls("relative border-r border-b border-white/55 grid place-items-center text-white font-extrabold active:bg-white/10", highlight && "bg-gold-400/25")} style={{ gridRow: `span ${rows}` }}>
      <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] tracking-wider">{content}</span>
      {chipOn(type, value)}
    </button>
  );

  const hl = (b: Bet) => phase === "result" && result !== null && wins(b, result);

  return (
    <GameShell
      title={american ? "Roleta Americana" : "Roleta Europeia"}
      game={game}
      className="bg-[#04120a]"
      info={
        <>
          <p>Escolha uma ficha e toque na mesa para apostar. Toque várias vezes para empilhar.</p>
          <p><b>Pagamentos:</b> número 35:1 · dúzia e coluna 2:1 · vermelho/preto, par/ímpar, 1–18/19–36 pagam 1:1.</p>
          <p>{american ? "Roleta com 0 e 00 (RTP 94,7%)." : "Roleta de um zero (RTP 97,3%)."} O resultado é gerado no servidor (provably fair) antes da bola ser lançada.</p>
        </>
      }
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(80% 50% at 50% 35%, rgba(21,128,61,0.35), transparent 75%)" }} />

      {/* faixa superior: roda + histórico */}
      <div className="relative z-20 px-3 flex items-start gap-3" style={{ height: 132 }}>
        <motion.div
          className="relative shrink-0 origin-top-left"
          animate={busy ? { scale: 2.3, x: 36, y: 4 } : { scale: 1, x: 0, y: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 140 }}
          style={{ width: 128, height: 128 }}
        >
          <Wheel order={order} size={128} apiRef={wheelApi} />
        </motion.div>
        <motion.div animate={{ opacity: busy ? 0 : 1 }} className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-2">
            <AnimatePresence mode="popLayout">
              {result !== null ? (
                <motion.div key={`r${result}-${hist.length}`} initial={{ scale: 0.3, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} className="w-14 h-14 rounded-full grid place-items-center font-display font-black text-2xl text-white border-[3px] border-gold-300 shadow-[0_0_20px_rgba(253,224,71,0.5)]" style={{ background: fill(result) }}>
                  {label(result)}
                </motion.div>
              ) : (
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/25 grid place-items-center text-white/40 text-[10px] font-black text-center leading-tight">FAÇA<br />APOSTAS</div>
              )}
            </AnimatePresence>
            <div className="min-w-0">
              {phase === "result" ? (
                lastWin ? (
                  <>
                    <div className="text-win-400 font-display font-black text-lg leading-tight">+{fmt(lastWin.amount)}</div>
                    <button onClick={() => shareRound(lastWin.id)} className="text-[10px] font-black text-plasma-400 press">COMPARTILHAR ↗</button>
                  </>
                ) : (
                  <div className="text-white/60 text-sm font-bold">Sem acertos</div>
                )
              ) : (
                <div className="text-[11px] text-white/55 font-bold leading-tight">Aposta total<div className="text-white font-extrabold text-base tabular">{fmt(total)}</div></div>
              )}
            </div>
          </div>
          <div className="flex gap-1 overflow-hidden">
            {hist.slice(0, 11).map((n, i) => (
              <span key={`${i}-${n}`} className={cls("shrink-0 rounded-md text-[10px] font-black grid place-items-center text-white", i === 0 ? "w-7 h-7 ring-1 ring-gold-300" : "w-6 h-6")} style={{ background: fill(n), opacity: 1 - i * 0.06 }}>
                {label(n)}
              </span>
            ))}
          </div>
          {hist.length > 0 && (
            <div className="flex h-1.5 rounded-full overflow-hidden text-[0]">
              <div style={{ width: `${stats.red}%`, background: "#c8102e" }} />
              <div style={{ width: `${stats.green}%`, background: "#0f8a3c" }} />
              <div style={{ width: `${stats.black}%`, background: "#444" }} />
            </div>
          )}
        </motion.div>
      </div>

      {/* mesa de feltro (layout vertical oficial) */}
      <div className="relative flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 pb-2 flex flex-col">
        <motion.div animate={{ opacity: busy ? 0.35 : 1, filter: busy ? "blur(1px)" : "blur(0px)" }} className="relative rounded-2xl p-1.5 mx-auto w-full max-w-[400px] flex-1 max-h-[620px] min-h-[460px] flex flex-col" style={{ background: "radial-gradient(120% 100% at 50% 20%, #13753a, #0a4a23 70%, #073318)", boxShadow: "inset 0 0 0 3px #c9962e, inset 0 0 0 5px #5b3a0a, 0 10px 30px rgba(0,0,0,.5)" }}>
          <div className="grid flex-1 border-l border-t border-white/55" style={{ gridTemplateColumns: "34px 34px 1fr 1fr 1fr", gridTemplateRows: "repeat(14, minmax(30px, 1fr))" }}>
            {/* zero(s) */}
            <div style={{ gridColumn: "1 / span 2" }} className="border-r border-b border-white/55" />
            <div style={{ gridColumn: "3 / span 3" }} className={cls("grid border-r border-b border-white/55", american ? "grid-cols-2" : "grid-cols-1")}>
              {(american ? [0, 37] : [0]).map((z) => (
                <button key={z} onClick={() => place("straight", z)} className="relative grid place-items-center active:brightness-125 first:border-r first:border-white/55 last:border-r-0">
                  <span className={cls("h-[22px] px-6 rounded-full grid place-items-center text-[13px] font-extrabold text-white", result === z && phase !== "spin" && "ring-2 ring-gold-300 animate-pulse")} style={{ background: fill(z) }}>{label(z)}</span>
                  {chipOn("straight", z)}
                </button>
              ))}
            </div>
            {/* coluna externa: 1-18 / par / vermelho / preto / ímpar / 19-36 (2 linhas cada) */}
            <div className="contents">
              {[
                ["low", "1 a 18"],
                ["even", "PAR"],
                ["red", <span key="r" className="inline-block w-3.5 h-3.5 rotate-45 bg-[#c8102e] border border-white/70" />],
                ["black", <span key="b" className="inline-block w-3.5 h-3.5 rotate-45 bg-[#111] border border-white/70" />],
                ["odd", "ÍMPAR"],
                ["high", "19 a 36"],
              ].map(([t, c], i) => (
                <div key={t as string} style={{ gridColumn: 1, gridRow: `${2 + i * 2} / span 2` }} className="grid">
                  {sideCell(t as string, c, undefined, 2, hl({ type: t as string, amount: 1 }))}
                </div>
              ))}
              {[1, 2, 3].map((d) => (
                <div key={d} style={{ gridColumn: 2, gridRow: `${2 + (d - 1) * 4} / span 4` }} className="grid">
                  {sideCell("dozen", `${d}ª DÚZIA`, d, 4, hl({ type: "dozen", value: d, amount: 1 }))}
                </div>
              ))}
              {Array.from({ length: 12 }).flatMap((_, r) =>
                [1, 2, 3].map((c) => (
                  <div key={`${r}-${c}`} style={{ gridColumn: 2 + c, gridRow: 2 + r }} className="grid">
                    {numCell(r * 3 + c)}
                  </div>
                )),
              )}
            </div>
            {/* colunas 2:1 */}
            <div style={{ gridColumn: "1 / span 2", gridRow: 14 }} className="border-r border-b border-white/55" />
            {[1, 2, 3].map((c) => (
              <button key={c} onClick={() => place("column", c)} style={{ gridColumn: 2 + c, gridRow: 14 }} className={cls("relative border-r border-b border-white/55 text-white text-[12px] font-extrabold active:bg-white/10", hl({ type: "column", value: c, amount: 1 }) && "bg-gold-400/25")}>
                2:1
                {chipOn("column", c)}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* bandeja de fichas + ações */}
      <div className="relative z-10 px-3 pt-1 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <div className="flex justify-between items-end px-1 h-[54px]">
          {CHIPS.map((c) => (
            <motion.button
              key={c}
              disabled={busy}
              animate={{ y: chip === c ? -8 : 0, scale: chip === c ? 1.12 : 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setChip(c);
                localStorage.setItem("cc_roul_chip", String(c));
                haptic.tap();
                sfx.chip();
              }}
              className={cls("rounded-full", chip === c && "drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]")}
            >
              <CasinoChip value={c} size={44} />
            </motion.button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.8fr] gap-1.5">
          {[
            ["↶", "DESFAZER", undo, !placed.length],
            ["✕", "LIMPAR", () => { clearResult(); setBets(new Map()); setPlaced([]); }, !total && phase !== "result"],
            ["×2", "DOBRAR", double, !total],
            ["↻", "REPETIR", repeat, !lastBets],
          ].map(([icon, text, fn, dis]) => (
            <button key={text as string} disabled={busy || (dis as boolean)} onClick={() => { haptic.tap(); (fn as () => void)(); }} className="press glass rounded-2xl h-14 flex flex-col items-center justify-center">
              <span className="text-base font-black leading-none">{icon as string}</span>
              <span className="text-[8.5px] font-black tracking-wider text-white/60 mt-1">{text as string}</span>
            </button>
          ))}
          <button
            disabled={busy}
            onClick={spin}
            className={cls("press rounded-2xl h-14 btn-gold flex flex-col items-center justify-center", !busy && total > 0 && "pulse-glow")}
          >
            <span className="font-display font-black text-sm leading-none">{busy ? "GIRANDO…" : "GIRAR"}</span>
            <span className="flex items-center gap-1 text-[11px] font-extrabold mt-1 opacity-80"><ChipIcon size={12} />{fmt(total)}</span>
          </button>
        </div>
      </div>
    </GameShell>
  );
}
