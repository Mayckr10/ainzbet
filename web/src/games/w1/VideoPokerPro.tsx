import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { cls, fmt } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { useApp } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { PlayingCard } from "../../ui/cards";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, ShareLink, useSession } from "./common";

type Table = { pays: Record<string, number>; order: string[]; names: Record<string, string> };
type View = { hand: number[]; phase: "hold" | "done"; current?: { key: string | null; mult: number }; key?: string | null; multiplier?: number; held?: boolean[] };

const CFG: Record<string, { title: string; frame: string; info: ReactNode }> = {
  "vp-deuces": {
    title: "Deuces Wild",
    frame: "#14532d",
    info: <><p>Video pôquer em que todos os 2 são coringas e substituem qualquer carta. A mão mínima que paga é trinca.</p><p>Royal natural 800 · Quatro 2 200 · Royal com coringa 25 · Quina 16 · Straight flush 10 · Quadra 4 · Full house 4 · Flush 3 · Sequência 2 · Trinca 1. RTP ≈ 99,7% com jogo ótimo.</p></>,
  },
  "vp-double": {
    title: "Double Bonus Poker",
    frame: "#7f1d1d",
    info: <><p>Video pôquer sem coringas com quadras turbinadas: quadra de ases paga 160, de 2 a 4 paga 80 e de 5 a K paga 50. Valetes ou maior já pagam.</p><p>Tabela 9/7/5 (full house 9, flush 7, sequência 5). RTP ≈ 99,1% com jogo ótimo.</p></>,
  },
  "vp-joker": {
    title: "Joker Poker",
    frame: "#4c1d95",
    info: <><p>Baralho de 53 cartas com um curinga que vale qualquer carta. Par de reis ou maior já paga; quina (cinco iguais com o curinga) paga 200.</p><p>Royal natural 800 · Quina 200 · Royal com curinga 100 · Straight flush 50 · Quadra 17 · Full house 7 · Flush 5 · Sequência 3 · Trinca 2 · Dois pares 1 · Reis ou + 1. RTP ≈ 98% com jogo ótimo.</p></>,
  },
};

export default function VideoPokerPro({ id }: { id: string }) {
  const C = CFG[id];
  const T: Table | undefined = useApp((s) => s.config?.vpTables?.[id]);
  const [bet, setBet] = useBet(id);
  const [hold, setHold] = useState([false, false, false, false, false]);
  const S = useSession<View>(id);
  const v = S.round?.view;
  const phase = v?.phase;

  async function deal() {
    setHold([false, false, false, false, false]);
    const r = await S.start(bet);
    if (r) sfx.card();
  }
  async function draw() {
    const r = await S.act("draw", { hold });
    if (r) setTimeout(() => finishFx(r.payout, bet), 700);
  }
  const toggle = (i: number) => {
    if (phase !== "hold") return;
    haptic.tap();
    sfx.click();
    setHold((h) => h.map((x, j) => (j === i ? !x : x)));
  };
  const hl = phase === "done" ? v?.key : phase === "hold" ? v?.current?.key : null;

  return (
    <GameShell title={C.title} game={id} info={C.info} bg={`radial-gradient(80% 50% at 50% 0%, ${C.frame}aa, transparent 70%), linear-gradient(180deg,#0a0a16,#04040a)`}>
      <div className="mx-3 rounded-2xl overflow-hidden border-2 border-gold-400/40" style={{ background: `linear-gradient(180deg, ${C.frame}, #0b0b1a)` }}>
        {T?.order.map((k, i) => (
          <div key={k} className={cls("flex justify-between px-3 py-[2px] text-[11.5px] font-extrabold", hl === k ? "bg-gold-400 text-[#2a1700]" : i % 2 ? "bg-white/[0.04] text-gold-200/90" : "text-gold-200/90")}>
            <span>{T.names[k]}</span>
            <span className="tabular">{fmt(T.pays[k] * bet)}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
        <div className="flex gap-1.5">
          {(v?.hand ?? [-1, -1, -1, -1, -1]).map((c, i) => (
            <PlayingCard key={`${S.round?.id}-${i}-${c}`} card={v ? c : -1} index={phase === "done" && !hold[i] ? 0 : i} size="lg" held={phase === "hold" && hold[i]} onClick={() => toggle(i)} from={{ x: 0, y: -260 }} highlight={id === "vp-deuces" && c >= 0 && c < 52 && c % 13 === 0} />
          ))}
        </div>
        <div className="h-14 mt-7 text-center">
          {phase === "done" && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cls("font-display font-black text-xl", S.round!.payout ? "text-gold-300" : "text-white/60")}>
              {v!.key ? `${T?.names[v!.key]} · +${fmt(S.round!.payout)}` : "Sem combinação"}
            </motion.div>
          )}
          {phase === "hold" && <div className="text-sm font-bold text-white/60">{v?.current?.key ? `Você já tem: ${T?.names[v.current.key]}` : "Toque nas cartas para segurar"}</div>}
        </div>
      </div>
      <Footer>
        {phase === "hold" ? (
          <Btn variant="gold" size="xl" pulse disabled={S.busy} onClick={draw}>TROCAR CARTAS</Btn>
        ) : (
          <>
            <BetInput value={bet} onChange={setBet} disabled={S.busy} />
            <Btn variant="gold" size="lg" pulse disabled={S.busy} onClick={deal}>DISTRIBUIR</Btn>
            <ShareLink id={S.lastWin} />
          </>
        )}
      </Footer>
    </GameShell>
  );
}
