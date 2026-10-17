import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, ShareLink, usePersist } from "./common";

const PAYS: [number, string, number][] = [
  [6, "Sena", 50000],
  [5, "Quina", 10000],
  [4, "Quadra", 300],
  [3, "Terno", 50],
  [2, "Duque", 3],
];

export default function MegaSena() {
  const [bet, setBet] = useBet("megasena");
  const [picks, setPicks] = usePersist<number[]>("ms_p", []);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [res, setRes] = useState<{ hits: number; payout: number; id: number } | null>(null);

  function toggle(n: number) {
    if (busy) return;
    haptic.tap();
    sfx.chip();
    setDrawn([]);
    setRes(null);
    setPicks(picks.includes(n) ? picks.filter((x) => x !== n) : picks.length >= 6 ? picks : [...picks, n].sort((a, b) => a - b));
  }
  function surprise() {
    const s = new Set<number>();
    while (s.size < 6) s.add(1 + Math.floor(Math.random() * 60));
    setPicks([...s].sort((a, b) => a - b));
    setDrawn([]);
    setRes(null);
    sfx.whoosh();
  }

  async function play() {
    if (busy || picks.length !== 6) return;
    setBusy(true);
    setDrawn([]);
    setRes(null);
    haptic.impact("medium");
    const r = await playInstant<{ drawn: number[]; hits: number; multiplier: number }>("megasena", bet, { picks });
    if (!r) return setBusy(false);
    for (const n of r.result.drawn) {
      setSpinning(true);
      sfx.spinStart();
      await sleep(900 * speedFactor());
      setSpinning(false);
      setDrawn((d) => [...d, n]);
      picks.includes(n) ? (sfx.gem(), haptic.impact("medium")) : sfx.ball();
      await sleep(350 * speedFactor());
    }
    setRes({ hits: r.result.hits, payout: r.payout, id: r.roundId });
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  const hits = drawn.filter((n) => picks.includes(n)).length;

  return (
    <GameShell
      title="Mega Sena Virtual"
      game="megasena"
      bg="radial-gradient(80% 50% at 50% 0%, rgba(16,185,129,0.35), transparent 70%), linear-gradient(180deg,#03140c,#010804)"
      info={<><p>Escolha 6 dezenas de 01 a 60 (ou faça uma surpresinha). O globo sorteia 6 bolas. Quanto mais acertos, maior o prêmio.</p><p>Duque (2) 3x · Terno (3) 50x · Quadra (4) 300x · Quina (5) 10.000x · Sena (6) 50.000x. Fichas virtuais, sem relação com a loteria oficial. RTP ≈ 97%.</p></>}
    >
      <div className="flex items-center justify-center gap-4 pt-1 px-3">
        {/* globo */}
        <div className="relative w-24 h-24 shrink-0">
          <motion.div className="absolute inset-0 rounded-full border-4 border-emerald-200/60" style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35), rgba(16,185,129,0.15) 60%, rgba(0,0,0,0.3))" }} animate={{ rotate: spinning ? 360 : 0 }} transition={spinning ? { repeat: Infinity, duration: 0.6, ease: "linear" } : { duration: 0.3 }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span key={i} className="absolute w-3.5 h-3.5 rounded-full" style={{ left: `${20 + ((i * 37) % 60)}%`, top: `${20 + ((i * 53) % 60)}%`, background: ["#fde047", "#fff", "#86efac"][i % 3] }} animate={spinning ? { x: [0, 8, -6, 0], y: [0, -8, 6, 0] } : {}} transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.03 }} />
            ))}
          </motion.div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-3 rounded bg-emerald-900 border border-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-white/45 mb-1">SORTEIO</div>
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-9 h-9">
                <AnimatePresence>
                  {drawn[i] != null && (
                    <motion.div initial={{ scale: 0, y: -30 }} animate={{ scale: 1, y: 0 }} className={cls("w-9 h-9 rounded-full grid place-items-center text-[13px] font-black shadow-lg", picks.includes(drawn[i]) ? "bg-gradient-to-br from-yellow-200 to-yellow-500 text-[#3b2300] ring-2 ring-white" : "bg-gradient-to-br from-white to-slate-300 text-slate-800")}>
                      {String(drawn[i]).padStart(2, "0")}
                    </motion.div>
                  )}
                </AnimatePresence>
                {drawn[i] == null && <div className="w-9 h-9 rounded-full border-2 border-dashed border-white/15" />}
              </div>
            ))}
          </div>
          <div className="text-[11px] font-black mt-1 text-white/60">{drawn.length ? `${hits} acerto${hits === 1 ? "" : "s"}` : `${picks.length}/6 escolhidas`}</div>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col justify-center px-3 gap-2">
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => {
            const p = picks.includes(n);
            const d = drawn.includes(n);
            return (
              <button key={n} onClick={() => toggle(n)} className={cls("aspect-square rounded-md text-[11px] font-black grid place-items-center border", p && d ? "bg-yellow-400 text-[#3b2300] border-white" : p ? "bg-emerald-500 text-white border-emerald-300" : d ? "bg-white/25 border-white/40" : "bg-white/[0.04] border-white/5 text-white/65")}>
                {String(n).padStart(2, "0")}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {PAYS.map(([h, name, m]) => (
            <div key={h} className={cls("rounded-lg py-1 text-center", res?.hits === h ? "bg-gold-400/30 ring-1 ring-gold-300" : "bg-white/5")}>
              <div className="text-[9px] font-bold text-white/50">{name}</div>
              <div className="text-[11px] font-black text-gold-300">{fmtMult(m)}</div>
            </div>
          ))}
        </div>
        {res && <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cls("text-center font-display font-black text-lg", res.payout ? "text-win-400" : "text-white/60")}>{res.payout ? `${PAYS.find((p) => p[0] === res.hits)?.[1]}! +${fmt(res.payout)}` : `${res.hits} acerto${res.hits === 1 ? "" : "s"} · sem prêmio`}</motion.div>}
      </div>
      <Footer>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-32 text-xs" disabled={busy} onClick={surprise}>SURPRESINHA</Btn>
          <Btn variant="gold" size="lg" className="flex-1" disabled={busy || picks.length !== 6} pulse={!busy && picks.length === 6} onClick={play}>{picks.length === 6 ? "SORTEAR" : `ESCOLHA ${6 - picks.length}`}</Btn>
        </div>
        <ShareLink id={res && res.payout > 0 && !busy ? res.id : null} />
      </Footer>
    </GameShell>
  );
}
