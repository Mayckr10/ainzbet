import { motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, Hist, ShareLink, useHist } from "./common";

const NUMS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const AREA = ["Fora", "Simples", "Duplo", "Triplo", "Bull", "Mosca"];
const MULT = [0, 0.5, 1.5, 2.5, 5, 12];
// raio (fração) por área: [min, max]
const RAD: [number, number][] = [[1.04, 1.12], [0.15, 0.53], [0.92, 0.99], [0.56, 0.61], [0.07, 0.12], [0, 0.05]];
type Throw = { area: number; sector: number; jitter: number; mult: number };

export default function Dardos() {
  const [bet, setBet] = useBet("dardos", 30);
  const [darts, setDarts] = useState<{ x: number; y: number; t: Throw }[]>([]);
  const [busy, setBusy] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [lastId, setLastId] = useState<number | null>(null);
  const [hist, push] = useHist("dardos");

  const pos = (t: Throw) => {
    const [a, b] = RAD[t.area];
    const r = a + (b - a) * t.jitter;
    const ang = ((t.sector * 18 + (t.jitter - 0.5) * 12 - 90) * Math.PI) / 180;
    return { x: 50 + Math.cos(ang) * r * 42, y: 50 + Math.sin(ang) * r * 42 };
  };

  async function play() {
    if (busy) return;
    setBusy(true);
    setDarts([]);
    setTotal(null);
    haptic.impact("medium");
    const r = await playInstant<{ throws: Throw[]; triple: boolean; multiplier: number }>("dardos", bet, {});
    if (!r) return setBusy(false);
    for (const t of r.result.throws) {
      await sleep(420 * speedFactor());
      sfx.chip();
      haptic.impact(t.area >= 3 ? "heavy" : "light");
      setDarts((d) => [...d, { ...pos(t), t }]);
    }
    await sleep(250);
    setTotal(r.result.multiplier);
    push(r.result.multiplier, r.result.multiplier >= 1);
    if (r.payout > bet) setLastId(r.roundId);
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  const seg = (i: number, r0: number, r1: number) => {
    const a0 = ((i * 18 - 9 - 90) * Math.PI) / 180;
    const a1 = ((i * 18 + 9 - 90) * Math.PI) / 180;
    const p = (r: number, a: number) => `${50 + Math.cos(a) * r * 42} ${50 + Math.sin(a) * r * 42}`;
    return `M${p(r0, a0)} L${p(r1, a0)} A${r1 * 42} ${r1 * 42} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0 * 42} ${r0 * 42} 0 0 0 ${p(r0, a0)} Z`;
  };

  return (
    <GameShell
      title="Dardos"
      game="dardos"
      bg="radial-gradient(80% 50% at 50% 30%, rgba(34,197,94,0.2), transparent 70%), linear-gradient(180deg,#0a0f0a,#040604)"
      info={<><p>Três dardos por rodada; a aposta é dividida entre eles. Cada dardo paga conforme a área: Simples 0,5x · Duplo 1,5x · Triplo 2,5x · Bull 5x · Mosca 12x · Fora 0x.</p><p>Três moscas seguidas pagam 1.000x a aposta! O prêmio final é a média dos 3 dardos. RTP ≈ 96,5%.</p></>}
    >
      <Hist items={hist} />
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="relative w-[min(88vw,350px)] aspect-square">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-[0_14px_30px_rgba(0,0,0,0.6)]">
            <circle cx="50" cy="50" r="49.5" fill="#111" />
            {NUMS.map((_, i) => {
              const dark = i % 2 === 0;
              return (
                <g key={i}>
                  <path d={seg(i, 0.12, 0.56)} fill={dark ? "#1c1917" : "#f5f5dc"} />
                  <path d={seg(i, 0.56, 0.62)} fill={dark ? "#dc2626" : "#16a34a"} />
                  <path d={seg(i, 0.62, 0.92)} fill={dark ? "#1c1917" : "#f5f5dc"} />
                  <path d={seg(i, 0.92, 1)} fill={dark ? "#dc2626" : "#16a34a"} />
                </g>
              );
            })}
            <circle cx="50" cy="50" r={0.12 * 42} fill="#16a34a" />
            <circle cx="50" cy="50" r={0.05 * 42} fill="#dc2626" />
            {NUMS.map((n, i) => {
              const a = ((i * 18 - 90) * Math.PI) / 180;
              return <text key={n} x={50 + Math.cos(a) * 46.5} y={50 + Math.sin(a) * 46.5 + 1.3} textAnchor="middle" fontSize="3.6" fontWeight="900" fill="#fff">{n}</text>;
            })}
          </svg>
          {darts.map((d, i) => (
            <motion.div key={i} className="absolute -translate-x-[10%] -translate-y-[90%]" style={{ left: `${d.x}%`, top: `${d.y}%` }} initial={{ scale: 3, opacity: 0, x: 60, y: 80 }} animate={{ scale: 1, opacity: 1, x: 0, y: 0 }} transition={{ type: "spring", damping: 15, stiffness: 300 }}>
              <svg width="34" height="34" viewBox="0 0 40 40">
                <path d="M4 36 L18 22" stroke="#e5e7eb" strokeWidth="2.5" />
                <path d="M16 24 L30 10" stroke={["#f43f5e", "#38bdf8", "#facc15"][i]} strokeWidth="5" strokeLinecap="round" />
                <path d="M28 12 L38 2 L34 12 L38 14 Z" fill={["#f43f5e", "#38bdf8", "#facc15"][i]} />
              </svg>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="px-3 pb-1 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => {
          const d = darts[i];
          return (
            <div key={i} className={cls("glass rounded-xl py-1.5 text-center", d && d.t.mult >= 2.5 && "ring-1 ring-gold-300")}>
              <div className="text-[9px] font-black text-white/45">DARDO {i + 1}</div>
              <div className={cls("font-extrabold text-sm", !d ? "text-white/25" : d.t.mult >= 1.5 ? "text-win-400" : d.t.mult > 0 ? "text-white" : "text-loss-400")}>{d ? `${AREA[d.t.area]} ${d.t.area >= 1 && d.t.area <= 3 ? NUMS[d.t.sector] : ""} · ${MULT[d.t.area]}x` : "—"}</div>
            </div>
          );
        })}
      </div>
      <Footer>
        {total != null && <div className={cls("text-center font-display font-black text-xl", total >= 1 ? "text-win-400" : "text-white/60")}>Média {fmtMult(total)} · {fmt(bet * total)}</div>}
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy || bet < 3} onClick={play}>ARREMESSAR 3 DARDOS</Btn>
        <ShareLink id={lastId} />
      </Footer>
    </GameShell>
  );
}
