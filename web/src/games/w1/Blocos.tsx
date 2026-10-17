import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cls, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { haptic } from "../../lib/tg";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Chips, finishFx, Footer, ladderMult, money, ShareLink, Stat, Stats, usePersist, useSession } from "./common";

type View = { mode: string; picks: number[]; level: number; multiplier: number; outcome?: string };
const LEVELS = 15;
const COLS = 20;
const MODES = [
  { value: "easy", label: "Fácil · 10%", bad: 2 },
  { value: "medium", label: "Médio · 20%", bad: 4 },
  { value: "hard", label: "Difícil · 35%", bad: 7 },
];
const BLOCK_H = 34;
const COLORS = [
  ["#f472b6", "#be185d"],
  ["#60a5fa", "#1d4ed8"],
  ["#facc15", "#a16207"],
  ["#4ade80", "#15803d"],
  ["#c084fc", "#7e22ce"],
  ["#fb923c", "#c2410c"],
];
// pequeno deslocamento lateral de cada bloco (visual) para parecer empilhado à mão
const offsetOf = (i: number) => ((i * 37) % 17) - 8;

function Block({ i, glow }: { i: number; glow?: boolean }) {
  const [a, b] = COLORS[i % COLORS.length];
  return (
    <div className={cls("relative w-[132px] h-[34px] rounded-md border-2 border-black/30", glow && "shadow-[0_0_18px_rgba(250,204,21,0.7)]")} style={{ background: `linear-gradient(180deg, ${a}, ${b})` }}>
      <div className="absolute inset-x-1 top-0.5 h-1.5 rounded bg-white/40" />
      <div className="absolute inset-y-1 left-2 w-3 rounded bg-black/15" />
      <div className="absolute inset-y-1 right-2 w-3 rounded bg-black/15" />
    </div>
  );
}

export default function Blocos() {
  const [bet, setBet] = useBet("blocos");
  const [mode, setMode] = usePersist("blocos_m", "medium");
  const S = useSession<View>("blocos");
  const [dropping, setDropping] = useState<null | "ok" | "fall">(null);
  const v = S.round?.view;
  const active = S.active;
  const bad = MODES.find((m) => m.value === (v?.mode ?? mode))!.bad;
  const level = v?.level ?? 0;
  const busy = S.busy || !!dropping;

  async function drop() {
    if (!active || busy) return;
    haptic.impact("light");
    const r = await S.act("pick", { col: Math.floor(Math.random() * COLS) });
    if (!r) return;
    const fell = r.view.outcome === "bust";
    setDropping(fell ? "fall" : "ok");
    await sleep(fell ? 900 : 420);
    setDropping(null);
    if (fell) {
      sfx.explode();
      await finishFx(0, bet);
    } else {
      sfx.chip();
      haptic.impact("medium");
      if (r.done) await finishFx(r.payout, bet);
    }
  }
  async function cashout() {
    const r = await S.act("cashout");
    if (r) await finishFx(r.payout, bet);
  }

  const shown = Math.min(level, LEVELS);
  const cam = Math.max(0, shown - 6) * BLOCK_H;

  return (
    <GameShell
      title="Torre de Blocos"
      game="blocos"
      bg="radial-gradient(80% 50% at 50% 0%, rgba(56,189,248,0.35), transparent 70%), linear-gradient(180deg,#0b1d3a,#050b18)"
      info={<><p>Solte blocos do guindaste para levantar a torre. Cada bloco que encaixa aumenta o multiplicador; se um bloco escorregar, a torre desaba.</p><p>Chance de escorregar por bloco: Fácil 10% · Médio 20% · Difícil 35%. São 15 andares; saque quando quiser. RTP 98%.</p></>}
    >
      <Stats>
        <Stat label="ATUAL" value={fmtMult(v?.multiplier ?? 1)} tone="win" />
        <Stat label="PRÓXIMO" value={fmtMult(ladderMult(COLS, bad, level + 1))} />
        <Stat label="ANDAR" value={`${level}/${LEVELS}`} />
      </Stats>
      <div className="relative flex-1 min-h-0 mx-3 my-2 rounded-3xl overflow-hidden border border-white/10" style={{ background: "linear-gradient(180deg,#1e3a8a 0%,#0c4a6e 60%,#082f49 100%)" }}>
        {/* prédios ao fundo */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-30" style={{ background: "linear-gradient(90deg,#0f172a 0 12%,transparent 12% 16%,#0f172a 16% 30%,transparent 30% 36%,#0f172a 36% 44%,transparent 44% 60%,#0f172a 60% 74%,transparent 74% 80%,#0f172a 80% 100%)", clipPath: "polygon(0 40%,12% 40%,12% 10%,16% 10%,16% 55%,30% 55%,30% 20%,44% 20%,44% 60%,60% 60%,60% 5%,74% 5%,74% 45%,80% 45%,80% 25%,100% 25%,100% 100%,0 100%)" }} />
        {/* guindaste */}
        <div className="absolute top-0 left-0 right-0 h-16 z-20">
          <div className="absolute top-3 left-4 right-4 h-2 rounded bg-yellow-400/80" style={{ backgroundImage: "repeating-linear-gradient(90deg,#facc15 0 10px,#1f2937 10px 14px)" }} />
          {active && !dropping && (
            <motion.div className="absolute top-5 left-1/2" animate={{ x: [-70, 70, -70] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}>
              <div className="relative -left-[66px]">
                <div className="mx-auto w-0.5 h-5 bg-white/60" />
                <Block i={level} />
              </div>
            </motion.div>
          )}
        </div>
        {/* torre */}
        <motion.div className="absolute left-0 right-0 bottom-0" animate={{ y: cam }} transition={{ type: "spring", damping: 22 }}>
          <div className="h-6 bg-gradient-to-b from-stone-500 to-stone-700" />
          {Array.from({ length: shown }).map((_, i) => (
            <motion.div key={i} className="absolute left-1/2" style={{ bottom: 24 + i * BLOCK_H, marginLeft: -66 + offsetOf(i) }} initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", damping: 16, stiffness: 260 }}>
              <Block i={i} glow={i === shown - 1 && !!active} />
              <span className="absolute -right-14 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/60 tabular">{fmtMult(ladderMult(COLS, bad, i + 1))}</span>
            </motion.div>
          ))}
          <AnimatePresence>
            {dropping === "fall" && (
              <motion.div className="absolute left-1/2" style={{ bottom: 24 + shown * BLOCK_H, marginLeft: -66 }} initial={{ y: -260, x: 0, rotate: 0 }} animate={{ y: [-260, 0, 120], x: [0, 30, 160], rotate: [0, 15, 80] }} transition={{ duration: 0.85, times: [0, 0.45, 1] }}>
                <Block i={shown} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        {v?.outcome === "bust" && (
          <motion.div initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="font-display font-black text-4xl text-loss-400 drop-shadow-lg">DESABOU!</div>
          </motion.div>
        )}
      </div>
      <Footer>
        {!active ? (
          <>
            <Chips value={mode} onChange={setMode} options={MODES.map((m) => ({ value: m.value, label: m.label }))} />
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse disabled={S.busy} onClick={() => S.start(bet, { mode })}>COMEÇAR · topo {fmtMult(ladderMult(COLS, MODES.find((m) => m.value === mode)!.bad, LEVELS))}</Btn>
            <ShareLink id={S.lastWin} />
          </>
        ) : (
          <div className="flex gap-2">
            <Btn variant="gold" size="xl" className="flex-1" disabled={busy} onClick={drop}>SOLTAR BLOCO</Btn>
            <Btn variant="green" size="xl" className="flex-1" disabled={busy || level === 0} onClick={cashout}>SACAR {money(bet, v!.multiplier)}</Btn>
          </div>
        )}
      </Footer>
    </GameShell>
  );
}
