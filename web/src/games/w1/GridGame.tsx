import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { cls, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { haptic } from "../../lib/tg";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, gridMult, money, ShareLink, Stat, Stats, usePersist, useSession } from "./common";

type View = { bombs: number; revealed: number[]; multiplier: number; next: number; bombPos?: number[]; outcome?: string; hit?: number };

type Skin = {
  title: string;
  size: number;
  min: number;
  max: number;
  def: number;
  presets: number[];
  bad: string; // nome da armadilha
  good: string;
  bg: string;
  info: ReactNode;
  tile: (state: "hidden" | "good" | "bad" | "ghostGood" | "ghostBad" | "hit") => string;
  Good: () => ReactNode;
  Bad: () => ReactNode;
  Cover?: (i: number) => ReactNode;
};

/* ------------------------------------------------------------------ artes */
const Pearl = () => (
  <svg viewBox="0 0 100 100" className="w-[64%] h-[64%] drop-shadow-[0_0_12px_rgba(125,211,252,0.9)]">
    <defs>
      <radialGradient id="pearl" cx="35%" cy="30%">
        <stop offset="0" stopColor="#fff" />
        <stop offset=".45" stopColor="#e0f2fe" />
        <stop offset="1" stopColor="#7dd3fc" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="34" fill="url(#pearl)" />
    <ellipse cx="38" cy="36" rx="10" ry="6" fill="#fff" opacity=".9" transform="rotate(-30 38 36)" />
    <path d="M30 66 Q50 80 70 66" stroke="#0ea5e9" strokeWidth="3" fill="none" opacity=".35" />
  </svg>
);
const Splash = () => (
  <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
    {Array.from({ length: 10 }).map((_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return <line key={i} x1={50 + Math.cos(a) * 16} y1={50 + Math.sin(a) * 16} x2={50 + Math.cos(a) * 40} y2={50 + Math.sin(a) * 40} stroke="#fca5a5" strokeWidth="5" strokeLinecap="round" />;
    })}
    <circle cx="50" cy="50" r="12" fill="none" stroke="#f87171" strokeWidth="4" strokeDasharray="5 5" />
  </svg>
);
const Bubble = () => (
  <div className="absolute inset-[8%] rounded-full" style={{ background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9) 0 7%, rgba(255,255,255,0.15) 8% 30%, transparent 31%), radial-gradient(circle at 50% 50%, rgba(56,189,248,0.0) 55%, rgba(167,139,250,0.55) 70%, rgba(56,189,248,0.7) 80%, rgba(244,114,182,0.6) 92%, transparent 100%)" }} />
);
const Gem = () => (
  <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">
    <path d="M50 10 L84 36 L50 90 L16 36 Z" fill="url(#c-crystal2)" stroke="#ecfeff" strokeWidth="3" strokeLinejoin="round" />
    <path d="M16 36 L84 36 L50 90 Z" fill="#000" opacity=".12" />
    <path d="M34 36 L50 10 L66 36 L50 90 Z" fill="#fff" opacity=".22" />
  </svg>
);
const Bomb = () => (
  <svg viewBox="0 0 100 100" className="w-[72%] h-[72%]">
    <circle cx="46" cy="58" r="30" fill="#1f1b2e" stroke="#ef4444" strokeWidth="3" />
    <circle cx="36" cy="48" r="7" fill="#fff" opacity=".35" />
    <rect x="54" y="20" width="14" height="14" rx="3" fill="#64748b" transform="rotate(30 61 27)" />
    <path d="M66 22 C 74 10, 84 14, 86 6" stroke="#f97316" strokeWidth="4" fill="none" />
    <circle cx="86" cy="6" r="5" fill="#fde047" />
  </svg>
);
const Chest = () => (
  <svg viewBox="0 0 100 100" className="w-[76%] h-[76%] drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
    <rect x="14" y="44" width="72" height="40" rx="5" fill="#92400e" stroke="#fde68a" strokeWidth="3" />
    <path d="M14 46 Q14 22 50 22 Q86 22 86 46 Z" fill="#b45309" stroke="#fde68a" strokeWidth="3" />
    <rect x="44" y="40" width="12" height="16" rx="2" fill="#fde047" stroke="#78350f" strokeWidth="2" />
    <circle cx="30" cy="30" r="5" fill="#fef08a" />
    <circle cx="66" cy="27" r="4" fill="#fef08a" />
    <rect x="14" y="60" width="72" height="5" fill="#fde68a" opacity=".6" />
  </svg>
);
const Skull = () => (
  <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]">
    <path d="M50 14 C 24 14 16 34 18 50 C 20 62 28 64 30 72 L 70 72 C 72 64 80 62 82 50 C 84 34 76 14 50 14 Z" fill="#e7e5e4" stroke="#44403c" strokeWidth="3" />
    <circle cx="37" cy="46" r="9" fill="#1c1917" />
    <circle cx="63" cy="46" r="9" fill="#1c1917" />
    <path d="M50 54 L45 63 L55 63 Z" fill="#1c1917" />
    <rect x="34" y="72" width="32" height="12" rx="3" fill="#e7e5e4" stroke="#44403c" strokeWidth="3" />
    <path d="M42 72 V84 M50 72 V84 M58 72 V84" stroke="#44403c" strokeWidth="2" />
  </svg>
);
const XMark = ({ i }: { i: number }) => (
  <span className="absolute inset-0 grid place-items-center text-[10px] font-black text-amber-900/35 select-none">{"·∴∵·"[i % 4]}</span>
);

export const GRID_SKINS: Record<string, Skin> = {
  bolhas: {
    title: "Bolhas",
    size: 4,
    min: 1,
    max: 12,
    def: 3,
    presets: [1, 2, 3, 5, 8, 12],
    good: "pérola",
    bad: "bolha vazia",
    bg: "radial-gradient(80% 50% at 50% 10%, rgba(56,189,248,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(167,139,250,0.35), transparent 70%), linear-gradient(180deg,#041526,#020812)",
    info: <><p>16 bolhas flutuando: algumas guardam pérolas, outras estão vazias. Estoure uma por vez; cada pérola aumenta o multiplicador. Achou uma bolha vazia, a rodada acaba.</p><p>Escolha de 1 a 12 bolhas vazias. Multiplicador = 0,98 ÷ chance de sobreviver. RTP 98%.</p></>,
    tile: (s) => (s === "hidden" ? "rounded-full bg-sky-400/5" : s === "good" ? "rounded-full bg-sky-300/15 border border-sky-300/50" : s === "hit" ? "rounded-full bg-loss-500/30 border border-loss-400" : "rounded-full bg-white/[0.03]"),
    Good: Pearl,
    Bad: Splash,
    Cover: () => <Bubble />,
  },
  mines7: {
    title: "Mines 7x7",
    size: 7,
    min: 1,
    max: 48,
    def: 7,
    presets: [1, 5, 10, 20, 35, 48],
    good: "diamante",
    bad: "bomba",
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(16,185,129,0.25), transparent 70%), linear-gradient(180deg,#071226,#030712)",
    info: <><p>A versão gigante do Mines: 49 casas e até 48 bombas. Cada diamante aumenta o prêmio; saque quando quiser.</p><p>Com 48 bombas, um único acerto paga 48,02x. Multiplicador = 0,98 ÷ chance de sobreviver, máximo 50.000x. RTP 98%.</p></>,
    tile: (s) => (s === "hidden" ? "rounded-lg bg-gradient-to-b from-space-600 to-space-800 border-b-[3px] border-space-950/70 shadow" : s === "good" ? "rounded-lg bg-win-500/15 border border-win-400/40" : s === "hit" ? "rounded-lg bg-loss-500/40 border border-loss-400" : "rounded-lg bg-space-800/60"),
    Good: Gem,
    Bad: Bomb,
  },
  tesouro: {
    title: "Caça-Tesouro",
    size: 6,
    min: 1,
    max: 30,
    def: 5,
    presets: [1, 3, 5, 10, 20, 30],
    good: "baú",
    bad: "armadilha",
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(251,191,36,0.3), transparent 70%), radial-gradient(70% 40% at 50% 100%, rgba(14,165,233,0.3), transparent 70%), linear-gradient(180deg,#1a1205,#0a0703)",
    info: <><p>Um mapa 6×6 cheio de areia. Cave onde quiser: baús de ouro aumentam o prêmio, caveiras são armadilhas que encerram a caçada.</p><p>De 1 a 30 armadilhas. Multiplicador = 0,98 ÷ chance de sobreviver, até 50.000x. RTP 98%.</p></>,
    tile: (s) =>
      s === "hidden"
        ? "rounded-md bg-gradient-to-br from-amber-200 to-amber-400 border-b-[3px] border-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
        : s === "good"
          ? "rounded-md bg-amber-900/50 border border-amber-300/60"
          : s === "hit"
            ? "rounded-md bg-loss-500/50 border border-loss-400"
            : "rounded-md bg-amber-950/50",
    Good: Chest,
    Bad: Skull,
    Cover: (i) => <XMark i={i} />,
  },
};

export default function GridGame({ id }: { id: string }) {
  const sk = GRID_SKINS[id];
  const n = sk.size * sk.size;
  const [bet, setBet] = useBet(id);
  const [bombs, setBombs] = usePersist(`${id}_b`, sk.def);
  const S = useSession<View>(id);
  const v = S.round?.view;
  const active = S.active;
  const k = v?.revealed.length ?? 0;
  const B = active || v ? v!.bombs : bombs;

  async function reveal(cell: number) {
    if (!active || S.busy || v!.revealed.includes(cell)) return;
    haptic.impact("light");
    const r = await S.act("reveal", { cell });
    if (!r) return;
    if (r.view.outcome === "bust") {
      sfx.explode();
      haptic.error();
      await finishFx(0, bet);
    } else {
      id === "bolhas" ? sfx.pop() : sfx.gem();
      if (r.done) await finishFx(r.payout, bet);
    }
  }
  async function cashout() {
    const r = await S.act("cashout");
    if (r) await finishFx(r.payout, bet);
  }
  function random() {
    const free = Array.from({ length: n }, (_, i) => i).filter((i) => !v!.revealed.includes(i));
    reveal(free[(Math.random() * free.length) | 0]);
  }

  return (
    <GameShell title={sk.title} game={id} info={sk.info} bg={sk.bg}>
      <Stats>
        <Stat label="ATUAL" value={fmtMult(v?.multiplier ?? 1)} tone="win" />
        <Stat label="PRÓXIMO" value={fmtMult(gridMult(n, B, k + 1))} />
        <Stat label={sk.good.toUpperCase() + "S"} value={`${k}/${n - B}`} />
      </Stats>
      <div className="flex-1 min-h-0 flex items-center justify-center px-3 relative">
        <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${sk.size}, minmax(0,1fr))`, gap: sk.size >= 7 ? 5 : 8, maxWidth: Math.min(400, sk.size * 78) }}>
          {Array.from({ length: n }).map((_, i) => {
            const isRev = v?.revealed.includes(i);
            const isBad = v?.bombPos?.includes(i);
            const ended = !!v?.outcome;
            const hit = v?.hit === i;
            const state = isRev ? "good" : hit ? "hit" : ended ? (isBad ? "ghostBad" : "ghostGood") : "hidden";
            const float = id === "bolhas" && state === "hidden";
            return (
              <motion.button
                key={i}
                whileTap={active ? { scale: 0.88 } : undefined}
                animate={float ? { y: [0, -3, 0, 2, 0] } : { y: 0 }}
                transition={float ? { repeat: Infinity, duration: 3 + (i % 5) * 0.4, delay: (i % 7) * 0.2 } : undefined}
                onClick={() => reveal(i)}
                className={cls("aspect-square grid place-items-center relative overflow-hidden", sk.tile(state))}
              >
                {state === "hidden" && sk.Cover?.(i)}
                <AnimatePresence>
                  {state !== "hidden" && (
                    <motion.div
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: state.startsWith("ghost") ? 0.72 : 1, rotate: 0, opacity: state.startsWith("ghost") ? 0.4 : 1 }}
                      transition={{ type: "spring", damping: 12, delay: state.startsWith("ghost") ? (i % 9) * 0.02 : 0 }}
                      className="w-full h-full grid place-items-center"
                    >
                      {state === "hit" || state === "ghostBad" ? <sk.Bad /> : <sk.Good />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
      <Footer>
        {!active ? (
          <>
            <div className="glass rounded-2xl px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black text-white/50">{sk.bad.toUpperCase()}S</span>
                <span className="font-display font-black text-loss-400">{bombs}</span>
              </div>
              <input type="range" min={sk.min} max={sk.max} value={bombs} onChange={(e) => { setBombs(Number(e.target.value)); haptic.tap(); }} className="w-full" />
              <div className="flex gap-1.5 mt-1.5">
                {sk.presets.map((x) => <button key={x} onClick={() => setBombs(x)} className={cls("press flex-1 h-7 rounded-lg text-[11px] font-black", bombs === x ? "btn-violet" : "bg-white/5 text-white/60")}>{x}</button>)}
              </div>
            </div>
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse disabled={S.busy} onClick={() => S.start(bet, { bombs }).then((r) => r && sfx.whoosh())}>
              COMEÇAR · 1º acerto {fmtMult(gridMult(n, bombs, 1))}
            </Btn>
            <ShareLink id={S.lastWin} />
          </>
        ) : (
          <div className="flex gap-2">
            <Btn variant="glass" size="xl" className="w-28" onClick={random} disabled={S.busy}>ALEATÓRIO</Btn>
            <Btn variant="green" size="xl" className="flex-1" disabled={S.busy || k === 0} onClick={cashout}>SACAR {money(bet, v!.multiplier)}</Btn>
          </div>
        )}
      </Footer>
    </GameShell>
  );
}
