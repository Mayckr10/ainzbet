import { animate, motion, useMotionValue } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Chips, finishFx, Footer, ShareLink, usePersist } from "./common";

const MULT = [0, 9.7, 97, 970, 9700];

export default function CofreSecreto() {
  const [bet, setBet] = useBet("cofre-secreto");
  const [digits, setDigits] = usePersist("cs_d", 2);
  const [code, setCode] = useState<number[]>([1, 2, 3, 4]);
  const [shown, setShown] = useState<(number | null)[]>([null, null, null, null]);
  const [match, setMatch] = useState<boolean[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastId, setLastId] = useState<number | null>(null);
  const dial = useMotionValue(0);

  const bump = (i: number, d: number) => {
    if (busy) return;
    haptic.tap();
    sfx.tick();
    setCode((c) => c.map((x, j) => (j === i ? (x + d + 10) % 10 : x)));
  };

  async function play() {
    if (busy) return;
    setBusy(true);
    setOpen(false);
    setMatch([]);
    setShown([null, null, null, null]);
    haptic.impact("medium");
    const guess = code.slice(0, digits).join("");
    const r = await playInstant<{ code: string; match: boolean[]; win: boolean }>("cofre-secreto", bet, { digits, code: guess });
    if (!r) return setBusy(false);
    for (let i = 0; i < digits; i++) {
      const d = Number(r.result.code[i]);
      await animate(dial, dial.get() + 360 + (i % 2 ? -1 : 1) * (d * 36), { duration: 0.55 * speedFactor(), ease: "easeOut", onUpdate: () => Math.random() < 0.3 && sfx.tick() });
      setShown((s) => s.map((x, j) => (j === i ? d : x)));
      setMatch((m) => [...m, r.result.match[i]]);
      r.result.match[i] ? sfx.gem() : sfx.click();
      await sleep(120);
    }
    if (r.result.win) {
      setOpen(true);
      setLastId(r.roundId);
      sfx.jackpot();
    }
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  return (
    <GameShell
      title="Cofre Secreto"
      game="cofre-secreto"
      bg="radial-gradient(70% 50% at 50% 30%, rgba(148,163,184,0.25), transparent 70%), linear-gradient(180deg,#0f1218,#05070a)"
      info={<><p>Adivinhe o segredo do cofre. Escolha quantos dígitos tentar (1 a 4) e monte o seu palpite; o segredo é sorteado pelo servidor.</p><p>Acertou todos os dígitos na ordem: 1 dígito paga 9,7x · 2 dígitos 97x · 3 dígitos 970x · 4 dígitos 9.700x. RTP 97%.</p></>}
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5 px-4">
        <div className="relative w-[min(78vw,300px)] aspect-square">
          <motion.div className="absolute inset-0 rounded-[28px] border-[6px] border-slate-500 shadow-[inset_0_0_30px_rgba(0,0,0,0.6),0_20px_40px_rgba(0,0,0,0.6)]" style={{ background: "linear-gradient(145deg,#64748b,#334155 60%,#1e293b)", transformOrigin: "left center" }} animate={{ rotateY: open ? -70 : 0 }} transition={{ type: "spring", damping: 16 }}>
            {[18, 82].map((y) => <div key={y} className="absolute -left-2 w-4 h-10 rounded bg-slate-400 border border-slate-700" style={{ top: `${y}%`, transform: "translateY(-50%)" }} />)}
            <motion.div className="absolute left-1/2 top-1/2 w-[58%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-slate-300" style={{ rotate: dial, background: "conic-gradient(from 0deg,#cbd5e1,#64748b,#cbd5e1,#64748b,#cbd5e1)" }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="absolute left-1/2 top-1/2 text-[11px] font-black text-slate-900" style={{ transform: `rotate(${i * 36}deg) translate(0, -78px) rotate(${-i * 36}deg) translate(-50%, -50%)` }}>{i}</span>
              ))}
              <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-slate-200 to-slate-500 border-2 border-slate-700" />
            </motion.div>
            <div className="absolute left-1/2 top-[13%] -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-[12px] border-t-red-500" />
          </motion.div>
          {open && <div className="absolute inset-4 rounded-2xl -z-10 grid place-items-center text-6xl" style={{ background: "radial-gradient(circle,#fde047,#a16207)" }}>💰</div>}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: digits }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <button onClick={() => bump(i, 1)} className="press w-12 h-7 rounded-lg glass text-xs">▲</button>
              <div className={cls("w-12 h-14 rounded-xl grid place-items-center font-display font-black text-3xl tabular border-2", match[i] == null ? "border-white/15 bg-black/30" : match[i] ? "border-win-400 bg-win-500/20 text-win-300" : "border-loss-400 bg-loss-500/15 text-loss-300")}>{code[i]}</div>
              <button onClick={() => bump(i, -1)} className="press w-12 h-7 rounded-lg glass text-xs">▼</button>
              <div className="h-5 text-[12px] font-black text-white/60 tabular">{shown[i] != null ? `= ${shown[i]}` : ""}</div>
            </div>
          ))}
        </div>
      </div>
      <Footer>
        <Chips value={digits} onChange={setDigits} disabled={busy} options={[1, 2, 3, 4].map((d) => ({ value: d, label: `${d} díg · ${fmtMult(MULT[d])}` }))} />
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-28" disabled={busy} onClick={() => setCode(code.map(() => (Math.random() * 10) | 0))}>SORTEAR</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse={!busy} disabled={busy} onClick={play}>ABRIR · {fmt(bet * MULT[digits])}</Btn>
        </div>
        <ShareLink id={lastId} />
      </Footer>
    </GameShell>
  );
}
