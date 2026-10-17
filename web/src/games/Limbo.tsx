import { animate, motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtMult } from "../lib/format";
import { sfx } from "../lib/sound";
import { speedFactor } from "../lib/store";
import { haptic } from "../lib/tg";
import { celebrate } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { BetInput, Btn, useBet } from "../ui/kit";

export default function Limbo() {
  const [bet, setBet] = useBet("limbo");
  const [target, setTarget] = useState(2);
  const [shown, setShown] = useState(1);
  const [state, setState] = useState<"idle" | "win" | "lose">("idle");
  const [busy, setBusy] = useState(false);
  const [hist, setHist] = useState<{ v: number; win: boolean }[]>([]);
  const [lastId, setLastId] = useState<number | null>(null);

  async function play() {
    if (busy) return;
    setBusy(true);
    setState("idle");
    haptic.impact("medium");
    const r = await playInstant<{ result: number; win: boolean }>("limbo", bet, { target });
    if (!r) return setBusy(false);
    const end = r.result.result;
    let last = 0;
    await animate(1, end, {
      duration: Math.min(1.4, 0.4 + Math.log10(end) * 0.35) * speedFactor(),
      ease: [0.1, 0.7, 0.3, 1],
      onUpdate: (v) => {
        setShown(v);
        if (performance.now() - last > 60) {
          last = performance.now();
          sfx.tick();
        }
      },
    });
    setShown(end);
    setState(r.result.win ? "win" : "lose");
    setHist((h) => [{ v: end, win: r.result.win }, ...h].slice(0, 14));
    setLastId(r.roundId);
    if (!r.result.win) {
      sfx.lose();
      haptic.error();
    }
    await celebrate(r.payout, bet);
    setBusy(false);
  }

  const chance = Math.min(99, 99 / target);

  return (
    <GameShell title="Limbo" game="limbo" info={<><p>Escolha um multiplicador-alvo. O jogo sorteia um número; se for maior ou igual ao alvo, você recebe aposta × alvo.</p><p>Chance de ganhar = 99% ÷ alvo. Máximo 50.000x.</p></>}>
      <div className="px-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {hist.map((h, i) => <span key={i} className={cls("shrink-0 rounded-lg px-2 py-1 text-[11px] font-black tabular", h.win ? "bg-win-500/20 text-win-400" : "bg-white/5 text-white/50")}>{fmtMult(h.v)}</span>)}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <motion.div className="absolute w-72 h-72 rounded-full" animate={{ scale: busy ? [1, 1.15, 1] : 1, opacity: state === "win" ? 0.6 : 0.3 }} transition={{ repeat: busy ? Infinity : 0, duration: 0.8 }} style={{ background: `radial-gradient(circle, ${state === "win" ? "#22c55e" : state === "lose" ? "#ef4444" : "#7c3aed"}55, transparent 70%)` }} />
        <motion.div key={state} initial={{ scale: state === "idle" ? 1 : 1.25 }} animate={{ scale: 1 }} className={cls("relative font-display font-black text-[64px] tabular", state === "win" ? "text-win-400" : state === "lose" ? "text-loss-400" : "text-white")}>
          {fmtMult(shown)}
        </motion.div>
        <div className="text-sm font-bold text-white/50">alvo {fmtMult(target)}</div>
        {state === "win" && lastId && !busy && <button onClick={() => shareRound(lastId)} className="mt-3 text-[11px] font-black text-plasma-400 press">COMPARTILHAR ↗</button>}
      </div>
      <div className="px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <div className="grid grid-cols-2 gap-2">
          <div className="glass rounded-2xl p-2 px-3">
            <div className="text-[10px] font-black text-white/45">MULTIPLICADOR</div>
            <input type="number" inputMode="decimal" step="0.01" value={target} onChange={(e) => setTarget(Number(e.target.value))} onBlur={() => setTarget(Math.max(1.01, Math.min(50000, Math.floor(target * 100) / 100 || 2)))} className="bg-transparent outline-none w-full font-extrabold text-lg tabular" />
          </div>
          <div className="glass rounded-2xl p-2 px-3">
            <div className="text-[10px] font-black text-white/45">CHANCE</div>
            <div className="font-extrabold text-lg tabular">{chance.toFixed(chance < 1 ? 4 : 2)}%</div>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[1.5, 2, 5, 10, 100, 1000].map((v) => (
            <button key={v} onClick={() => { haptic.tap(); setTarget(v); }} className={cls("press flex-1 h-8 rounded-lg text-[11px] font-black", target === v ? "btn-violet" : "glass text-white/70")}>{v}x</button>
          ))}
        </div>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={play}>APOSTAR · ganha {fmt(bet * target)}</Btn>
      </div>
    </GameShell>
  );
}
