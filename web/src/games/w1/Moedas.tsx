import { motion, useAnimationControls } from "framer-motion";
import { useState } from "react";
import { cls, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, ladderMult, money, ShareLink, Stat, Stats, useSession } from "./common";

type View = { mode: string; picks: number[]; level: number; multiplier: number; outcome?: string; hit?: { level: number; col: number } };
const MAX = 20;
const mult = (n: number) => ladderMult(2, 1, n);

function Face({ side }: { side: 0 | 1 }) {
  return (
    <div className="absolute inset-0 rounded-full [backface-visibility:hidden] grid place-items-center" style={{ transform: side ? "rotateY(180deg)" : undefined, background: side ? "radial-gradient(circle at 35% 30%,#e0e7ff,#818cf8 55%,#3730a3)" : "radial-gradient(circle at 35% 30%,#fff7d6,#facc15 55%,#a16207)", boxShadow: "inset 0 0 0 6px rgba(255,255,255,0.35), inset 0 0 0 10px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.5)" }}>
      {side === 0 ? (
        <svg viewBox="0 0 100 100" className="w-[62%] h-[62%]">
          <circle cx="50" cy="40" r="18" fill="#a16207" />
          <path d="M22 86 C 24 62 76 62 78 86 Z" fill="#a16207" />
          <path d="M34 26 L40 14 L50 24 L60 14 L66 26 Z" fill="#fde68a" stroke="#a16207" strokeWidth="2" />
        </svg>
      ) : (
        <svg viewBox="0 0 100 100" className="w-[62%] h-[62%]">
          <path d="M50 12 L60 40 L90 40 L66 58 L74 88 L50 70 L26 88 L34 58 L10 40 L40 40 Z" fill="#3730a3" stroke="#e0e7ff" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export default function Moedas() {
  const [bet, setBet] = useBet("moedas");
  const S = useSession<View>("moedas");
  const ctrl = useAnimationControls();
  const [face, setFace] = useState<0 | 1>(0);
  const [flipping, setFlipping] = useState(false);
  const [seq, setSeq] = useState<(0 | 1)[]>([]);
  const v = S.round?.view;
  const active = S.active;
  const level = v?.level ?? 0;
  const busy = S.busy || flipping;

  async function flip(side: 0 | 1) {
    if (!active || busy) return;
    haptic.impact("medium");
    setFlipping(true);
    sfx.whoosh();
    const spin = ctrl.start({ rotateY: [0, 1800], y: [0, -120, 0], transition: { duration: 0.9 * speedFactor(), ease: "easeOut" } });
    const r = await S.act("pick", { col: side });
    await spin;
    if (!r) {
      setFlipping(false);
      return;
    }
    const lost = r.view.outcome === "bust";
    const result = (lost ? 1 - side : side) as 0 | 1;
    setFace(result);
    setSeq((s) => [...s, result].slice(-MAX));
    await ctrl.start({ rotateY: result ? 180 : 0, transition: { duration: 0.01 } });
    setFlipping(false);
    if (lost) await finishFx(0, bet);
    else {
      sfx.coin();
      if (r.done) await finishFx(r.payout, bet);
    }
  }
  async function cashout() {
    const r = await S.act("cashout");
    if (r) await finishFx(r.payout, bet);
  }

  return (
    <GameShell
      title="Cara ou Coroa em Série"
      game="moedas"
      bg="radial-gradient(70% 45% at 50% 30%, rgba(250,204,21,0.25), transparent 70%), linear-gradient(180deg,#141022,#07050f)"
      info={<><p>Acerte o lado da moeda várias vezes seguidas: cada acerto dobra o prêmio. Erre e perde tudo; saque quando quiser.</p><p>Multiplicador após n acertos = 0,98 × 2ⁿ (1,96x · 3,92x · 7,84x …), até 20 acertos ou 50.000x. RTP 98%.</p></>}
    >
      <Stats>
        <Stat label="SEQUÊNCIA" value={level} tone="gold" />
        <Stat label="ATUAL" value={fmtMult(v?.multiplier ?? 1)} tone="win" />
        <Stat label="PRÓXIMO" value={fmtMult(mult(level + 1))} />
      </Stats>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6">
        <div className="[perspective:900px]">
          <motion.div animate={ctrl} className="relative w-44 h-44 [transform-style:preserve-3d]" style={{ rotateY: face ? 180 : 0 }}>
            <Face side={0} />
            <Face side={1} />
          </motion.div>
        </div>
        <div className="flex gap-1 flex-wrap justify-center px-6 min-h-[22px]">
          {seq.map((s, i) => (
            <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className={cls("w-5 h-5 rounded-full border text-[9px] font-black grid place-items-center", s ? "bg-indigo-500/60 border-indigo-200/60" : "bg-yellow-500/60 border-yellow-200/60")}>{s ? "★" : "♛"}</motion.span>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-full px-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={cls("shrink-0 rounded-lg px-2 py-1 text-[10px] font-black tabular", i < level ? "bg-win-500/25 text-win-300" : i === level && active ? "bg-gold-400/25 text-gold-200" : "bg-white/5 text-white/35")}>{fmtMult(mult(i + 1))}</div>
          ))}
        </div>
      </div>
      <Footer>
        {!active ? (
          <>
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse disabled={S.busy} onClick={() => S.start(bet, { mode: "normal" }).then((r) => r && setSeq([]))}>COMEÇAR SEQUÊNCIA</Btn>
            <ShareLink id={S.lastWin} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="gold" size="lg" disabled={busy} onClick={() => flip(0)}>♛ CARA</Btn>
              <Btn variant="violet" size="lg" disabled={busy} onClick={() => flip(1)}>★ COROA</Btn>
            </div>
            <Btn variant="green" size="lg" disabled={busy || level === 0} onClick={cashout}>SACAR {money(bet, v!.multiplier)}</Btn>
          </>
        )}
      </Footer>
    </GameShell>
  );
}
