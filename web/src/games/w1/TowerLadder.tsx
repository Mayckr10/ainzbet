import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cls, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { haptic } from "../../lib/tg";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Chips, finishFx, Footer, ladderMult, money, ShareLink, Stat, Stats, usePersist, useSession } from "./common";

type View = { mode: string; picks: number[]; level: number; multiplier: number; next: number; rows?: number[][]; outcome?: string; hit?: { level: number; col: number } };

type Skin = {
  title: string;
  levels: number;
  modes: { value: string; label: string; cols: number; bad: number }[];
  def: string;
  bg: string;
  info: ReactNode;
  Good: () => ReactNode;
  Bad: () => ReactNode;
  Cover: () => ReactNode;
  rowBg: (current: boolean, passed: boolean) => string;
  cell: (state: "hidden" | "current" | "good" | "bad" | "ghostBad") => string;
  decor?: ReactNode;
};

const Step = () => (
  <svg viewBox="0 0 100 60" className="w-[78%] h-[78%]">
    <path d="M10 40 L50 18 L90 40 L50 58 Z" fill="#a78bfa" opacity=".25" />
    <path d="M30 30 L50 20 L70 30 L50 40 Z" fill="#fde68a" />
    <path d="M30 30 L50 40 L50 46 L30 36 Z" fill="#b45309" />
    <path d="M70 30 L50 40 L50 46 L70 36 Z" fill="#d97706" />
  </svg>
);
const Spikes = () => (
  <svg viewBox="0 0 100 60" className="w-[80%] h-[80%]">
    {[18, 34, 50, 66, 82].map((x) => (
      <path key={x} d={`M${x - 7} 52 L${x} 10 L${x + 7} 52 Z`} fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
    ))}
    <rect x="8" y="50" width="84" height="6" rx="2" fill="#475569" />
  </svg>
);
const StoneCover = () => <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/15" />;

const GoldApple = () => (
  <svg viewBox="0 0 100 100" className="w-[74%] h-[74%] drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]">
    <defs>
      <radialGradient id="gapple" cx="35%" cy="35%">
        <stop offset="0" stopColor="#fffbe6" />
        <stop offset=".45" stopColor="#facc15" />
        <stop offset="1" stopColor="#a16207" />
      </radialGradient>
    </defs>
    <path d="M50 30 C 30 18, 12 32, 16 56 C 20 80, 38 90, 50 84 C 62 90, 80 80, 84 56 C 88 32, 70 18, 50 30 Z" fill="url(#gapple)" />
    <path d="M50 30 C 50 22 52 14 56 10" stroke="#78350f" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M56 18 C 66 8, 80 12, 82 18 C 72 24, 62 24, 56 18 Z" fill="#22c55e" />
    <ellipse cx="34" cy="44" rx="7" ry="11" fill="#fff" opacity=".55" transform="rotate(25 34 44)" />
  </svg>
);
const RottenApple = () => (
  <svg viewBox="0 0 100 100" className="w-[72%] h-[72%]">
    <path d="M50 30 C 30 18, 12 32, 16 56 C 20 80, 38 90, 50 84 C 62 90, 80 80, 84 56 C 88 32, 70 18, 50 30 Z" fill="#57534e" />
    <circle cx="38" cy="56" r="8" fill="#292524" />
    <circle cx="62" cy="64" r="6" fill="#292524" />
    <path d="M50 30 C 50 22 52 14 56 10" stroke="#44403c" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M66 46 q6 -6 12 0 q-6 6 -12 0" fill="#84cc16" />
    <circle cx="74" cy="44" r="2" fill="#000" />
  </svg>
);
const Leaf = () => (
  <svg viewBox="0 0 100 100" className="w-[60%] h-[60%] opacity-80">
    <path d="M20 70 C 20 30, 60 14, 84 18 C 82 46, 64 84, 20 70 Z" fill="#15803d" />
    <path d="M24 68 C 44 50, 60 36, 80 22" stroke="#86efac" strokeWidth="3" fill="none" />
  </svg>
);

export const TOWER_SKINS: Record<string, Skin> = {
  escada: {
    title: "Escada",
    levels: 8,
    modes: [
      { value: "easy", label: "1 armadilha", cols: 4, bad: 1 },
      { value: "medium", label: "2 armadilhas", cols: 4, bad: 2 },
      { value: "hard", label: "3 armadilhas", cols: 4, bad: 3 },
    ],
    def: "medium",
    bg: "radial-gradient(70% 50% at 50% 0%, rgba(124,58,237,0.4), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(217,119,6,0.25), transparent 70%), linear-gradient(180deg,#0e0a1f,#05040b)",
    info: <><p>Suba os 8 andares da escada escolhendo um dos 4 degraus de cada andar. Alguns degraus escondem espinhos: pisou, caiu.</p><p>Escolha 1, 2 ou 3 armadilhas por andar. Saque quando quiser. Multiplicador = 0,98 × (4 ÷ degraus seguros) por andar. RTP 98%; no modo 3 armadilhas, o topo paga 50.000x.</p></>,
    Good: Step,
    Bad: Spikes,
    Cover: StoneCover,
    rowBg: (c, p) => cls("rounded-2xl p-1", c ? "bg-violet-500/15 ring-1 ring-violet-300/40" : p ? "bg-win-500/[0.06]" : "bg-white/[0.02]"),
    cell: (s) =>
      s === "current"
        ? "bg-gradient-to-b from-violet-400/70 to-violet-700/70 border-b-[3px] border-violet-950 shadow-[0_0_14px_rgba(167,139,250,0.55)]"
        : s === "good"
          ? "bg-win-500/20 border border-win-400/60"
          : s === "bad"
            ? "bg-loss-500/50 border border-loss-400"
            : s === "ghostBad"
              ? "bg-loss-500/10"
              : "bg-gradient-to-b from-space-600 to-space-800 border-b-[3px] border-space-950/70",
  },
  maca: {
    title: "Maçã Dourada",
    levels: 9,
    modes: [
      { value: "easy", label: "Fácil", cols: 5, bad: 1 },
      { value: "medium", label: "Médio", cols: 4, bad: 1 },
      { value: "hard", label: "Difícil", cols: 3, bad: 1 },
      { value: "expert", label: "Expert", cols: 3, bad: 2 },
    ],
    def: "medium",
    bg: "radial-gradient(70% 45% at 50% 0%, rgba(250,204,21,0.3), transparent 70%), radial-gradient(70% 50% at 50% 100%, rgba(22,163,74,0.35), transparent 70%), linear-gradient(180deg,#071a0c,#030b05)",
    info: <><p>Escale a árvore mágica: em cada galho, escolha uma folha. Atrás dela pode estar uma maçã dourada (sobe) ou uma podre (cai).</p><p>Fácil: 5 folhas/1 podre · Médio: 4/1 · Difícil: 3/1 · Expert: 3/2. Saque quando quiser. RTP 98%.</p></>,
    Good: GoldApple,
    Bad: RottenApple,
    Cover: () => <Leaf />,
    rowBg: (c, p) => cls("rounded-full px-2 py-1 bg-gradient-to-r from-amber-900/60 via-amber-800/70 to-amber-900/60 shadow-inner", c && "ring-2 ring-gold-300/60", p && "opacity-90"),
    cell: (s) =>
      s === "current"
        ? "rounded-full bg-green-500/30 ring-2 ring-green-300/70 animate-pulse"
        : s === "good"
          ? "rounded-full bg-gold-400/25"
          : s === "bad"
            ? "rounded-full bg-loss-500/40"
            : "rounded-full bg-green-900/40",
  },
};

export default function TowerLadder({ id }: { id: string }) {
  const sk = TOWER_SKINS[id];
  const [bet, setBet] = useBet(id);
  const [mode, setMode] = usePersist(`${id}_m`, sk.def);
  const S = useSession<View>(id);
  const v = S.round?.view;
  const active = S.active;
  const spec = sk.modes.find((m) => m.value === (v?.mode ?? mode)) ?? sk.modes[0];
  const level = v?.level ?? 0;

  async function pick(col: number) {
    if (!active || S.busy) return;
    haptic.impact("light");
    const r = await S.act("pick", { col });
    if (!r) return;
    if (r.view.outcome === "bust") {
      sfx.explode();
      await finishFx(0, bet);
    } else {
      sfx.gem();
      if (r.done) await finishFx(r.payout, bet);
    }
  }
  async function cashout() {
    const r = await S.act("cashout");
    if (r) await finishFx(r.payout, bet);
  }

  return (
    <GameShell title={sk.title} game={id} info={sk.info} bg={sk.bg}>
      <Stats>
        <Stat label="ATUAL" value={fmtMult(v?.multiplier ?? 1)} tone="win" />
        <Stat label="PRÓXIMO" value={fmtMult(ladderMult(spec.cols, spec.bad, level + 1))} />
        <Stat label="TOPO" value={fmtMult(ladderMult(spec.cols, spec.bad, sk.levels))} tone="gold" />
      </Stats>
      <div className="flex-1 min-h-0 flex items-center justify-center px-3 py-2">
        <div className="w-full max-w-[380px] h-full max-h-[560px] flex flex-col-reverse justify-between gap-1">
          {Array.from({ length: sk.levels }).map((_, L) => {
            const isCur = active && L === level;
            const passed = !!v && L < v.picks.length;
            return (
              <div key={L} className={cls("flex items-center gap-2 flex-1 min-h-0", active && L > level && "opacity-45")}>
                <div className={cls("w-14 text-right text-[11px] font-black tabular shrink-0", passed ? "text-win-400" : isCur ? "text-gold-300" : "text-white/40")}>{fmtMult(ladderMult(spec.cols, spec.bad, L + 1))}</div>
                <div className={cls("flex-1 h-full grid gap-1.5", sk.rowBg(!!isCur, passed))} style={{ gridTemplateColumns: `repeat(${spec.cols}, minmax(0,1fr))` }}>
                  {Array.from({ length: spec.cols }).map((_, c) => {
                    const picked = v?.picks[L] === c;
                    const trap = v?.rows?.[L]?.includes(c);
                    const hit = v?.hit?.level === L && v.hit.col === c;
                    const state = picked ? "good" : hit ? "bad" : trap && v?.outcome ? "ghostBad" : isCur ? "current" : "hidden";
                    return (
                      <motion.button
                        key={c}
                        whileTap={isCur ? { scale: 0.9 } : undefined}
                        onClick={() => isCur && pick(c)}
                        className={cls("relative rounded-lg grid place-items-center overflow-hidden min-h-[26px]", sk.cell(state))}
                      >
                        {state === "hidden" || state === "current" ? <sk.Cover /> : null}
                        {(picked || hit || state === "ghostBad") && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: state === "ghostBad" ? 0.7 : 1, opacity: state === "ghostBad" ? 0.5 : 1 }} transition={{ type: "spring", damping: 12 }} className="absolute inset-0 grid place-items-center">
                            {picked ? <sk.Good /> : <sk.Bad />}
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer>
        {!active ? (
          <>
            <Chips value={mode} onChange={setMode} options={sk.modes.map((m) => ({ value: m.value, label: m.label }))} />
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse disabled={S.busy} onClick={() => S.start(bet, { mode }).then((r) => r && sfx.whoosh())}>
              COMEÇAR · até {fmtMult(ladderMult(sk.modes.find((m) => m.value === mode)!.cols, sk.modes.find((m) => m.value === mode)!.bad, sk.levels))}
            </Btn>
            <ShareLink id={S.lastWin} />
          </>
        ) : (
          <div className="flex gap-2">
            <Btn variant="glass" size="xl" className="w-28" disabled={S.busy} onClick={() => pick((Math.random() * spec.cols) | 0)}>ALEATÓRIO</Btn>
            <Btn variant="green" size="xl" className="flex-1" disabled={S.busy || level === 0} onClick={cashout}>SACAR {money(bet, v!.multiplier)}</Btn>
          </div>
        )}
      </Footer>
    </GameShell>
  );
}
