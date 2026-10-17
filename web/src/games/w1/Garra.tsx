import { motion, useAnimationControls } from "framer-motion";
import { useMemo, useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, Hist, ShareLink, useHist } from "./common";

const TIERS = [
  { m: 0, name: "Nada", color: "#64748b" },
  { m: 0.5, name: "Bolinha", color: "#94a3b8" },
  { m: 1, name: "Pinguim", color: "#38bdf8" },
  { m: 2, name: "Ursinho", color: "#a3e635" },
  { m: 3, name: "Coelho", color: "#f472b6" },
  { m: 10, name: "Unicórnio", color: "#c084fc" },
  { m: 50, name: "Dragão", color: "#f97316" },
  { m: 250, name: "Coroa", color: "#facc15" },
];
const LANES = 5;

function Plush({ tier, size = 44 }: { tier: number; size?: number }) {
  const t = TIERS[Math.max(1, tier)];
  const c = t.color;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]">
      {tier === 7 ? (
        <>
          <path d="M14 70 L20 30 L38 50 L50 20 L62 50 L80 30 L86 70 Z" fill={c} stroke="#a16207" strokeWidth="4" strokeLinejoin="round" />
          <rect x="14" y="68" width="72" height="14" rx="4" fill="#eab308" stroke="#a16207" strokeWidth="4" />
          <circle cx="50" cy="56" r="7" fill="#ef4444" />
        </>
      ) : (
        <>
          {tier === 4 && <><ellipse cx="36" cy="18" rx="8" ry="20" fill={c} /><ellipse cx="64" cy="18" rx="8" ry="20" fill={c} /></>}
          {tier === 3 && <><circle cx="26" cy="30" r="12" fill={c} /><circle cx="74" cy="30" r="12" fill={c} /></>}
          {tier === 5 && <path d="M50 4 L44 30 L56 30 Z" fill="#fde047" />}
          {tier === 6 && <><path d="M18 30 L28 10 L34 32 Z M82 30 L72 10 L66 32 Z" fill={c} /><path d="M10 60 Q0 40 20 46 M90 60 Q100 40 80 46" stroke={c} strokeWidth="8" fill="none" /></>}
          <circle cx="50" cy="56" r="34" fill={c} />
          <ellipse cx="50" cy="66" rx="18" ry="12" fill="#fff" opacity=".6" />
          <circle cx="38" cy="50" r="5" fill="#111" />
          <circle cx="62" cy="50" r="5" fill="#111" />
          <circle cx="40" cy="48" r="1.6" fill="#fff" />
          <circle cx="64" cy="48" r="1.6" fill="#fff" />
          <path d="M44 64 Q50 70 56 64" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="30" cy="62" r="5" fill="#fb7185" opacity=".6" />
          <circle cx="70" cy="62" r="5" fill="#fb7185" opacity=".6" />
        </>
      )}
    </svg>
  );
}

export default function Garra() {
  const [bet, setBet] = useBet("garra");
  const [lane, setLane] = useState(2);
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [lastId, setLastId] = useState<number | null>(null);
  const [hist, push] = useHist("garra");
  const rope = useAnimationControls();
  const prizeCtl = useAnimationControls();
  const pile = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ tier: 1 + ((i * 3 + (i >> 2)) % 7), x: ((i * 37) % 92) + 4, y: (i * 13) % 30, r: ((i * 29) % 40) - 20 })), []);

  async function grab() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    setHeld(null);
    haptic.impact("medium");
    const r = await playInstant<{ tier: number; slip: number; multiplier: number }>("garra", bet, { lane });
    if (!r) return setBusy(false);
    const sf = speedFactor();
    sfx.whoosh();
    await rope.start({ height: "62%", transition: { duration: 0.9 * sf, ease: "easeIn" } });
    sfx.click();
    const tier = r.result.tier;
    if (tier > 0 || r.result.slip === 0) setHeld(Math.max(1, tier));
    await sleep(250 * sf);
    await rope.start({ height: "14%", transition: { duration: 0.9 * sf, ease: "easeOut" } });
    if (tier === 0 && r.result.slip === 0) {
      // escorregou no caminho
      sfx.pop();
      prizeCtl.set({ y: 0, opacity: 1 });
      await prizeCtl.start({ y: 160, opacity: 0, transition: { duration: 0.6 * sf, ease: "easeIn" } });
      setHeld(null);
      setMsg("Escorregou!");
    } else if (tier === 0) {
      setMsg("A garra voltou vazia");
    } else {
      // leva até a saída (lado esquerdo)
      setMsg(`${TIERS[tier].name} · ${fmtMult(TIERS[tier].m)}`);
      sfx.coin();
    }
    push(r.result.multiplier, r.result.multiplier >= 1);
    if (r.payout > bet) setLastId(r.roundId);
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  return (
    <GameShell
      title="Garra de Pelúcia"
      game="garra"
      bg="radial-gradient(80% 50% at 50% 10%, rgba(236,72,153,0.35), transparent 70%), linear-gradient(180deg,#1a0718,#08030a)"
      info={<><p>Posicione a garra e tente pegar uma pelúcia. Cada pelúcia vale um prêmio: Bolinha 0,5x · Pinguim 1x · Ursinho 2x · Coelho 3x · Unicórnio 10x · Dragão 50x · Coroa 250x.</p><p>A posição da garra é só diversão: o resultado é sorteado pelo servidor (provably fair). RTP 97,5%.</p></>}
    >
      <Hist items={hist} />
      <div className="flex-1 min-h-0 flex items-center justify-center px-3 py-2">
        <div className="relative w-full max-w-[380px] h-full max-h-[520px] rounded-[28px] p-3" style={{ background: "linear-gradient(180deg,#db2777,#9d174d)", boxShadow: "0 20px 50px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.3)" }}>
          <div className="absolute top-2 inset-x-0 text-center text-[11px] font-black tracking-[0.3em] text-pink-100">★ PEGA-PELÚCIA ★</div>
          <div className="relative mt-5 h-[calc(100%-1.5rem)] rounded-2xl overflow-hidden border-4 border-pink-950/60" style={{ background: "linear-gradient(180deg,rgba(224,242,254,0.12),rgba(167,139,250,0.18))" }}>
            {/* trilho */}
            <div className="absolute top-2 inset-x-2 h-2 rounded bg-slate-300/70" />
            {/* garra */}
            <motion.div className="absolute top-2 w-16 -ml-8 flex flex-col items-center z-20" animate={{ left: `${10 + lane * 20}%` }} transition={{ type: "spring", damping: 18 }} style={{ height: "100%" }}>
              <div className="w-6 h-4 rounded bg-slate-400 border border-slate-600" />
              <motion.div animate={rope} initial={{ height: "14%" }} className="w-0.5 bg-slate-300" style={{ height: "14%" }} />
              <div className="relative -mt-1">
                <svg width="56" height="34" viewBox="0 0 56 34">
                  <rect x="20" y="0" width="16" height="10" rx="3" fill="#94a3b8" />
                  <path d={busy ? "M22 8 Q8 18 16 32 M34 8 Q48 18 40 32" : "M22 8 Q2 16 8 30 M34 8 Q54 16 48 30"} stroke="#cbd5e1" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
                {held != null && (
                  <motion.div animate={prizeCtl} className="absolute left-1/2 -translate-x-1/2 top-5">
                    <Plush tier={held} size={46} />
                  </motion.div>
                )}
              </div>
            </motion.div>
            {/* pilha de prêmios */}
            <div className="absolute inset-x-0 bottom-0 h-[38%]">
              {pile.map((p, i) => (
                <div key={i} className="absolute" style={{ left: `${p.x}%`, bottom: `${p.y}%`, transform: `translateX(-50%) rotate(${p.r}deg)` }}>
                  <Plush tier={p.tier} size={42} />
                </div>
              ))}
            </div>
            {msg && (
              <motion.div initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-x-0 top-[36%] text-center z-30">
                <span className={cls("rounded-xl px-3 py-1.5 font-display font-black text-lg bg-black/60", msg.includes("x") ? "text-gold-300" : "text-white/80")}>{msg}</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <Footer>
        <div className="flex gap-2 items-center">
          <Btn variant="glass" size="lg" className="w-16" disabled={busy || lane === 0} onClick={() => setLane(lane - 1)}>◀</Btn>
          <div className="flex-1 flex justify-center gap-1.5">
            {Array.from({ length: LANES }).map((_, i) => <span key={i} className={cls("w-2.5 h-2.5 rounded-full", i === lane ? "bg-pink-400" : "bg-white/15")} />)}
          </div>
          <Btn variant="glass" size="lg" className="w-16" disabled={busy || lane === LANES - 1} onClick={() => setLane(lane + 1)}>▶</Btn>
        </div>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={grab}>PEGAR · {fmt(bet)}</Btn>
        <ShareLink id={lastId} />
      </Footer>
    </GameShell>
  );
}
