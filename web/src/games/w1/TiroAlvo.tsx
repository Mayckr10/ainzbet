import { motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Chips, finishFx, Footer, Hist, ShareLink, useHist, usePersist } from "./common";

const TABLES: Record<string, { p: number[]; m: number[] }> = {
  low: { p: [0.02, 0.13, 0.35, 0.3, 0.2], m: [6, 2, 1.1, 0.68, 0] },
  medium: { p: [0.01, 0.06, 0.2, 0.33, 0.4], m: [20, 5, 1.5, 0.5, 0] },
  high: { p: [0.002, 0.02, 0.1, 0.25, 0.628], m: [200, 15, 2.7, 0, 0] },
};
// raios (fração do raio do alvo) de cada anel: [interno, externo]
const RINGS: [number, number][] = [[0, 0.1], [0.1, 0.3], [0.3, 0.55], [0.55, 0.82], [0.86, 1.05]];
const RING_COLORS = ["#facc15", "#ef4444", "#3b82f6", "#f8fafc", "#1f2937"];

export default function TiroAlvo() {
  const [bet, setBet] = useBet("tiro-alvo");
  const [risk, setRisk] = usePersist("ta_r", "medium");
  const [shots, setShots] = useState<{ x: number; y: number; ring: number; k: number }[]>([]);
  const [aiming, setAiming] = useState(false);
  const [last, setLast] = useState<{ ring: number; m: number } | null>(null);
  const [lastId, setLastId] = useState<number | null>(null);
  const [hist, push] = useHist("tiro-alvo");
  const T = TABLES[risk];

  async function shoot() {
    if (aiming) return;
    setAiming(true);
    setLast(null);
    haptic.impact("light");
    const r = await playInstant<{ ring: number; angle: number; depth: number; multiplier: number }>("tiro-alvo", bet, { risk });
    if (!r) return setAiming(false);
    await sleep(650 * speedFactor());
    const [a, b] = RINGS[r.result.ring];
    const rad = a + (b - a) * (0.15 + 0.7 * r.result.depth);
    const x = 50 + Math.cos(r.result.angle) * rad * 46;
    const y = 50 + Math.sin(r.result.angle) * rad * 46;
    sfx.explode();
    haptic.impact("heavy");
    setShots((s) => [...s.slice(-6), { x, y, ring: r.result.ring, k: Date.now() }]);
    setLast({ ring: r.result.ring, m: r.result.multiplier });
    push(r.result.multiplier, r.result.multiplier >= 1);
    setAiming(false);
    if (r.payout > bet) setLastId(r.roundId);
    await finishFx(r.payout, bet);
  }

  return (
    <GameShell
      title="Tiro ao Alvo"
      game="tiro-alvo"
      bg="radial-gradient(80% 50% at 50% 30%, rgba(234,88,12,0.25), transparent 70%), linear-gradient(180deg,#1a0f07,#080503)"
      info={<><p>Mire e atire: o anel atingido define o prêmio. Quanto maior o risco, mais difícil acertar a mosca, mas ela paga muito mais.</p><p>Baixo: mosca 6x · Médio: mosca 20x · Alto: mosca 200x. O ponto do tiro é sorteado no servidor. RTP ≈ 97%.</p></>}
    >
      <Hist items={hist} />
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="relative w-[min(84vw,340px)] aspect-square">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-[0_14px_30px_rgba(0,0,0,0.6)]">
            <circle cx="50" cy="50" r="49" fill="#78350f" />
            <circle cx="50" cy="50" r="46" fill="#1f2937" />
            {[3, 2, 1, 0].map((k) => (
              <circle key={k} cx="50" cy="50" r={RINGS[k][1] * 46} fill={RING_COLORS[k]} stroke="#111" strokeWidth=".6" />
            ))}
            {[0, 1, 2, 3].map((k) => (
              <text key={k} x="50" y={50 - ((RINGS[k][0] + RINGS[k][1]) / 2) * 46 + 1.6} textAnchor="middle" fontSize="4.2" fontWeight="900" fill={k === 3 ? "#111" : "#fff"} opacity={T.m[k] ? 1 : 0.4}>
                {k === 0 ? "" : `${T.m[k]}x`}
              </text>
            ))}
            <text x="50" y="51.6" textAnchor="middle" fontSize="3.6" fontWeight="900" fill="#111">{T.m[0]}x</text>
          </svg>
          {shots.map((s, i) => (
            <motion.div key={s.k} initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: i === shots.length - 1 ? 1 : 0.45 }} className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${s.x}%`, top: `${s.y}%`, background: "radial-gradient(circle,#000 0 35%,#57534e 40%,transparent 70%)" }} />
          ))}
          {aiming && (
            <motion.div className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 pointer-events-none" initial={{ left: "30%", top: "60%" }} animate={{ left: ["30%", "62%", "44%", "56%", "50%"], top: ["60%", "38%", "56%", "46%", "50%"] }} transition={{ duration: 0.65 * speedFactor() }}>
              <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#22c55e" strokeWidth="4" /><path d="M50 4 V30 M50 70 V96 M4 50 H30 M70 50 H96" stroke="#22c55e" strokeWidth="4" /></svg>
            </motion.div>
          )}
          {last && (
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -bottom-10 inset-x-0 text-center">
              <span className={cls("font-display font-black text-2xl", last.m >= 1 ? "text-win-400" : last.m > 0 ? "text-gold-300" : "text-loss-400")}>{last.ring === 0 ? "NA MOSCA! " : last.ring === 4 ? "Errou o alvo · " : ""}{fmtMult(last.m)}</span>
            </motion.div>
          )}
        </div>
      </div>
      <Footer>
        <div className="flex gap-1">
          {T.m.slice(0, 4).map((m, k) => (
            <div key={k} className="flex-1 rounded-lg bg-white/5 py-1 text-center">
              <div className="text-[11px] font-black tabular" style={{ color: RING_COLORS[k] === "#f8fafc" ? "#e2e8f0" : RING_COLORS[k] }}>{fmtMult(m)}</div>
              <div className="text-[9px] text-white/40 font-bold">{(T.p[k] * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
        <Chips value={risk} onChange={setRisk} disabled={aiming} options={[{ value: "low", label: "Baixo" }, { value: "medium", label: "Médio" }, { value: "high", label: "Alto" }]} />
        <BetInput value={bet} onChange={setBet} disabled={aiming} />
        <Btn variant="gold" size="lg" pulse={!aiming} disabled={aiming} onClick={shoot}>ATIRAR · mosca paga {fmt(bet * T.m[0])}</Btn>
        <ShareLink id={lastId} />
      </Footer>
    </GameShell>
  );
}
