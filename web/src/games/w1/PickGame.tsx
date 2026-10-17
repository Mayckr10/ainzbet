import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { cls, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { haptic } from "../../lib/tg";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, money, ShareLink, Stat, Stats, useSession } from "./common";

type View = { opened: number[]; found: number[]; total: number; left: number; all?: number[] };

type Skin = {
  title: string;
  n: number;
  picks: number;
  cols: number;
  bg: string;
  stage: string;
  info: ReactNode;
  Closed: (p: { i: number; active: boolean }) => ReactNode;
  Open: (p: { m: number; ghost?: boolean }) => ReactNode;
  verb: string;
  table: { m: number; label: string }[];
};

const tierColor = (m: number) => (m >= 10 ? "#f472b6" : m >= 2.5 ? "#facc15" : m >= 1 ? "#4ade80" : m > 0 ? "#7dd3fc" : "#94a3b8");

function Safe({ i, active }: { i: number; active: boolean }) {
  return (
    <div className={cls("relative w-full h-full rounded-xl border-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.25),0_6px_12px_rgba(0,0,0,0.5)]", active ? "border-slate-300 bg-gradient-to-b from-slate-400 to-slate-600" : "border-slate-500 bg-gradient-to-b from-slate-500 to-slate-700")}>
      <div className="absolute inset-[10%] rounded-lg border-2 border-slate-700/60 bg-gradient-to-br from-slate-300/40 to-slate-700/40" />
      <motion.div className="absolute left-1/2 top-1/2 w-[42%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-slate-800 bg-[conic-gradient(#e2e8f0,#64748b,#e2e8f0,#64748b,#e2e8f0)]" animate={active ? { rotate: [0, 40, -20, 0] } : {}} transition={{ repeat: Infinity, duration: 3, delay: (i % 5) * 0.3 }}>
        <div className="absolute left-1/2 top-0.5 w-1 h-1/3 -translate-x-1/2 rounded bg-slate-900" />
      </motion.div>
      <div className="absolute right-[14%] top-1/2 w-1.5 h-[30%] -translate-y-1/2 rounded bg-slate-800" />
      <div className="absolute left-1 top-1 text-[9px] font-black text-slate-900/60">{String(i + 1).padStart(2, "0")}</div>
    </div>
  );
}
function OpenSafe({ m, ghost }: { m: number; ghost?: boolean }) {
  return (
    <div className={cls("relative w-full h-full rounded-xl border-2 border-slate-500 bg-slate-900 overflow-hidden", ghost && "opacity-45")}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 60%, ${tierColor(m)}55, transparent 70%)` }} />
      <div className="absolute inset-0 grid place-items-center">
        {m > 0 ? (
          <div className="text-center">
            <div className="text-lg leading-none">{m >= 10 ? "💎" : m >= 1 ? "💰" : "🪙"}</div>
            <div className="font-black text-[13px] tabular" style={{ color: tierColor(m) }}>{fmtMult(m)}</div>
          </div>
        ) : (
          <div className="text-[11px] font-black text-white/40">VAZIO</div>
        )}
      </div>
    </div>
  );
}

const FISH_COLORS = ["#fb923c", "#38bdf8", "#f472b6", "#a3e635", "#facc15", "#c084fc"];
function Fish({ i, active }: { i: number; active: boolean }) {
  const c = FISH_COLORS[i % FISH_COLORS.length];
  const dir = i % 2 ? -1 : 1;
  return (
    <motion.div className="w-full h-full grid place-items-center" animate={active ? { x: [0, 6 * dir, -4 * dir, 0], y: [0, -3, 2, 0] } : {}} transition={{ repeat: Infinity, duration: 2.4 + (i % 4) * 0.5, delay: (i % 6) * 0.25 }}>
      <svg viewBox="0 0 100 60" className="w-[86%]" style={{ transform: dir < 0 ? "scaleX(-1)" : undefined }}>
        <path d="M8 30 L26 14 L26 46 Z" fill={c} opacity=".85" />
        <ellipse cx="56" cy="30" rx="34" ry="20" fill={c} />
        <path d="M44 12 Q56 2 66 12" fill={c} opacity=".8" />
        <circle cx="76" cy="26" r="5" fill="#fff" />
        <circle cx="77" cy="26" r="2.5" fill="#111" />
        <path d="M44 22 Q50 30 44 38 M54 20 Q60 30 54 40" stroke="#fff" strokeWidth="2" fill="none" opacity=".45" />
      </svg>
    </motion.div>
  );
}
function Caught({ m, ghost }: { m: number; ghost?: boolean }) {
  return (
    <div className={cls("w-full h-full rounded-full grid place-items-center", ghost && "opacity-45")} style={{ background: `radial-gradient(circle, ${tierColor(m)}40, transparent 70%)` }}>
      <div className="text-center leading-none">
        <div className="text-base">{m >= 15 ? "🦈" : m >= 3 ? "🐠" : m > 0 ? "🐟" : "🥾"}</div>
        <div className="font-black text-[12px] tabular" style={{ color: tierColor(m) }}>{m > 0 ? fmtMult(m) : "0x"}</div>
      </div>
    </div>
  );
}

export const PICK_SKINS: Record<string, Skin> = {
  "cofre-banco": {
    title: "Cofre do Banco",
    n: 12,
    picks: 3,
    cols: 4,
    verb: "ABRA",
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(250,204,21,0.25), transparent 70%), linear-gradient(180deg,#14171f,#07080c)",
    stage: "bg-gradient-to-b from-[#1c2230] to-[#0d1118] border border-white/10",
    info: <><p>12 cofres fechados no subsolo do banco. Você abre 3: cada um pode ter de nada até 50x a aposta. O prêmio é a soma dos três.</p><p>Os valores de cada cofre são sorteados de forma independente (provably fair). RTP 97%.</p></>,
    Closed: Safe,
    Open: OpenSafe,
    table: [{ m: 50, label: "Diamante" }, { m: 10, label: "Barras" }, { m: 2.5, label: "Joias" }, { m: 1, label: "Maço" }, { m: 0.6, label: "Notas" }, { m: 0.3, label: "Moedas" }, { m: 0.1, label: "Troco" }],
  },
  pescaria: {
    title: "Pescaria",
    n: 16,
    picks: 3,
    cols: 4,
    verb: "PESQUE",
    bg: "radial-gradient(90% 50% at 50% 0%, rgba(125,211,252,0.35), transparent 70%), linear-gradient(180deg,#062033,#020c14)",
    stage: "border-4 border-amber-800/80 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]",
    info: <><p>16 peixes no lago e 3 lançamentos de vara. Cada peixe tem um prêmio escondido (de uma bota velha até o tubarão de 100x). O prêmio é a soma dos 3.</p><p>Valores sorteados de forma independente para cada peixe. RTP 96%.</p></>,
    Closed: Fish,
    Open: Caught,
    table: [{ m: 100, label: "Tubarão" }, { m: 15, label: "Peixe-espada" }, { m: 3, label: "Peixe-palhaço" }, { m: 1.2, label: "Robalo" }, { m: 0.6, label: "Tilápia" }, { m: 0.3, label: "Lambari" }, { m: 0.15, label: "Piaba" }],
  },
};

export default function PickGame({ id }: { id: string }) {
  const sk = PICK_SKINS[id];
  const [bet, setBet] = useBet(id);
  const S = useSession<View>(id);
  const v = S.round?.view;
  const active = S.active;

  async function pick(i: number) {
    if (!active || S.busy || v!.opened.includes(i)) return;
    haptic.impact("light");
    id === "pescaria" ? sfx.whoosh() : sfx.click();
    const r = await S.act("pick", { index: i });
    if (!r) return;
    const m = r.view.found[r.view.found.length - 1];
    m >= 1 ? sfx.coin() : m > 0 ? sfx.gem() : sfx.pop();
    if (r.done) await finishFx(r.payout, bet);
  }

  return (
    <GameShell title={sk.title} game={id} info={sk.info} bg={sk.bg}>
      <Stats>
        <Stat label="ESCOLHAS"value={`${v ? sk.picks - v.left : 0}/${sk.picks}`} />
        <Stat label="SOMA" value={fmtMult(v?.total ?? 0)} tone="win" />
        <Stat label="PRÊMIO" value={money(bet, v?.total ?? 0)} tone="gold" />
      </Stats>
      <div className="flex justify-center gap-2 py-2">
        {Array.from({ length: sk.picks }).map((_, i) => {
          const m = v?.found[i];
          return (
            <motion.div key={i} animate={{ scale: m != null ? [1.3, 1] : 1 }} className={cls("w-16 h-9 rounded-xl grid place-items-center text-[12px] font-black tabular border", m != null ? "border-white/20 bg-white/10" : "border-dashed border-white/15 text-white/30")} style={{ color: m != null ? tierColor(m) : undefined }}>
              {m != null ? fmtMult(m) : "?"}
            </motion.div>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center px-3">
        <div className={cls("w-full max-w-[400px] rounded-3xl p-3 relative overflow-hidden", sk.stage)} style={id === "pescaria" ? { background: "radial-gradient(circle at 30% 20%, #38bdf8 0, #0369a1 50%, #082f49 100%)" } : undefined}>
          {id === "pescaria" && <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, #fff 0 2px, transparent 3px), radial-gradient(circle at 40% 80%, #fff 0 1.5px, transparent 2.5px)" }} />}
          <div className="grid gap-2.5 relative" style={{ gridTemplateColumns: `repeat(${sk.cols}, minmax(0,1fr))` }}>
            {Array.from({ length: sk.n }).map((_, i) => {
              const k = v?.opened.indexOf(i) ?? -1;
              const isOpen = k >= 0;
              const ghost = !isOpen && v?.all;
              return (
                <button key={i} onClick={() => pick(i)} disabled={!active || S.busy || isOpen} className={cls("aspect-square relative press", !active && !ghost && "opacity-80")}>
                  <AnimatePresence mode="wait">
                    {isOpen ? (
                      <motion.div key="o" className="absolute inset-0" initial={{ rotateY: 90, scale: 0.8 }} animate={{ rotateY: 0, scale: 1 }} transition={{ type: "spring", damping: 14 }}>
                        <sk.Open m={v!.found[k]} />
                      </motion.div>
                    ) : ghost ? (
                      <motion.div key="g" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (i % 8) * 0.04 }}>
                        <sk.Open m={v!.all![i]} ghost />
                      </motion.div>
                    ) : (
                      <motion.div key="c" className="absolute inset-0" exit={{ rotateY: -90, opacity: 0 }}>
                        <sk.Closed i={i} active={!!active} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <Footer>
        {!active ? (
          <>
            <div className="glass rounded-2xl px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar">
              {sk.table.map((t) => (
                <div key={t.label} className="shrink-0 text-center">
                  <div className="text-[12px] font-black tabular" style={{ color: tierColor(t.m) }}>{fmtMult(t.m)}</div>
                  <div className="text-[9px] text-white/45 font-bold">{t.label}</div>
                </div>
              ))}
            </div>
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse disabled={S.busy} onClick={() => S.start(bet)}>
              {id === "pescaria" ? "IR PESCAR" : "ENTRAR NO COFRE"} · {sk.picks} escolhas
            </Btn>
            <ShareLink id={S.lastWin} />
          </>
        ) : (
          <div className="glass rounded-2xl h-14 grid place-items-center text-sm font-black text-white/70">
            {sk.verb} MAIS {v!.left} {v!.left === 1 ? "VEZ" : "VEZES"}
          </div>
        )}
      </Footer>
    </GameShell>
  );
}
