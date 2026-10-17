import { motion, useAnimation } from "framer-motion";
import { useState } from "react";
import { cls, fmt, sleep } from "../lib/format";
import { sfx } from "../lib/sound";
import { speedFactor } from "../lib/store";
import { haptic } from "../lib/tg";
import { celebrate, ResultBanner } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { BetInput, Btn, useBet } from "../ui/kit";

type Pick = { type: "number" | "even" | "odd" | "low" | "high"; value?: number };
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};
// rotação do cubo que deixa cada face de frente
const FACE_ROT: Record<number, { x: number; y: number }> = { 1: { x: 0, y: 0 }, 2: { x: 0, y: -90 }, 3: { x: -90, y: 0 }, 4: { x: 90, y: 0 }, 5: { x: 0, y: 90 }, 6: { x: 0, y: 180 } };

function Face({ n, transform }: { n: number; transform: string }) {
  return (
    <div className="absolute inset-0 rounded-[22px] [backface-visibility:hidden]" style={{ transform, background: "linear-gradient(145deg, #ffffff, #ddd6fe)", boxShadow: "inset 0 -6px 12px rgba(76,29,149,0.25), inset 0 4px 8px rgba(255,255,255,0.9)" }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {PIPS[n].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="9" fill={n === 1 ? "#e11d48" : "#2e1065"} />
        ))}
      </svg>
    </div>
  );
}

export default function Dice() {
  const [bet, setBet] = useBet("dice");
  const [pick, setPick] = useState<Pick>({ type: "high" });
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ roll: number; win: boolean; payout: number; mult: number; id: number } | null>(null);
  const cube = useAnimation();
  const size = 120;
  const half = size / 2;

  async function roll() {
    if (busy) return;
    setBusy(true);
    setRes(null);
    haptic.impact("medium");
    sfx.whoosh();
    const spinning = cube.start({ rotateX: [0, 720], rotateY: [0, 540], transition: { duration: 0.8 * speedFactor(), ease: "linear", repeat: Infinity } });
    void spinning;
    const r = await playInstant<{ roll: number; win: boolean; multiplier: number }>("dice", bet, pick);
    if (!r) {
      cube.stop();
      setBusy(false);
      return;
    }
    const f = FACE_ROT[r.result.roll];
    await cube.start({ rotateX: 1080 + f.x, rotateY: 1080 + f.y, transition: { type: "spring", damping: 14, stiffness: 90 } });
    sfx.reelStop();
    haptic.impact("heavy");
    setRes({ roll: r.result.roll, win: r.result.win, payout: r.payout, mult: r.result.multiplier, id: r.roundId });
    await celebrate(r.payout, bet);
    if (!r.result.win) sfx.lose();
    await sleep(200);
    cube.set({ rotateX: f.x, rotateY: f.y });
    setBusy(false);
  }

  const opt = (p: Pick, label: string, mult: string) => {
    const on = p.type === pick.type && p.value === pick.value;
    return (
      <button key={label} onClick={() => { haptic.tap(); sfx.chip(); setPick(p); }} disabled={busy} className={cls("press rounded-2xl h-14 flex flex-col items-center justify-center", on ? "btn-violet" : "glass")}>
        <span className="font-extrabold text-sm">{label}</span>
        <span className={cls("text-[10px] font-black", on ? "text-white/80" : "text-gold-300/80")}>{mult}</span>
      </button>
    );
  };

  return (
    <GameShell title="Dados" game="dice" info={<><p>Escolha um número exato (paga 5,82x) ou par, ímpar, baixo (1–3) ou alto (4–6), que pagam 1,94x.</p><p>RTP 97%.</p></>}>
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="[perspective:900px]" style={{ width: size, height: size }}>
          <motion.div animate={cube} className="relative w-full h-full [transform-style:preserve-3d]">
            <Face n={1} transform={`translateZ(${half}px)`} />
            <Face n={6} transform={`rotateY(180deg) translateZ(${half}px)`} />
            <Face n={2} transform={`rotateY(90deg) translateZ(${half}px)`} />
            <Face n={5} transform={`rotateY(-90deg) translateZ(${half}px)`} />
            <Face n={3} transform={`rotateX(90deg) translateZ(${half}px)`} />
            <Face n={4} transform={`rotateX(-90deg) translateZ(${half}px)`} />
          </motion.div>
        </div>
        <div className="w-40 h-4 rounded-full bg-black/40 blur-md -mt-4" />
        <div className="h-16"><ResultBanner show={!!res} win={!!res?.win} amount={res?.payout} mult={res?.mult} label={res && !res.win ? `Saiu ${res.roll}` : undefined} /></div>
        {res?.win && !busy && <button onClick={() => shareRound(res.id)} className="text-[11px] font-black text-plasma-400 press -mt-4">COMPARTILHAR ↗</button>}
      </div>
      <div className="px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <div className="grid grid-cols-6 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((n) => {
            const on = pick.type === "number" && pick.value === n;
            return (
              <button key={n} disabled={busy} onClick={() => { haptic.tap(); sfx.chip(); setPick({ type: "number", value: n }); }} className={cls("press aspect-square rounded-xl p-1.5", on ? "bg-gold-400 shadow-[0_0_16px_rgba(245,196,81,0.6)]" : "glass")}>
                <svg viewBox="0 0 100 100">{PIPS[n].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="10" fill={on ? "#3b2300" : "#e9d5ff"} />)}</svg>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {opt({ type: "low" }, "Baixo", "1,94x")}
          {opt({ type: "high" }, "Alto", "1,94x")}
          {opt({ type: "even" }, "Par", "1,94x")}
          {opt({ type: "odd" }, "Ímpar", "1,94x")}
        </div>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={roll}>
          ROLAR · ganha {fmt(bet * (pick.type === "number" ? 5.82 : 1.94))}
        </Btn>
      </div>
    </GameShell>
  );
}
