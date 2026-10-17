import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, sleep } from "../lib/format";
import { sfx } from "../lib/sound";
import { speedFactor, useApp } from "../lib/store";
import { haptic } from "../lib/tg";
import { celebrate } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { BetInput, Btn, useBet } from "../ui/kit";

const LETTERS = ["B", "I", "N", "G", "O"];
const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed"];

function newCard() {
  const card: number[] = new Array(25).fill(0);
  for (let c = 0; c < 5; c++) {
    const pool = Array.from({ length: 15 }, (_, i) => c * 15 + i + 1);
    for (let r = 0; r < 5; r++) {
      const j = Math.floor(Math.random() * pool.length);
      card[r * 5 + c] = pool.splice(j, 1)[0];
    }
  }
  card[12] = 0;
  return card;
}

export default function Bingo() {
  const cfg = useApp((s) => s.config?.bingo);
  const [bet, setBet] = useBet("bingo");
  const [card, setCard] = useState<number[]>(() => {
    try {
      const c = JSON.parse(localStorage.getItem("cc_bingo_card") ?? "null");
      return Array.isArray(c) && c.length === 25 ? c : newCard();
    } catch {
      return newCard();
    }
  });
  const [drawn, setDrawn] = useState<number[]>([]);
  const [lines, setLines] = useState<number[][]>([]);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ payout: number; lines: number; blackout: boolean; id: number } | null>(null);

  function shuffleCard() {
    if (busy) return;
    const c = newCard();
    setCard(c);
    localStorage.setItem("cc_bingo_card", JSON.stringify(c));
    setDrawn([]);
    setLines([]);
    setRes(null);
    sfx.card();
  }

  async function play() {
    if (busy) return;
    setBusy(true);
    setDrawn([]);
    setLines([]);
    setRes(null);
    haptic.impact("medium");
    const r = await playInstant<{ draws: number[]; lines: number[][]; blackout: boolean; multiplier: number }>("bingo", bet, { card });
    if (!r) return setBusy(false);
    for (const n of r.result.draws) {
      setDrawn((d) => [...d, n]);
      if (card.includes(n)) {
        sfx.gem();
        haptic.impact("light");
      } else sfx.ball();
      await sleep(150 * speedFactor());
    }
    setLines(r.result.lines);
    setRes({ payout: r.payout, lines: r.result.lines.length, blackout: r.result.blackout, id: r.roundId });
    if (!r.payout) sfx.lose();
    await celebrate(r.payout, bet);
    setBusy(false);
  }

  const lineCells = new Set(lines.flat());
  const last = drawn[drawn.length - 1];

  return (
    <GameShell title="Bingo" game="bingo" info={<><p>Cartela 5×5 com o centro livre. São sorteadas {cfg?.draws ?? 35} bolas de 75. Cada linha completa (horizontal, vertical ou diagonal) conta.</p><p>Pagamento por linhas: {cfg && Object.entries(cfg.pays).map(([k, v]) => `${k} → ${v}x`).join(" · ")} · cartela cheia → {fmt(cfg?.blackout ?? 10000)}x. RTP ≈ 94%.</p></>}>
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <div className="h-20 flex items-center gap-3">
          <AnimatePresence mode="popLayout">
            {last && (
              <motion.div key={last} initial={{ scale: 0, rotate: -180, x: 80 }} animate={{ scale: 1, rotate: 0, x: 0 }} className="w-16 h-16 rounded-full grid place-items-center relative" style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${COLORS[Math.floor((last - 1) / 15)]} 55%)` }}>
                <div className="w-10 h-10 rounded-full bg-white grid place-items-center font-display font-black text-space-950 leading-none">
                  <div className="text-center"><div className="text-[9px]">{LETTERS[Math.floor((last - 1) / 15)]}</div><div className="text-sm">{last}</div></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="text-xs font-bold text-white/60">{drawn.length}/{cfg?.draws ?? 35} bolas</div>
        </div>
        <div className="w-full max-w-[330px] rounded-3xl p-3 bg-gradient-to-b from-pink-700/70 to-violet-900/70 border border-white/10">
          <div className="grid grid-cols-5 gap-1.5 mb-1.5">
            {LETTERS.map((l, i) => <div key={l} className="text-center font-display font-black text-lg" style={{ color: COLORS[i] === "#16a34a" ? "#4ade80" : "#fff" }}>{l}</div>)}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {card.map((n, i) => {
              const marked = i === 12 || drawn.includes(n);
              const inLine = lineCells.has(i);
              return (
                <motion.div key={i} animate={marked && i !== 12 ? { scale: [1, 1.2, 1] } : {}} className={cls("aspect-square rounded-xl grid place-items-center font-extrabold text-[15px] relative", inLine ? "bg-gold-400 text-[#3b2300]" : marked ? "bg-win-500 text-space-950" : "bg-white/90 text-space-950")}>
                  {i === 12 ? "★" : n}
                </motion.div>
              );
            })}
          </div>
        </div>
        <div className="h-10 text-center">
          {res && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cls("font-display font-black text-lg", res.payout ? "text-win-400" : "text-white/60")}>
              {res.blackout ? "CARTELA CHEIA!" : `${res.lines} ${res.lines === 1 ? "linha" : "linhas"}`} · {res.payout ? `+${fmt(res.payout)}` : "sem prêmio"}
              {res.payout > 0 && !busy && <button onClick={() => shareRound(res.id)} className="ml-2 text-[10px] text-plasma-400 press align-middle">COMPARTILHAR ↗</button>}
            </motion.div>
          )}
        </div>
      </div>
      <div className="px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-32 text-xs" disabled={busy} onClick={shuffleCard}>NOVA CARTELA</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse={!busy} disabled={busy} onClick={play}>JOGAR</Btn>
        </div>
      </div>
    </GameShell>
  );
}
