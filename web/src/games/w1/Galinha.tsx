import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { cls, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { haptic } from "../../lib/tg";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Chips, finishFx, Footer, ladderMult, money, ShareLink, Stat, Stats, usePersist, useSession } from "./common";

type View = { mode: string; picks: number[]; level: number; multiplier: number; outcome?: string; hit?: { level: number; col: number } };
const LANES = 20;
const MODES = [
  { value: "easy", label: "Fácil", bad: 1 },
  { value: "medium", label: "Médio", bad: 3 },
  { value: "hard", label: "Difícil", bad: 5 },
  { value: "insane", label: "Insano", bad: 10 },
];
const COLS = 25;
const LANE_H = 66;
const CAR_COLORS = ["#ef4444", "#3b82f6", "#eab308", "#22c55e", "#a855f7", "#f97316", "#06b6d4"];

function Chicken({ dead }: { dead?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)]">
      {dead ? (
        <>
          <ellipse cx="50" cy="70" rx="34" ry="10" fill="#fff" />
          <path d="M22 66 Q50 50 78 66" fill="#fff" />
          <text x="50" y="44" textAnchor="middle" fontSize="28">💫</text>
        </>
      ) : (
        <>
          <ellipse cx="50" cy="62" rx="26" ry="24" fill="#fff" />
          <circle cx="50" cy="34" r="16" fill="#fff" />
          <path d="M44 20 q3 -10 6 0 q3 -10 6 0 q3 -8 4 2 z" fill="#ef4444" />
          <path d="M64 34 l10 3 -10 4 z" fill="#f59e0b" />
          <circle cx="56" cy="31" r="3" fill="#111" />
          <path d="M58 44 q4 6 -2 8" fill="#ef4444" />
          <path d="M28 60 q-10 -4 -6 10 q8 2 12 -2" fill="#f1f5f9" />
          <path d="M42 84 v10 M58 84 v10" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function Car({ color, flip }: { color: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 60" className={cls("w-[74px] h-[38px]", flip && "-scale-x-100")}>
      <rect x="6" y="18" width="108" height="30" rx="10" fill={color} />
      <path d="M30 18 L42 4 H84 L98 18 Z" fill={color} />
      <path d="M36 18 L45 8 H62 V18 Z M66 18 V8 H81 L91 18 Z" fill="#bae6fd" opacity=".85" />
      <circle cx="30" cy="48" r="9" fill="#111" />
      <circle cx="90" cy="48" r="9" fill="#111" />
      <rect x="106" y="24" width="8" height="6" rx="2" fill="#fef08a" />
    </svg>
  );
}

export default function Galinha() {
  const [bet, setBet] = useBet("galinha");
  const [mode, setMode] = usePersist("galinha_m", "medium");
  const S = useSession<View>("galinha");
  const v = S.round?.view;
  const active = S.active;
  const bad = MODES.find((m) => m.value === (v?.mode ?? mode))!.bad;
  const level = v?.level ?? 0;
  const dead = v?.outcome === "bust";
  const pos = dead ? v!.hit!.level + 1 : level; // 0 = calçada
  const cars = useMemo(() => Array.from({ length: LANES }, (_, i) => ({ c: CAR_COLORS[i % CAR_COLORS.length], d: 1.6 + ((i * 7) % 5) * 0.35, delay: -((i * 13) % 10) / 3, flip: i % 2 === 1 })), []);

  async function step() {
    if (!active || S.busy) return;
    haptic.impact("light");
    const r = await S.act("pick", { col: Math.floor(Math.random() * COLS) });
    if (!r) return;
    if (r.view.outcome === "bust") {
      sfx.explode();
      await finishFx(0, bet);
    } else {
      sfx.pop();
      if (r.done) await finishFx(r.payout, bet);
    }
  }
  async function cashout() {
    const r = await S.act("cashout");
    if (r) await finishFx(r.payout, bet);
  }

  // a câmera segue a galinha
  const camLane = Math.max(0, pos - 1);

  return (
    <GameShell
      title="Galinha Atravessa"
      game="galinha"
      bg="linear-gradient(180deg,#111827,#0b1120)"
      info={<><p>Ajude a galinha a atravessar 20 faixas de uma avenida movimentada. Cada faixa vencida aumenta o multiplicador; se um carro passar na hora, acabou.</p><p>Chance de carro por faixa: Fácil 4% · Médio 12% · Difícil 20% · Insano 40%. Saque quando quiser. RTP 98%, até 50.000x.</p></>}
    >
      <Stats>
        <Stat label="ATUAL" value={fmtMult(v?.multiplier ?? 1)} tone="win" />
        <Stat label="PRÓXIMA FAIXA" value={fmtMult(ladderMult(COLS, bad, level + 1))} />
        <Stat label="FAIXA" value={`${level}/${LANES}`} />
      </Stats>
      <div className="relative flex-1 min-h-0 mx-3 my-2 rounded-3xl overflow-hidden border border-white/10 bg-[#1f2937]">
        <motion.div className="absolute left-0 right-0 bottom-0" animate={{ y: camLane * LANE_H }} transition={{ type: "spring", damping: 24, stiffness: 140 }}>
          {/* calçada inicial */}
          <div className="relative h-[66px] bg-gradient-to-b from-stone-500 to-stone-600 border-t-4 border-stone-300/60">
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 38px, #000 38px 40px)" }} />
          </div>
          {Array.from({ length: LANES }).map((_, i) => {
            const L = i + 1;
            const passed = L <= level;
            const isHit = dead && v!.hit!.level === i;
            return (
              <div key={i} className="absolute left-0 right-0 overflow-hidden" style={{ bottom: L * LANE_H, height: LANE_H }}>
                <div className={cls("absolute inset-0", passed ? "bg-[#334155]" : "bg-[#27303f]")} />
                <div className="absolute left-0 right-0 top-0 h-[3px]" style={{ backgroundImage: "repeating-linear-gradient(90deg, #fde047 0 22px, transparent 22px 40px)", opacity: 0.5 }} />
                {/* tampa de bueiro com o multiplicador */}
                <div className={cls("absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[58px] h-[58px] rounded-full grid place-items-center text-[11px] font-black tabular border-4", passed ? "bg-win-500/80 border-win-300 text-space-950" : L === level + 1 && active ? "bg-gold-400/90 border-gold-200 text-space-950 shadow-[0_0_20px_rgba(250,204,21,0.6)]" : "bg-stone-700 border-stone-500 text-white/70")}>
                  {fmtMult(ladderMult(COLS, bad, L))}
                </div>
                {/* trânsito decorativo nas faixas à frente */}
                {!passed && !isHit && (
                  <div className="absolute top-[14px] left-0 right-0 pointer-events-none" style={{ animation: `car-${cars[i].flip ? "l" : "r"} ${cars[i].d * (active ? 1 : 1.6)}s linear infinite`, animationDelay: `${cars[i].delay}s` }}>
                    <Car color={cars[i].c} flip={cars[i].flip} />
                  </div>
                )}
                <AnimatePresence>
                  {isHit && (
                    <motion.div className="absolute top-[14px]" initial={{ x: -120 }} animate={{ x: "45vw" }} transition={{ duration: 0.35, ease: "easeIn" }}>
                      <Car color="#dc2626" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {/* chegada */}
          <div className="absolute left-0 right-0 h-[66px] bg-gradient-to-b from-emerald-600 to-emerald-700 grid place-items-center text-xs font-black tracking-widest" style={{ bottom: (LANES + 1) * LANE_H }}>
            🏁 CHEGADA · {fmtMult(ladderMult(COLS, bad, LANES))}
          </div>
          {/* galinha */}
          <motion.div className="absolute left-1/2 -translate-x-1/2 z-10" animate={{ bottom: pos * LANE_H + 4, rotate: dead ? 90 : 0 }} transition={{ type: "spring", damping: 14, stiffness: 220 }}>
            <motion.div key={pos} initial={{ y: -14 }} animate={{ y: 0 }} transition={{ type: "spring", damping: 8 }}>
              <Chicken dead={dead} />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      <style>{`@keyframes car-r{from{transform:translateX(-90px)}to{transform:translateX(110vw)}}@keyframes car-l{from{transform:translateX(110vw)}to{transform:translateX(-90px)}}`}</style>
      <Footer>
        {!active ? (
          <>
            <Chips value={mode} onChange={setMode} options={MODES.map((m) => ({ value: m.value, label: m.label }))} />
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse disabled={S.busy} onClick={() => S.start(bet, { mode }).then((r) => r && sfx.whoosh())}>COMEÇAR A TRAVESSIA</Btn>
            <ShareLink id={S.lastWin} />
          </>
        ) : (
          <div className="flex gap-2">
            <Btn variant="gold" size="xl" className="flex-1" disabled={S.busy} onClick={step}>ATRAVESSAR ▲</Btn>
            <Btn variant="green" size="xl" className="flex-1" disabled={S.busy || level === 0} onClick={cashout}>SACAR {money(bet, v!.multiplier)}</Btn>
          </div>
        )}
      </Footer>
    </GameShell>
  );
}
