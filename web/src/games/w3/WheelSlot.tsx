import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { revealBalance, speedFactor, useApp } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { bigWinTier, coinBurst, confetti, showBigWin } from "../../ui/effects";
import { GameShell, playInstant, shareRound } from "../../ui/GameShell";
import { BetInput, Btn, ChipIcon, CountUp, useBet } from "../../ui/kit";

type Result = { stops: number[]; symbols: number[]; kind: string; symbol: number | null; big: { stop: number; mult: number } | null; multiplier: number };
const SEG_COLORS = ["#7f1d1d", "#1e1b4b"];
const NAMES = ["Dragão (Wild)", "Bônus", "Coroa", "Diamante", "Sino", "Estrela", "Trevo", "—"];

/** Ícones das casas (desenhados em volta de 0,0, raio ~10). */
function Glyph({ s }: { s: number }): ReactNode {
  switch (s) {
    case 0:
      return (
        <g>
          <path d="M-10 6 C-11 -4 -4 -10 4 -9 C9 -8 11 -4 10 0 L6 1 L10 4 C7 8 0 9 -4 8 L-7 11 Z" fill="#ef4444" stroke="#fde68a" strokeWidth="1" />
          <circle cx="4" cy="-3" r="1.6" fill="#fde047" />
        </g>
      );
    case 1:
      return (
        <g>
          <circle r="10" fill="#7c3aed" stroke="#fde047" strokeWidth="1.5" />
          <text y="3.5" textAnchor="middle" fontSize="8" fontWeight="900" fill="#fde047" fontFamily="Unbounded">B</text>
        </g>
      );
    case 2:
      return <path d="M-10 6 L-8 -6 L-3 0 L0 -8 L3 0 L8 -6 L10 6 Z" fill="#facc15" stroke="#a16207" strokeWidth="1" />;
    case 3:
      return <path d="M0 -10 L9 -2 L0 10 L-9 -2 Z" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1" />;
    case 4:
      return <path d="M-8 6 C-8 -2 -6 -8 0 -8 C6 -8 8 -2 8 6 Z M-2 6 C-2 9 2 9 2 6" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />;
    case 5:
      return <path d="M0 -10 L3 -3 L10 -3 L4 2 L6 9 L0 5 L-6 9 L-4 2 L-10 -3 L-3 -3 Z" fill="#fde047" stroke="#a16207" strokeWidth="0.8" />;
    case 6:
      return (
        <g fill="#22c55e" stroke="#14532d" strokeWidth="0.8">
          {[0, 90, 180, 270].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 4.5} cy={Math.sin((a * Math.PI) / 180) * 4.5} r="4.5" />)}
        </g>
      );
    default:
      return <circle r="3" fill="#475569" />;
  }
}

function Wheel({ segs, rot, size, highlight }: { segs: number[]; rot: ReturnType<typeof useMotionValue<number>>; size: number; highlight?: boolean }) {
  const n = segs.length;
  const seg = 360 / n;
  const R = 48;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.svg viewBox="-50 -50 100 100" className="absolute inset-0 w-full h-full" style={{ rotate: rot }}>
        <circle r="49.5" fill="#1c1917" stroke="#fde68a" strokeWidth="1.5" />
        {segs.map((s, i) => {
          const a0 = ((i - 0.5) * seg - 90) * (Math.PI / 180);
          const a1 = ((i + 0.5) * seg - 90) * (Math.PI / 180);
          return (
            <g key={i}>
              <path d={`M0 0 L${R * Math.cos(a0)} ${R * Math.sin(a0)} A${R} ${R} 0 0 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)} Z`} fill={s === 1 ? "#5b21b6" : s === 0 ? "#991b1b" : SEG_COLORS[i % 2]} stroke="#fde68a" strokeOpacity=".35" strokeWidth=".6" />
              <g transform={`rotate(${i * seg}) translate(0 -35) rotate(${-i * seg}) scale(.7)`}>
                <Glyph s={s} />
              </g>
            </g>
          );
        })}
        <circle r="13" fill="#0c0a09" stroke="#fde68a" strokeWidth="1.5" />
      </motion.svg>
      <div className="absolute left-1/2 -top-1.5 -translate-x-1/2 z-10">
        <svg width="18" height="20" viewBox="0 0 18 20"><path d="M9 19 L2 4 Q9 -1 16 4 Z" fill="#fde047" stroke="#78350f" strokeWidth="1.2" /></svg>
      </div>
      {highlight && <div className="absolute inset-0 rounded-full pointer-events-none shadow-[0_0_24px_rgba(250,204,21,0.8)]" />}
    </div>
  );
}

export default function WheelSlot() {
  const id = "as-rodas";
  const cfg = useApp((s) => s.config?.adv?.wheels);
  const segs: number[] = cfg?.segs ?? [7, 5, 3, 7, 6, 2, 7, 4, 1, 6, 0, 5, 7, 4, 6, 3];
  const big: number[] = cfg?.big ?? [10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 250, 1000];
  const [bet, setBet] = useBet(id, 100);
  const r0 = useMotionValue(0);
  const r1 = useMotionValue(0);
  const r2 = useMotionValue(0);
  const rb = useMotionValue(0);
  const rots = [r0, r1, r2];
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [bigOpen, setBigOpen] = useState(false);
  const [win, setWin] = useState(0);
  const [lastRound, setLastRound] = useState<number | null>(null);
  const busyRef = useRef(false);
  const n = segs.length;
  const seg = 360 / n;

  async function spinTo(mv: ReturnType<typeof useMotionValue<number>>, idx: number, count: number, dur: number, extraTurns: number) {
    const cur = mv.get();
    const target = Math.ceil(cur / 360) * 360 + 360 * extraTurns - idx * (360 / count) + (Math.random() - 0.5) * (360 / count) * 0.5;
    let last = -1;
    await animate(mv, target, {
      duration: dur,
      ease: [0.15, 0.75, 0.2, 1],
      onUpdate: (x) => {
        const s = Math.floor((((x % 360) + 360) % 360) / (360 / count));
        if (s !== last) {
          last = s;
          sfx.tick();
        }
      },
    });
  }

  async function play() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      setRes(null);
      setWin(0);
      haptic.impact("medium");
      const r = await playInstant<Result>(id, bet, {});
      if (!r) {
        setAuto(false);
        return;
      }
      const sf = speedFactor();
      sfx.spinStart();
      await Promise.all(r.result.stops.map((st, i) => spinTo(rots[i], st, n, (2.4 + i * 0.6) * sf, 4 + i)));
      setRes(r.result);
      if (r.result.kind === "bonus" && r.result.big) {
        sfx.freeSpins();
        confetti();
        await sleep(800);
        setBigOpen(true);
        await sleep(600);
        await spinTo(rb, r.result.big.stop, big.length, 4.5 * sf, 6);
        sfx.jackpot();
        haptic.impact("heavy");
        await sleep(1500);
        setBigOpen(false);
      }
      const amount = r.payout;
      setWin(amount);
      setLastRound(r.roundId);
      if (bigWinTier(r.payout / bet)) await showBigWin(r.payout, r.payout / bet, r.result.big ? "Roda gigante" : undefined);
      else if (amount > 0) {
        sfx.win(r.result.multiplier >= 5);
        coinBurst(document.getElementById("wheels"), 10);
        await sleep(500);
        revealBalance();
      } else revealBalance();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (auto && !busy) {
      const t = setTimeout(play, 500 * speedFactor());
      return () => clearTimeout(t);
    }
  }, [auto, busy]);

  const size = Math.min(118, ((typeof window !== "undefined" ? window.innerWidth : 390) - 64) / 3);
  const pays = cfg?.pays ?? {};

  return (
    <GameShell
      title="Slot de Rodas"
      game={id}
      bg="radial-gradient(80% 50% at 50% 20%, rgba(220,38,38,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(124,58,237,0.3), transparent 70%), linear-gradient(180deg,#160606,#070203)"
      info={
        <>
          <p>Três rodas da sorte giram no lugar dos rolos. O símbolo sob cada ponteiro forma a jogada: três iguais pagam a tabela. O Dragão é Wild e cada Dragão usado dobra o prêmio.</p>
          <p>Dois Dragões com qualquer outro símbolo pagam {cfg?.any2 ?? 4}x. Três Bônus abrem a <b>Roda Gigante</b>, que paga de {big[0]}x a {fmt(big[big.length - 1])}x.</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[0, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className="glass rounded-xl p-2 flex items-center gap-2">
                <svg viewBox="-12 -12 24 24" className="w-7 h-7"><Glyph s={s} /></svg>
                <div className="text-[11px]"><div className="font-bold">{NAMES[s]} ×3</div><b className="text-gold-300">{fmtMult(pays[s] ?? 0)}</b></div>
              </div>
            ))}
          </div>
          <p className="text-white/50 text-xs">RTP 96% (calculado exatamente sobre todas as combinações). Resultado gerado no servidor (provably fair).</p>
        </>
      }
    >
      <div id="wheels" className="relative flex-1 flex flex-col items-center justify-center gap-4 px-3 min-h-0">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-full p-1.5" style={{ background: "linear-gradient(180deg,#fde68a,#b45309)" }}>
              <Wheel segs={segs} rot={rots[i]} size={size} highlight={!!res && res.multiplier > 0} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {(res?.symbols ?? [7, 7, 7]).map((s, i) => (
            <div key={i} className={cls("w-14 h-14 rounded-2xl grid place-items-center border-2", res ? "border-yellow-300/70 bg-black/40" : "border-white/10 bg-white/5")}>
              <svg viewBox="-12 -12 24 24" className="w-9 h-9"><Glyph s={res ? s : 7} /></svg>
            </div>
          ))}
        </div>
        <div className="h-10 grid place-items-center">
          {res && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cls("font-display font-black text-xl", res.multiplier > 0 ? "text-gold-300" : "text-white/50")}>
              {res.big ? `RODA GIGANTE ${res.big.mult}x` : res.multiplier > 0 ? `${fmtMult(res.multiplier)}` : "Sem prêmio"}
            </motion.div>
          )}
        </div>
        <div className="h-8 flex items-center justify-center">
          {win > 0 && (
            <div className="flex items-center gap-2">
              <ChipIcon size={20} />
              <CountUp value={win} className="font-display font-black text-xl" />
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {bigOpen && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/85" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center">
              <div className="font-display font-black text-3xl gold-text mb-4">RODA GIGANTE</div>
              <div className="relative w-[min(86vw,340px)] aspect-square">
                <motion.svg viewBox="-50 -50 100 100" className="absolute inset-0 w-full h-full" style={{ rotate: rb }}>
                  <circle r="49.5" fill="#1c1917" stroke="#fde68a" strokeWidth="1.5" />
                  {big.map((m, i) => {
                    const s = 360 / big.length;
                    const a0 = ((i - 0.5) * s - 90) * (Math.PI / 180);
                    const a1 = ((i + 0.5) * s - 90) * (Math.PI / 180);
                    return (
                      <g key={i}>
                        <path d={`M0 0 L${48 * Math.cos(a0)} ${48 * Math.sin(a0)} A48 48 0 0 1 ${48 * Math.cos(a1)} ${48 * Math.sin(a1)} Z`} fill={m >= 250 ? "#b91c1c" : m >= 75 ? "#7c3aed" : i % 2 ? "#1e3a8a" : "#0f766e"} stroke="#fde68a" strokeOpacity=".4" strokeWidth=".5" />
                        <text transform={`rotate(${i * s}) translate(0 -36)`} textAnchor="middle" fontSize="6" fontWeight="900" fill="#fff" fontFamily="Unbounded">{m}x</text>
                      </g>
                    );
                  })}
                  <circle r="10" fill="#0c0a09" stroke="#fde68a" strokeWidth="1.5" />
                </motion.svg>
                <div className="absolute left-1/2 -top-2 -translate-x-1/2"><svg width="30" height="34" viewBox="0 0 18 20"><path d="M9 19 L2 4 Q9 -1 16 4 Z" fill="#fde047" stroke="#78350f" strokeWidth="1.2" /></svg></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-[84px]" onClick={() => setAuto((a) => !a)}>{auto ? "PARAR" : "AUTO"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse={!busy} disabled={busy} onClick={play}>GIRAR AS RODAS</Btn>
        </div>
        {lastRound && !busy && win > 0 && <button onClick={() => shareRound(lastRound)} className="text-[11px] font-black press text-gold-300">COMPARTILHAR NO GRUPO ↗</button>}
      </div>
    </GameShell>
  );
}
