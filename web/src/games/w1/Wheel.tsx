import { animate, motion, useMotionValue } from "framer-motion";
import { useMemo, useState } from "react";
import { cls, fmt, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Chips, finishFx, Footer, Hist, ShareLink, useHist, usePersist } from "./common";

/** Mesma tabela do servidor. */
export function wheelTable(n: number, risk: string): number[] {
  const out: number[] = [];
  if (risk === "low") {
    const base = [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0];
    for (let i = 0; i < n; i++) out.push(base[i % 10]);
  } else if (risk === "medium") {
    const base = [0, 1.9, 0, 1.5, 0, 2, 0, 1.5, 0, 3];
    for (let i = 0; i < n; i++) out.push(base[i % 10]);
    if (n >= 30) {
      const k = out.lastIndexOf(3);
      const extra = n / 10 - 1;
      let removed = 0;
      for (let i = 0; i < out.length && removed < extra; i++)
        if (out[i] === 3 && i !== k) {
          out[i] = 0;
          removed++;
        }
      out[k] = 3 * (extra + 1);
    }
  } else {
    for (let i = 0; i < n; i++) out.push(0);
    out[0] = Math.floor(0.99 * n * 100 + 1e-9) / 100;
  }
  return out;
}

const colorOf = (m: number) => (m === 0 ? "#334155" : m < 1.3 ? "#64748b" : m < 1.6 ? "#22c55e" : m < 2.1 ? "#3b82f6" : m < 3.1 ? "#a855f7" : m < 10 ? "#f59e0b" : "#ef4444");

export default function Wheel() {
  const [bet, setBet] = useBet("wheel");
  const [segments, setSegments] = usePersist("wheel_n", 30);
  const [risk, setRisk] = usePersist("wheel_r", "medium");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ index: number; m: number } | null>(null);
  const [lastId, setLastId] = useState<number | null>(null);
  const [hist, push] = useHist("wheel");
  const rot = useMotionValue(0);
  const table = useMemo(() => wheelTable(segments, risk), [segments, risk]);
  const seg = 360 / segments;
  const legend = [...new Set(table)].sort((a, b) => a - b);

  async function spin() {
    if (busy) return;
    setBusy(true);
    setResult(null);
    haptic.impact("medium");
    const r = await playInstant<{ index: number; multiplier: number }>("wheel", bet, { segments, risk });
    if (!r) return setBusy(false);
    sfx.spinStart();
    // o segmento i fica centrado em i·seg; o ponteiro está no topo (0°)
    const cur = rot.get();
    const base = Math.ceil(cur / 360) * 360 + 360 * 5;
    const jitter = (Math.random() - 0.5) * seg * 0.7;
    const target = base - r.result.index * seg + jitter;
    let lastSeg = -1;
    await animate(rot, target, {
      duration: 4.2 * speedFactor(),
      ease: [0.12, 0.7, 0.18, 1],
      onUpdate: (x) => {
        const s = Math.floor(((x % 360) + 360) % 360 / seg);
        if (s !== lastSeg) {
          lastSeg = s;
          sfx.tick();
        }
      },
    });
    setResult({ index: r.result.index, m: r.result.multiplier });
    push(r.result.multiplier, r.result.multiplier >= 1);
    if (r.payout > 0) setLastId(r.roundId);
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  const R = 140;
  const arc = (i: number) => {
    const a0 = ((i - 0.5) * seg - 90) * (Math.PI / 180);
    const a1 = ((i + 0.5) * seg - 90) * (Math.PI / 180);
    return `M0 0 L${R * Math.cos(a0)} ${R * Math.sin(a0)} A${R} ${R} 0 0 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)} Z`;
  };

  return (
    <GameShell
      title="Roda Wheel"
      game="wheel"
      bg="radial-gradient(70% 45% at 50% 35%, rgba(168,85,247,0.35), transparent 70%), linear-gradient(180deg,#0e0920,#05030c)"
      info={<><p>Gire a roda e receba o multiplicador do segmento onde o ponteiro parar. Escolha de 10 a 50 segmentos e o risco.</p><p>Baixo: quase sempre 1,2x · Médio: metade zera, o resto paga 1,5x a 15x · Alto: um único segmento paga 0,99 × número de segmentos (até 49,5x). RTP 99%.</p></>}
    >
      <Hist items={hist} />
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="relative w-[min(86vw,360px)] aspect-square">
          <div className="absolute inset-0 rounded-full shadow-[0_0_60px_rgba(168,85,247,0.35)]" />
          <motion.svg viewBox="-150 -150 300 300" className="absolute inset-0 w-full h-full" style={{ rotate: rot }}>
            <circle r="148" fill="#1e1b4b" stroke="#fde68a" strokeWidth="4" />
            {table.map((m, i) => (
              <path key={i} d={arc(i)} fill={colorOf(m)} stroke="#0f0a24" strokeWidth="1.5" opacity={result && result.index !== i ? 0.55 : 1} />
            ))}
            {segments <= 30 &&
              table.map((m, i) =>
                m > 0 ? (
                  <text key={i} transform={`rotate(${i * seg}) translate(0 -112) rotate(${0})`} textAnchor="middle" fontSize={segments <= 10 ? 13 : 9} fontWeight="900" fill="#fff">
                    {m}x
                  </text>
                ) : null,
              )}
            <circle r="74" fill="#0f0a24" stroke="#fde68a" strokeWidth="3" />
            {Array.from({ length: segments }).map((_, i) => (
              <circle key={i} cx={Math.cos(((i + 0.5) * seg - 90) * (Math.PI / 180)) * 144} cy={Math.sin(((i + 0.5) * seg - 90) * (Math.PI / 180)) * 144} r="2.4" fill="#fef3c7" />
            ))}
          </motion.svg>
          {/* ponteiro */}
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 z-10">
            <svg width="34" height="40" viewBox="0 0 34 40">
              <path d="M17 38 L4 8 Q17 -2 30 8 Z" fill="#fde047" stroke="#78350f" strokeWidth="2" />
            </svg>
          </div>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <motion.div key={result?.index ?? -1} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className={cls("font-display font-black text-4xl tabular", result ? (result.m >= 1 ? "text-win-400" : "text-loss-400") : "text-white/80")}>{result ? fmtMult(result.m) : "GIRAR"}</div>
              {result && <div className="text-[11px] font-black text-white/60">{result.m > 0 ? `+${fmt(bet * result.m)}` : "sem prêmio"}</div>}
            </motion.div>
          </div>
        </div>
      </div>
      <div className="px-3 pb-1 flex gap-1.5 justify-center flex-wrap">
        {legend.map((m) => (
          <span key={m} className="flex items-center gap-1 rounded-lg px-2 py-0.5 bg-white/5 text-[10px] font-black">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorOf(m) }} />
            {m}x · {table.filter((x) => x === m).length}
          </span>
        ))}
      </div>
      <Footer>
        <Chips value={risk} onChange={setRisk} disabled={busy} options={[{ value: "low", label: "Baixo" }, { value: "medium", label: "Médio" }, { value: "high", label: "Alto" }]} />
        <Chips value={segments} onChange={setSegments} disabled={busy} options={[10, 20, 30, 40, 50].map((n) => ({ value: n, label: String(n) }))} />
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={spin}>GIRAR · {fmt(bet)}</Btn>
        <ShareLink id={lastId} />
      </Footer>
    </GameShell>
  );
}
