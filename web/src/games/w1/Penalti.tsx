import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cls, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { haptic } from "../../lib/tg";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Chips, finishFx, Footer, ladderMult, money, ShareLink, Stat, Stats, usePersist, useSession } from "./common";

type View = { mode: string; picks: number[]; level: number; multiplier: number; rows?: number[][]; outcome?: string; hit?: { level: number; col: number } };
const KICKS = 5;
const MODES = [
  { value: "easy", label: "Goleiro cobre 1", bad: 1 },
  { value: "medium", label: "Cobre 2", bad: 2 },
  { value: "hard", label: "Cobre 3", bad: 3 },
];
// alvos no gol (em % da área do gol)
const SPOTS = [
  { x: 14, y: 26 },
  { x: 86, y: 26 },
  { x: 50, y: 40 },
  { x: 14, y: 78 },
  { x: 86, y: 78 },
];

function Ball({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#111" strokeWidth="3" />
      <path d="M50 30 L66 42 L60 60 L40 60 L34 42 Z" fill="#111" />
      <path d="M50 30 V8 M66 42 L88 34 M60 60 L74 82 M40 60 L26 82 M34 42 L12 34" stroke="#111" strokeWidth="3" />
    </svg>
  );
}
function Glove() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <path d="M30 90 V50 C30 40 36 36 40 44 V20 C40 12 50 12 50 20 V40 V14 C50 6 60 6 60 14 V40 V18 C60 10 70 10 70 18 V46 V30 C70 22 80 22 80 30 V66 C80 80 70 90 58 90 Z" fill="#22c55e" stroke="#14532d" strokeWidth="4" />
      <rect x="30" y="80" width="40" height="12" rx="4" fill="#facc15" />
    </svg>
  );
}

export default function Penalti() {
  const [bet, setBet] = useBet("penalti");
  const [mode, setMode] = usePersist("penalti_m", "medium");
  const S = useSession<View>("penalti");
  const [shot, setShot] = useState<{ spot: number; saved: boolean; covered: number[] } | null>(null);
  const v = S.round?.view;
  const active = S.active;
  const bad = MODES.find((m) => m.value === (v?.mode ?? mode))!.bad;
  const level = v?.level ?? 0;
  const busy = S.busy || !!shot;

  async function kick(spot: number) {
    if (!active || busy) return;
    haptic.impact("medium");
    sfx.whoosh();
    const r = await S.act("pick", { col: spot });
    if (!r) return;
    const saved = r.view.outcome === "bust";
    // o servidor só revela onde o goleiro estava no fim da rodada; em gols, mostramos o goleiro pulando para outro canto
    const covered = r.view.rows ? r.view.rows[r.view.hit?.level ?? r.view.picks.length - 1] : [];
    const dive = saved ? covered : [[0, 1, 2, 3, 4].filter((s) => s !== spot)[(Math.random() * 4) | 0]];
    setShot({ spot, saved, covered: dive });
    await sleep(900);
    if (saved) {
      sfx.lose();
      await finishFx(0, bet);
    } else {
      sfx.win();
      haptic.success();
      if (r.done) await finishFx(r.payout, bet);
    }
    setShot(null);
  }
  async function cashout() {
    const r = await S.act("cashout");
    if (r) await finishFx(r.payout, bet);
  }

  const results = Array.from({ length: KICKS }, (_, i) => (v && i < v.picks.length ? "goal" : v?.hit?.level === i ? "saved" : "none"));
  const goalie = shot ? SPOTS[shot.covered[0]] : { x: 50, y: 62 };

  return (
    <GameShell
      title="Gol de Pênalti"
      game="penalti"
      bg="radial-gradient(90% 60% at 50% 0%, rgba(74,222,128,0.25), transparent 70%), linear-gradient(180deg,#052e16,#03140a)"
      info={<><p>Série de 5 pênaltis. Escolha o canto de cada chute: o goleiro (sorteado pelo servidor antes do chute) defende 1, 2 ou 3 dos 5 cantos.</p><p>Cada gol multiplica o prêmio; saque entre as cobranças. Fazer os 5 gols com o goleiro cobrindo 3 cantos paga {fmtMult(ladderMult(5, 3, 5))}. RTP 98%.</p></>}
    >
      <Stats>
        <Stat label="ATUAL" value={fmtMult(v?.multiplier ?? 1)} tone="win" />
        <Stat label="PRÓXIMO GOL" value={fmtMult(ladderMult(5, bad, level + 1))} />
        <Stat label="5 GOLS" value={fmtMult(ladderMult(5, bad, KICKS))} tone="gold" />
      </Stats>
      <div className="flex justify-center gap-2 py-2">
        {results.map((r, i) => (
          <div key={i} className={cls("w-7 h-7 rounded-full grid place-items-center text-[12px] font-black border-2", r === "goal" ? "bg-win-500 border-win-300 text-space-950" : r === "saved" ? "bg-loss-500 border-loss-300" : i === level && active ? "border-gold-300 animate-pulse" : "border-white/20 text-white/30")}>
            {r === "goal" ? "✓" : r === "saved" ? "✕" : i + 1}
          </div>
        ))}
      </div>
      <div className="relative flex-1 min-h-0 mx-3 mb-2 rounded-3xl overflow-hidden" style={{ background: "repeating-linear-gradient(180deg,#15803d 0 34px,#166534 34px 68px)" }}>
        {/* gol */}
        <div className="absolute left-[6%] right-[6%] top-[8%] h-[52%]">
          <div className="absolute inset-0 border-[6px] border-b-0 border-white rounded-t-md shadow-[0_0_20px_rgba(255,255,255,0.25)]" />
          <div className="absolute inset-[6px] bottom-0 opacity-30" style={{ backgroundImage: "linear-gradient(45deg,#fff 1px,transparent 1px),linear-gradient(-45deg,#fff 1px,transparent 1px)", backgroundSize: "14px 14px" }} />
          {/* alvos */}
          {SPOTS.map((p, i) => (
            <button key={i} disabled={!active || busy} onClick={() => kick(i)} className={cls("absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border-2 border-dashed grid place-items-center press", active && !busy ? "border-gold-300 bg-gold-400/15 animate-pulse" : "border-white/20")} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              {v?.outcome && v.rows?.[v.hit?.level ?? Math.max(0, v.picks.length - 1)]?.includes(i) && !shot && <span className="text-[9px] font-black text-loss-300">GOLEIRO</span>}
            </button>
          ))}
          {/* goleiro */}
          <motion.div className="absolute -translate-x-1/2 -translate-y-1/2" animate={{ left: `${goalie.x}%`, top: `${goalie.y}%`, rotate: shot ? (goalie.x < 50 ? -60 : goalie.x > 50 ? 60 : 0) : 0 }} transition={{ type: "spring", damping: 14, stiffness: 160 }} style={{ left: "50%", top: "62%" }}>
            <div className="relative grid place-items-center">
              <div className="w-10 h-16 rounded-t-full bg-gradient-to-b from-orange-400 to-orange-600 border-2 border-orange-900" />
              <div className="absolute -top-5 w-8 h-8 rounded-full bg-amber-200 border-2 border-amber-700" />
              <div className="absolute -left-7 top-1"><Glove /></div>
              <div className="absolute -right-7 top-1 -scale-x-100"><Glove /></div>
            </div>
          </motion.div>
        </div>
        {/* marca do pênalti / bola */}
        <div className="absolute left-1/2 bottom-[12%] -translate-x-1/2 w-3 h-3 rounded-full bg-white/70" />
        <AnimatePresence>
          {shot ? (
            <motion.div
              key="shot"
              className="absolute -translate-x-1/2 -translate-y-1/2"
              initial={{ left: "50%", top: "86%", scale: 1.3 }}
              animate={{ left: `${6 + SPOTS[shot.spot].x * 0.88}%`, top: `${8 + SPOTS[shot.spot].y * 0.52}%`, scale: 0.8, rotate: 540 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Ball />
            </motion.div>
          ) : (
            <motion.div key="rest" className="absolute left-1/2 top-[86%] -translate-x-1/2 -translate-y-1/2" initial={{ scale: 0 }} animate={{ scale: 1.3 }}>
              <Ball />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {shot && (
            <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.45 }} className="absolute inset-x-0 bottom-[30%] text-center pointer-events-none">
              <span className={cls("font-display font-black text-5xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]", shot.saved ? "text-loss-400" : "text-gold-300")}>{shot.saved ? "DEFENDEU!" : "GOOOL!"}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer>
        {!active ? (
          <>
            <Chips value={mode} onChange={setMode} options={MODES.map((m) => ({ value: m.value, label: m.label }))} />
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse disabled={S.busy} onClick={() => S.start(bet, { mode })}>COMEÇAR A SÉRIE</Btn>
            <ShareLink id={S.lastWin} />
          </>
        ) : (
          <div className="flex gap-2 items-center">
            <div className="flex-1 text-center text-xs font-black text-white/60">TOQUE EM UM CANTO DO GOL</div>
            <Btn variant="green" size="xl" className="flex-1" disabled={busy || level === 0} onClick={cashout}>SACAR {money(bet, v!.multiplier)}</Btn>
          </div>
        )}
      </Footer>
    </GameShell>
  );
}
