import { motion, useAnimation } from "framer-motion";
import { useState } from "react";
import { cls, fmt } from "../lib/format";
import { sfx } from "../lib/sound";
import { haptic } from "../lib/tg";
import { celebrate, ResultBanner } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { BetInput, Btn, useBet } from "../ui/kit";

function CoinFace({ side, back }: { side: "heads" | "tails"; back?: boolean }) {
  return (
    <div className="absolute inset-0 rounded-full [backface-visibility:hidden] grid place-items-center" style={{ transform: back ? "rotateX(180deg)" : undefined, background: side === "heads" ? "radial-gradient(circle at 35% 30%, #fff6d0, #f5c451 45%, #a16207)" : "radial-gradient(circle at 35% 30%, #ede9fe, #a78bfa 45%, #4c1d95)", boxShadow: "inset 0 0 0 8px rgba(0,0,0,0.12), inset 0 0 0 12px rgba(255,255,255,0.25)" }}>
      <svg viewBox="0 0 100 100" className="w-[62%]">
        {side === "heads" ? (
          <path d="M50 12 L61 38 L90 40 L68 58 L75 86 L50 70 L25 86 L32 58 L10 40 L39 38 Z" fill="#7a4d05" opacity=".85" />
        ) : (
          <g fill="none" stroke="#2e1065" strokeWidth="7" opacity=".85"><path d="M64 14 A38 38 0 1 0 88 66 A30 30 0 1 1 64 14 Z" fill="#2e1065" /></g>
        )}
      </svg>
    </div>
  );
}

export default function Coinflip() {
  const [bet, setBet] = useBet("coinflip");
  const [side, setSide] = useState<"heads" | "tails">("heads");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ side: string; win: boolean; payout: number; id: number } | null>(null);
  const [streak, setStreak] = useState<string[]>([]);
  const coin = useAnimation();

  async function flip() {
    if (busy) return;
    setBusy(true);
    setRes(null);
    haptic.impact("medium");
    sfx.whoosh();
    coin.start({ rotateX: [0, 1800], y: [0, -160, 0], transition: { duration: 1.6, ease: "linear", repeat: Infinity } });
    const r = await playInstant<{ side: "heads" | "tails"; win: boolean }>("coinflip", bet, { side });
    if (!r) {
      coin.stop();
      coin.set({ rotateX: 0, y: 0 });
      setBusy(false);
      return;
    }
    await coin.start({ rotateX: 2160 + (r.result.side === "heads" ? 0 : 180), y: [-160, 0], transition: { duration: 0.9, ease: [0.2, 0.9, 0.3, 1] } });
    sfx.reelStop();
    haptic.impact("heavy");
    setRes({ side: r.result.side, win: r.result.win, payout: r.payout, id: r.roundId });
    setStreak((s) => [r.result.side, ...s].slice(0, 12));
    if (!r.result.win) sfx.lose();
    await celebrate(r.payout, bet);
    coin.set({ rotateX: r.result.side === "heads" ? 0 : 180, y: 0 });
    setBusy(false);
  }

  return (
    <GameShell title="Cara ou Coroa" game="coinflip" info={<p>Escolha Estrela (cara) ou Lua (coroa). Acertou, recebe 1,96x. RTP 98%.</p>}>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="[perspective:1000px] w-40 h-40">
          <motion.div animate={coin} className="relative w-full h-full [transform-style:preserve-3d]">
            <CoinFace side="heads" />
            <CoinFace side="tails" back />
          </motion.div>
        </div>
        <div className="w-32 h-4 rounded-full bg-black/40 blur-md mt-6" />
        <div className="h-20 mt-4"><ResultBanner show={!!res} win={!!res?.win} amount={res?.payout} mult={1.96} label={res && !res.win ? (res.side === "heads" ? "Deu Estrela" : "Deu Lua") : undefined} /></div>
        {res?.win && !busy && <button onClick={() => shareRound(res.id)} className="text-[11px] font-black text-plasma-400 press">COMPARTILHAR ↗</button>}
        <div className="flex gap-1.5 mt-4">
          {streak.map((s, i) => <div key={i} className={cls("w-5 h-5 rounded-full", s === "heads" ? "bg-gold-400" : "bg-nebula-500")} style={{ opacity: 1 - i * 0.07 }} />)}
        </div>
      </div>
      <div className="px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <div className="grid grid-cols-2 gap-2">
          {(["heads", "tails"] as const).map((s) => (
            <button key={s} disabled={busy} onClick={() => { haptic.tap(); sfx.chip(); setSide(s); }} className={cls("press h-16 rounded-2xl flex items-center justify-center gap-2 font-extrabold", side === s ? (s === "heads" ? "btn-gold" : "btn-violet") : "glass")}>
              <span className="text-2xl">{s === "heads" ? "★" : "☾"}</span> {s === "heads" ? "Estrela" : "Lua"}
            </button>
          ))}
        </div>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={flip}>JOGAR MOEDA · {fmt(bet * 1.96)}</Btn>
      </div>
    </GameShell>
  );
}
