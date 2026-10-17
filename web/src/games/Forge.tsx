import { AnimatePresence, motion, animate, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FORGE_ART, FORGE_NAMES } from "../art/forge";
import { SymbolArt } from "../art/Symbol";
import { cls, fmt, fmtMult, sleep } from "../lib/format";
import { sfx } from "../lib/sound";
import { revealBalance, speedFactor, useApp } from "../lib/store";
import { haptic } from "../lib/tg";
import { bigWinTier, coinBurst, confetti, showBigWin } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { BetInput, Btn, ChipIcon, CountUp, useBet } from "../ui/kit";
import { Paylines, Reels, type ReelsHandle } from "../ui/Reels";

const POOL = [1, 2, 3, 4, 5, 6, 7, 7, 4, 5, 6, 0];
const LINES = [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]];

export default function Forge() {
  const cfg = useApp((s) => s.config?.classic);
  const reels = useRef<ReelsHandle>(null);
  const [bet, setBet] = useBet("slots-classic", 100);
  const [busy, setBusy] = useState(false);
  const [hl, setHl] = useState<Set<string> | null>(null);
  const [lines, setLines] = useState<number[]>([]);
  const [win, setWin] = useState(0);
  const [wheel, setWheel] = useState<{ stops: number[]; multiplier: number } | null>(null);
  const [auto, setAuto] = useState(false);
  const [lastRound, setLastRound] = useState<number | null>(null);
  const wheelDone = useRef<() => void>(() => {});
  const initial = useRef([[1, 4, 6], [5, 2, 6], [4, 3, 1]]);

  async function play() {
    if (busy) return;
    setBusy(true);
    setHl(null);
    setLines([]);
    setWin(0);
    haptic.impact("medium");
    reels.current?.start();
    const r = await playInstant<{ grid: number[][]; wins: { line: number; mult: number }[]; wheel: any; multiplier: number }>("slots-classic", bet, {});
    if (!r) {
      await reels.current?.stop(initial.current);
      setBusy(false);
      setAuto(false);
      return;
    }
    const res = r.result;
    const diamonds = res.grid.map((c) => c.includes(0));
    const anticipate = diamonds[0] && diamonds[1] ? [2] : [];
    await reels.current?.stop(res.grid, { anticipate });
    initial.current = res.grid;
    const cells = new Set<string>();
    res.wins.forEach((w) => LINES[w.line].forEach((row, reel) => cells.add(`${reel}-${row}`)));
    const lineWin = Math.floor((bet * res.wins.reduce((a, w) => a + w.mult, 0)) / 5);
    if (res.wins.length) {
      setHl(cells);
      setLines(res.wins.map((w) => w.line));
      setWin(lineWin);
      sfx.win();
      await sleep(800 * speedFactor());
    }
    if (res.wheel) {
      setAuto(false);
      setHl(new Set([0, 1, 2].map((reel) => `${reel}-${res.grid[reel].indexOf(0)}`)));
      sfx.scatter();
      await sleep(900);
      await new Promise<void>((resolve) => {
        wheelDone.current = resolve;
        setWheel(res.wheel);
      });
      setWin(r.payout);
    }
    setLastRound(r.roundId);
    if (bigWinTier(r.payout / bet)) await showBigWin(r.payout, r.payout / bet, res.wheel ? "Roda da Sorte" : undefined);
    else if (r.payout > 0) {
      haptic.success();
      coinBurst(document.getElementById("forge-reels"), 12);
      await sleep(600);
      revealBalance();
    } else revealBalance();
    setBusy(false);
  }

  useEffect(() => {
    if (auto && !busy) {
      const t = setTimeout(play, 400 * speedFactor());
      return () => clearTimeout(t);
    }
  }, [auto, busy]);

  return (
    <GameShell title="Forja do Dragão" game="slots-classic" className="bg-[#140504]" info={<ForgeRules cfg={cfg} bet={bet} />}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(70% 45% at 50% 100%, rgba(234,88,12,0.35), transparent 70%), radial-gradient(50% 35% at 50% 0%, rgba(185,28,28,0.3), transparent 70%)" }} />
      <Embers />
      <div className="relative flex-1 flex flex-col justify-center items-center px-4">
        <div className="text-center mb-3">
          <div className="font-display font-black text-xl" style={{ background: "linear-gradient(180deg,#fde68a,#f97316)", WebkitBackgroundClip: "text", color: "transparent" }}>RODA DA SORTE ATÉ 50.000x</div>
          <div className="text-[11px] font-bold text-orange-200/60">3 Ovos de Dragão (um em cada rolo) giram a roda</div>
        </div>
        <div id="forge-reels" className="w-full max-w-[340px] rounded-[28px] p-[3px]" style={{ background: "linear-gradient(180deg, #fde68a, #b45309 50%, #7f1d1d)" }}>
          <div className="rounded-[25px] bg-[#1c0a06] p-3 aspect-square">
            <Reels ref={reels} reels={3} rows={3} initial={initial.current} pool={POOL} gap={6} highlight={hl} cellClass="rounded-2xl bg-gradient-to-b from-orange-200/[0.08] to-transparent" renderSymbol={(s) => <SymbolArt art={FORGE_ART[s]} />}>
              <Paylines lines={LINES} active={lines} reels={3} rows={3} colors={["#fde047", "#fb923c", "#f87171", "#fdba74", "#facc15"]} />
            </Reels>
          </div>
        </div>
        <div className="h-14 flex items-center">
          {win > 0 && (
            <div className="flex items-center gap-2">
              <ChipIcon size={22} />
              <CountUp value={win} className="font-display font-black text-2xl text-orange-200" onTick={sfx.count} />
              <span className="text-xs font-black text-orange-200/70">{fmtMult(win / bet)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="relative px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-[90px]" onClick={() => setAuto((a) => !a)}>{auto ? "PARAR" : "AUTO"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse={!busy} disabled={busy} onClick={play}>{busy ? "…" : "GIRAR"}</Btn>
        </div>
        {lastRound && !busy && win > 0 && <button onClick={() => shareRound(lastRound)} className="text-[11px] font-black text-orange-300 press">COMPARTILHAR NO GRUPO ↗</button>}
      </div>
      <AnimatePresence>{wheel && cfg && <WheelBonus wheels={cfg.wheels} result={wheel} bet={bet} onDone={() => { setWheel(null); wheelDone.current(); }} />}</AnimatePresence>
    </GameShell>
  );
}

function Embers() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-orange-400" style={{ left: `${(i * 53) % 100}%`, boxShadow: "0 0 8px #fb923c" }} initial={{ y: "105vh", opacity: 0 }} animate={{ y: "-5vh", opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 6 + (i % 4), delay: i * 0.5 }} />
      ))}
    </div>
  );
}

const WHEEL_COLORS = [
  ["#7c2d12", "#c2410c"],
  ["#4c1d95", "#7c3aed"],
  ["#713f12", "#eab308"],
];

/** Roda da Sorte em 3 níveis: cada "▲" sobe para a próxima roda. */
function WheelBonus({ wheels, result, bet, onDone }: { wheels: number[][]; result: { stops: number[]; multiplier: number }; bet: number; onDone: () => void }) {
  const [level, setLevel] = useState(0);
  const [landed, setLanded] = useState<number | null>(null);
  const [spun, setSpun] = useState(false);
  const rot = useMotionValue(0);
  const segs = wheels[level];
  const n = segs.length;

  async function spinNow() {
    if (spun) return;
    setSpun(true);
    sfx.spinStart();
    haptic.impact("heavy");
    const stop = result.stops[level];
    const target = 360 * (6 + level) + (360 - (stop * 360) / n - 180 / n);
    let lastSeg = -1;
    await animate(rot, target, {
      duration: 4.2,
      ease: [0.12, 0.8, 0.18, 1],
      onUpdate: (v) => {
        const seg = Math.floor(((360 - (v % 360)) / 360) * n) % n;
        if (seg !== lastSeg) {
          lastSeg = seg;
          sfx.tick();
        }
      },
    });
    setLanded(segs[stop]);
    haptic.impact("heavy");
    if (segs[stop] === -1) {
      sfx.freeSpins();
      confetti();
      await sleep(1600);
      rot.set(0);
      setLanded(null);
      setSpun(false);
      setLevel((l) => l + 1);
    } else {
      sfx.jackpot();
      await sleep(1800);
      onDone();
    }
  }

  return (
    <motion.div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/85 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="font-display font-black text-2xl text-orange-200 mb-1">RODA DA SORTE</div>
      <div className="text-xs font-bold text-white/60 mb-4">Nível {level + 1} de 3 · {level === 0 ? "▲ leva à roda roxa" : level === 1 ? "▲ leva à Roda Lendária" : "Roda Lendária: até 50.000x"}</div>
      <div className="relative w-[300px] h-[300px]">
        <div className="absolute left-1/2 -top-3 -translate-x-1/2 z-10 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[26px] border-l-transparent border-r-transparent border-t-gold-300 drop-shadow-lg" />
        <motion.svg style={{ rotate: rot }} viewBox="-100 -100 200 200" className="w-full h-full drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]">
          <circle r="99" fill="url(#a-gold-d)" />
          {segs.map((v, i) => {
            const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
            const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
            const p = (a: number, r: number) => `${Math.cos(a) * r} ${Math.sin(a) * r}`;
            const mid = (a0 + a1) / 2;
            const fill = v === -1 ? "#16a34a" : WHEEL_COLORS[level][i % 2];
            return (
              <g key={i}>
                <path d={`M0 0 L ${p(a0, 92)} A 92 92 0 0 1 ${p(a1, 92)} Z`} fill={fill} stroke="#fde68a" strokeWidth=".8" />
                <text x={Math.cos(mid) * 64} y={Math.sin(mid) * 64} transform={`rotate(${(mid * 180) / Math.PI + 90} ${Math.cos(mid) * 64} ${Math.sin(mid) * 64})`} textAnchor="middle" dominantBaseline="middle" fontFamily="Unbounded" fontWeight="900" fontSize={v >= 10000 ? 9 : 11} fill="#fff">
                  {v === -1 ? "▲" : `${v >= 1000 ? `${v / 1000}K` : v}x`}
                </text>
              </g>
            );
          })}
          <circle r="22" fill="url(#a-gold)" stroke="#78350f" strokeWidth="2" />
        </motion.svg>
      </div>
      <div className="h-24 flex items-center">
        {landed !== null ? (
          <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="text-center">
            <div className="font-display font-black text-4xl text-gold-300">{landed === -1 ? "SOBE DE NÍVEL!" : `${fmt(landed)}x`}</div>
            {landed !== -1 && <div className="text-white/70 font-bold">{fmt(landed * bet)} fichas</div>}
          </motion.div>
        ) : (
          <Btn variant="gold" size="xl" pulse className="w-56" onClick={spinNow} disabled={spun}>GIRAR A RODA</Btn>
        )}
      </div>
    </motion.div>
  );
}

function ForgeRules({ cfg, bet }: { cfg: any; bet: number }) {
  if (!cfg) return null;
  const lb = bet / 5;
  return (
    <>
      <p>3 rolos e 5 linhas (3 horizontais + 2 diagonais). Valores para a aposta atual:</p>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((s) => (
          <div key={s} className="glass rounded-xl p-2 flex items-center gap-2">
            <div className="w-10 h-10 shrink-0"><SymbolArt art={FORGE_ART[s]} /></div>
            <div className="text-[11px] leading-tight"><div className="font-bold">{FORGE_NAMES[s]}</div>3× <b className="text-gold-300">{fmt(cfg.pays[s] * lb)}</b></div>
          </div>
        ))}
      </div>
      <p>Cristais misturados: {fmt(cfg.anyBar * lb)} · 2 brasas no início: {fmt(cfg.cherry2 * lb)} · 1 brasa no 1º rolo: {fmt(cfg.cherry1 * lb)}</p>
      <p><b>Ovo de Dragão</b> substitui tudo e cada ovo na linha dobra o prêmio. Um ovo visível em cada rolo gira a <b>Roda da Sorte</b>: três rodas em sequência, com a Lendária chegando a 50.000x.</p>
      <p className="text-white/50 text-xs">RTP ≈ 95,4%.</p>
    </>
  );
}
