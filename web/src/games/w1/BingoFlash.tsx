import { motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, ShareLink } from "./common";

const PATTERNS = [
  { key: "frame", name: "Moldura", m: 50000, cells: [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24] },
  { key: "x", name: "X", m: 300, cells: [0, 6, 12, 18, 24, 4, 8, 16, 20] },
  { key: "corners", name: "4 Cantos", m: 10, cells: [0, 4, 20, 24] },
  { key: "line", name: "Linha", m: 4.5, cells: [10, 11, 12, 13, 14] },
];
const LETTERS = ["B", "I", "N", "G", "O"];
type Res = { card: number[]; draws: number[]; pattern: string | null; cells: number[]; multiplier: number };

function Mini({ cells }: { cells: number[] }) {
  return (
    <div className="grid grid-cols-5 gap-[1.5px] w-7 h-7">
      {Array.from({ length: 25 }).map((_, i) => <span key={i} className={cls("rounded-[1px]", cells.includes(i) ? "bg-yellow-300" : "bg-white/15")} />)}
    </div>
  );
}

export default function BingoFlash() {
  const [bet, setBet] = useBet("bingo-flash");
  const [card, setCard] = useState<number[] | null>(null);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [win, setWin] = useState<{ key: string | null; cells: number[]; payout: number; id: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function play() {
    if (busy) return;
    setBusy(true);
    setWin(null);
    setDrawn([]);
    haptic.impact("medium");
    const r = await playInstant<Res>("bingo-flash", bet, {});
    if (!r) return setBusy(false);
    setCard(r.result.card);
    await sleep(350 * speedFactor());
    for (const n of r.result.draws) {
      setDrawn((d) => [...d, n]);
      r.result.card.includes(n) ? sfx.gem() : sfx.ball();
      await sleep(70 * speedFactor());
    }
    setWin({ key: r.result.pattern, cells: r.result.cells, payout: r.payout, id: r.roundId });
    if (r.result.pattern) sfx.jackpot();
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  const set = new Set(drawn);
  return (
    <GameShell
      title="Bingo Relâmpago"
      game="bingo-flash"
      bg="radial-gradient(80% 50% at 50% 0%, rgba(250,204,21,0.3), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(147,51,234,0.3), transparent 70%), linear-gradient(180deg,#120a1d,#06030c)"
      info={<><p>Cartela 5×5 (centro livre) e 30 bolas sorteadas num relâmpago. Vale o melhor padrão formado:</p><p>Linha (horizontal, vertical ou diagonal) 4,5x · 4 Cantos 10x · X (as duas diagonais) 300x · Moldura (toda a borda) 50.000x. RTP ≈ 96%.</p></>}
    >
      <div className="flex-1 min-h-0 flex flex-col justify-center px-4 gap-3">
        <div className="mx-auto w-full max-w-[340px] rounded-3xl p-3" style={{ background: "linear-gradient(160deg,#7c3aed,#4c1d95)", boxShadow: "0 16px 40px rgba(0,0,0,0.5), inset 0 0 0 3px #fde047" }}>
          <div className="grid grid-cols-5 gap-1.5 mb-1.5">
            {LETTERS.map((l) => <div key={l} className="text-center font-display font-black text-xl text-yellow-300">{l}</div>)}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 25 }).map((_, i) => {
              const n = card?.[i];
              const marked = i === 12 || (n != null && set.has(n));
              const inWin = win?.cells.includes(i);
              return (
                <div key={i} className={cls("aspect-square rounded-xl grid place-items-center font-black text-base relative overflow-hidden", inWin ? "bg-yellow-300 text-[#3b0764] shadow-[0_0_16px_rgba(253,224,71,0.8)]" : "bg-white text-violet-900")}>
                  {i === 12 ? "★" : n ?? ""}
                  {marked && !inWin && i !== 12 && <motion.span initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: 0.75 }} className="absolute inset-1 rounded-full bg-fuchsia-500" />}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-1 flex-wrap justify-center min-h-[52px]">
          {drawn.map((n) => (
            <motion.span key={n} initial={{ scale: 0 }} animate={{ scale: 1 }} className={cls("w-6 h-6 rounded-full text-[9px] font-black grid place-items-center", card?.includes(n) ? "bg-yellow-300 text-[#3b0764]" : "bg-white/15 text-white/70")}>{n}</motion.span>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {PATTERNS.map((p) => (
            <div key={p.key} className={cls("rounded-xl py-1.5 flex flex-col items-center gap-0.5", win?.key === p.key ? "bg-gold-400/30 ring-1 ring-gold-300" : "bg-white/5")}>
              <Mini cells={p.cells} />
              <div className="text-[9px] font-bold text-white/55">{p.name}</div>
              <div className="text-[11px] font-black text-gold-300">{fmtMult(p.m)}</div>
            </div>
          ))}
        </div>
      </div>
      <Footer>
        {win && <div className={cls("text-center font-display font-black text-lg", win.payout ? "text-win-400" : "text-white/60")}>{win.key ? `${PATTERNS.find((p) => p.key === win.key)!.name}! +${fmt(win.payout)}` : "Nenhum padrão"}</div>}
        <BetInput value={bet} onChange={setBet} disabled={busy} label="Preço da cartela" />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={play}>JOGAR · {fmt(bet)}</Btn>
        <ShareLink id={win && win.payout > 0 && !busy ? win.id : null} />
      </Footer>
    </GameShell>
  );
}
