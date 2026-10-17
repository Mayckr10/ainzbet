import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cls, fmt, fmtCompact } from "../lib/format";
import { sfx } from "../lib/sound";
import { revealBalance } from "../lib/store";
import { haptic } from "../lib/tg";
import { celebrate } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { BetInput, Btn, useBet } from "../ui/kit";

const PRIZE_STYLE: Record<number, { bg: string; icon: string }> = {
  1000: { bg: "linear-gradient(135deg,#fde68a,#f59e0b)", icon: "👑" },
  100: { bg: "linear-gradient(135deg,#f5d0fe,#c026d3)", icon: "💎" },
  25: { bg: "linear-gradient(135deg,#a5f3fc,#0891b2)", icon: "🌙" },
  10: { bg: "linear-gradient(135deg,#bbf7d0,#16a34a)", icon: "☄️" },
  5: { bg: "linear-gradient(135deg,#fecaca,#dc2626)", icon: "🔥" },
  2: { bg: "linear-gradient(135deg,#ddd6fe,#7c3aed)", icon: "🔮" },
  1: { bg: "linear-gradient(135deg,#e2e8f0,#64748b)", icon: "⭐" },
};

/** Célula com camada raspável (canvas). */
export function ScratchCell({ value, bet, onRevealed, reset, revealAll, win, face, cover = ["#cbd5e1", "#f1f5f9", "#94a3b8"], mark = "?", className }: { value: number; bet: number; onRevealed: () => void; reset: number; revealAll: boolean; win: boolean; face?: ReactNode; cover?: string[]; mark?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const scratched = useRef(0);
  useEffect(() => {
    setDone(false);
    scratched.current = 0;
    const c = ref.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = c.clientWidth;
    const H = c.clientHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, cover[0]);
    grad.addColorStop(0.5, cover[1]);
    grad.addColorStop(1, cover[2]);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(100,116,139,0.5)";
    for (let i = 0; i < 40; i++) g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    g.fillStyle = "#64748b";
    g.font = "900 18px Unbounded";
    g.textAlign = "center";
    g.fillText(mark, W / 2, H / 2 + 7);
  }, [reset]);
  useEffect(() => {
    if (revealAll && !done) {
      setDone(true);
      onRevealed();
    }
  }, [revealAll]);

  const scratch = (e: React.PointerEvent) => {
    if (done) return;
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    const g = c.getContext("2d")!;
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.arc(e.clientX - r.left, e.clientY - r.top, 16, 0, Math.PI * 2);
    g.fill();
    scratched.current++;
    if (scratched.current % 3 === 0) sfx.tick();
    if (scratched.current > 14) {
      setDone(true);
      haptic.impact("light");
      onRevealed();
    }
  };

  const st = PRIZE_STYLE[value];
  return (
    <div className={cls("relative aspect-square rounded-2xl overflow-hidden", win && done && "ring-4 ring-gold-300 shadow-[0_0_24px_rgba(253,224,71,0.7)]", className)}>
      {face ?? (
        <div className="absolute inset-0 grid place-items-center text-center" style={{ background: st.bg }}>
          <div>
            <div className="text-3xl">{st.icon}</div>
            <div className="font-display font-black text-sm text-white drop-shadow">{fmtCompact(value * bet)}</div>
          </div>
        </div>
      )}
      <motion.canvas
        ref={ref}
        animate={{ opacity: done ? 0 : 1 }}
        transition={{ duration: 0.35 }}
        className="absolute inset-0 w-full h-full touch-none"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          scratch(e);
        }}
        onPointerMove={(e) => e.buttons && scratch(e)}
      />
    </div>
  );
}

export default function Scratch() {
  const [bet, setBet] = useBet("scratch");
  const [card, setCard] = useState<{ grid: number[]; winMult: number; winCells: number[]; payout: number; id: number; bet: number } | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [revealAll, setRevealAll] = useState(false);
  const [reset, setReset] = useState(0);
  const [busy, setBusy] = useState(false);
  const finished = useRef(false);

  async function buy() {
    if (busy) return;
    setBusy(true);
    const r = await playInstant<{ grid: number[]; winMult: number; winCells: number[] }>("scratch", bet, {});
    setBusy(false);
    if (!r) return;
    finished.current = false;
    setRevealed(0);
    setRevealAll(false);
    setReset((x) => x + 1);
    setCard({ ...r.result, payout: r.payout, id: r.roundId, bet });
    sfx.card();
  }

  useEffect(() => {
    if (card && revealed >= 9 && !finished.current) {
      finished.current = true;
      if (card.payout > 0) celebrate(card.payout, card.bet);
      else {
        sfx.lose();
        revealBalance();
      }
    }
  }, [revealed, card]);

  const done = card && revealed >= 9;

  return (
    <GameShell title="Raspadinha" game="scratch" info={<><p>Compre um bilhete e raspe as 9 casas com o dedo. Três símbolos iguais ganham o valor mostrado.</p><p>Prêmios de 1x a 1.000x a aposta. RTP 95%.</p></>}>
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[340px] rounded-[28px] p-4 relative" style={{ background: "linear-gradient(160deg, #4c1d95, #831843)" }}>
          <div className="text-center mb-3">
            <div className="font-display font-black text-xl gold-text">RASPA ESTELAR</div>
            <div className="text-[11px] font-bold text-white/70">3 iguais = prêmio · até {fmt(bet * 1000)}</div>
          </div>
          {card ? (
            <div className="grid grid-cols-3 gap-2">
              {card.grid.map((v, i) => (
                <ScratchCell key={`${reset}-${i}`} value={v} bet={card.bet} reset={reset} revealAll={revealAll} win={card.winCells.includes(i)} onRevealed={() => setRevealed((x) => x + 1)} />
              ))}
            </div>
          ) : (
            <div className="aspect-square rounded-2xl border-2 border-dashed border-white/25 grid place-items-center text-white/60 text-sm font-bold">Compre um bilhete</div>
          )}
          {done && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mt-3">
              <div className={cls("font-display font-black text-2xl", card!.payout > 0 ? "text-gold-300" : "text-white/70")}>{card!.payout > 0 ? `+${fmt(card!.payout)}` : "Sem prêmio"}</div>
              {card!.payout > 0 && <button onClick={() => shareRound(card!.id)} className="text-[11px] font-black text-plasma-400 press">COMPARTILHAR ↗</button>}
            </motion.div>
          )}
        </div>
      </div>
      <div className="px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <BetInput value={bet} onChange={setBet} disabled={!!card && !done} label="Preço do bilhete" />
        {card && !done ? (
          <Btn variant="violet" size="lg" onClick={() => setRevealAll(true)}>REVELAR TUDO</Btn>
        ) : (
          <Btn variant="gold" size="lg" pulse disabled={busy} onClick={buy}>COMPRAR BILHETE · {fmt(bet)}</Btn>
        )}
      </div>
    </GameShell>
  );
}
