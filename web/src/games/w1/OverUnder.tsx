import { animate, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cls, fmt, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, Hist, ShareLink, useHist, usePersist } from "./common";

const mult = (chance: number) => Math.floor((98 / chance) * 10000 + 1e-9) / 10000;

export default function OverUnder() {
  const [bet, setBet] = useBet("overunder");
  const [target, setTarget] = usePersist("ou_t", 50);
  const [dir, setDir] = usePersist<"over" | "under">("ou_d", "over");
  const [roll, setRoll] = useState<number | null>(null);
  const [win, setWin] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [lastId, setLastId] = useState<number | null>(null);
  const [hist, push] = useHist("overunder");
  const autoRef = useRef(false);
  autoRef.current = auto;
  const chance = dir === "under" ? target : 100 - target;
  const m = mult(chance);

  async function play() {
    if (busy) return;
    setBusy(true);
    setWin(null);
    haptic.impact("light");
    const r = await playInstant<{ roll: number; win: boolean; multiplier: number }>("overunder", bet, { target, dir });
    if (!r) {
      setBusy(false);
      setAuto(false);
      return;
    }
    const from = roll ?? 50;
    await animate(from, r.result.roll, { duration: 0.45 * speedFactor(), ease: [0.2, 0.8, 0.2, 1], onUpdate: setRoll });
    setRoll(r.result.roll);
    setWin(r.result.win);
    push(r.result.roll, r.result.win);
    if (r.result.win) setLastId(r.roundId);
    if (r.result.win) sfx.win();
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  useEffect(() => {
    if (!auto || busy) return;
    const t = setTimeout(() => autoRef.current && play(), 350);
    return () => clearTimeout(t);
  }, [auto, busy]);

  const winZone = dir === "under" ? { left: 0, width: target } : { left: target, width: 100 - target };

  return (
    <GameShell
      title="Dados Over/Under"
      game="overunder"
      bg="radial-gradient(80% 50% at 50% 20%, rgba(139,92,246,0.35), transparent 70%), linear-gradient(180deg,#0d0a1f,#05040c)"
      info={<><p>Sorteio de um número de 0,00 a 99,99. Escolha o alvo (2 a 98) e se o número vai sair acima ou abaixo dele. Quanto menor a chance, maior o multiplicador.</p><p>Multiplicador = 98 ÷ chance (%). RTP 98%.</p></>}
    >
      <Hist items={hist} format={(x) => x.toFixed(2)} />
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-8 px-5">
        <motion.div key={String(win)} initial={{ scale: win == null ? 1 : 1.25 }} animate={{ scale: 1 }} className={cls("font-display font-black text-[68px] tabular leading-none", win == null ? "text-white" : win ? "text-win-400" : "text-loss-400")}>
          {roll == null ? "––.––" : roll.toFixed(2)}
        </motion.div>
        <div className="w-full max-w-[420px]">
          <div className="relative h-4 rounded-full bg-loss-500/60 overflow-visible">
            <div className="absolute top-0 bottom-0 rounded-full bg-win-500" style={{ left: `${winZone.left}%`, width: `${winZone.width}%` }} />
            {roll != null && (
              <motion.div className="absolute -top-9 -translate-x-1/2" style={{ left: `${roll}%` }}>
                <div className={cls("rounded-lg px-1.5 py-0.5 text-[11px] font-black tabular shadow-lg", win ? "bg-win-500 text-space-950" : win === false ? "bg-loss-500" : "bg-white text-space-950")}>{roll.toFixed(2)}</div>
                <div className="mx-auto w-0 h-0 border-x-[6px] border-x-transparent border-t-[7px] border-t-white" />
              </motion.div>
            )}
            <input type="range" min={2} max={98} step={1} value={target} disabled={busy || auto} onChange={(e) => { setTarget(Number(e.target.value)); haptic.tap(); sfx.tick(); }} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-lg bg-white shadow-[0_0_14px_rgba(255,255,255,0.6)] grid place-items-center text-[9px] font-black text-space-950 pointer-events-none" style={{ left: `${target}%` }}>
              ‖
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-black text-white/35 mt-2 tabular">
            {[0, 25, 50, 75, 100].map((x) => <span key={x}>{x}</span>)}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full max-w-[420px]">
          <div className="glass rounded-2xl p-2 text-center">
            <div className="text-[9px] font-black text-white/45">MULTIPLICADOR</div>
            <div className="font-extrabold tabular">{fmtMult(m)}</div>
          </div>
          <button onClick={() => !busy && setDir(dir === "over" ? "under" : "over")} className="glass rounded-2xl p-2 text-center press">
            <div className="text-[9px] font-black text-white/45">{dir === "over" ? "ACIMA DE" : "ABAIXO DE"} ⇄</div>
            <div className="font-extrabold tabular">{target.toFixed(2)}</div>
          </button>
          <div className="glass rounded-2xl p-2 text-center">
            <div className="text-[9px] font-black text-white/45">CHANCE</div>
            <div className="font-extrabold tabular">{chance}%</div>
          </div>
        </div>
      </div>
      <Footer>
        <BetInput value={bet} onChange={setBet} disabled={auto} />
        <div className="flex gap-2">
          <Btn variant={auto ? "red" : "glass"} size="lg" className="w-24" onClick={() => setAuto(!auto)}>{auto ? "PARAR" : "AUTO"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse={!busy} disabled={busy || auto} onClick={play}>ROLAR · ganha {fmt(bet * m)}</Btn>
        </div>
        <ShareLink id={lastId} />
      </Footer>
    </GameShell>
  );
}
