import { AnimatePresence, motion } from "framer-motion";
import { cls, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { haptic } from "../../lib/tg";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, ShareLink, Stat, Stats, useSession } from "./common";

type View = { opened: number[]; left: number; pos?: number; prize?: number; found?: boolean };

function ChestArt({ open, prize }: { open?: boolean; prize?: number }) {
  return (
    <svg viewBox="0 0 100 100" className="w-[86%] h-[86%] drop-shadow-[0_0_14px_rgba(250,204,21,0.8)]">
      {open && <ellipse cx="50" cy="44" rx="34" ry="14" fill="#fde047" opacity=".8" />}
      <rect x="14" y="46" width="72" height="38" rx="5" fill="#92400e" stroke="#fde68a" strokeWidth="3" />
      {open ? (
        <path d="M14 46 L22 18 Q50 8 78 18 L86 46 Z" fill="#78350f" stroke="#fde68a" strokeWidth="3" />
      ) : (
        <path d="M14 48 Q14 24 50 24 Q86 24 86 48 Z" fill="#b45309" stroke="#fde68a" strokeWidth="3" />
      )}
      {open && [30, 42, 54, 66].map((x, i) => <circle key={x} cx={x} cy={44 - (i % 2) * 4} r="6" fill="#facc15" stroke="#a16207" strokeWidth="2" />)}
      <rect x="44" y="42" width="12" height="16" rx="2" fill="#fde047" stroke="#78350f" strokeWidth="2" />
      {open && prize && <text x="50" y="76" textAnchor="middle" fontSize="16" fontWeight="900" fill="#fef9c3">{prize}x</text>}
    </svg>
  );
}

export default function BauPirata() {
  const [bet, setBet] = useBet("bau-pirata");
  const S = useSession<View>("bau-pirata");
  const v = S.round?.view;
  const active = S.active;

  async function dig(i: number) {
    if (!active || S.busy || v!.opened.includes(i)) return;
    haptic.impact("medium");
    sfx.whoosh();
    const r = await S.act("pick", { index: i });
    if (!r) return;
    if (r.view.found) sfx.jackpot();
    else sfx.pop();
    if (r.done) await finishFx(r.payout, bet);
  }

  return (
    <GameShell
      title="Baú Pirata"
      game="bau-pirata"
      bg="radial-gradient(80% 50% at 50% 0%, rgba(14,165,233,0.35), transparent 70%), linear-gradient(180deg,#05192b,#020a12)"
      info={<><p>Um baú pirata está enterrado em uma das 9 marcas do mapa. Você tem 3 escavações para achá-lo.</p><p>O baú guarda 2x, 3x, 5x, 10x ou 50x a aposta (sorteado no início). Chance de achar: 1 em 3. RTP 97,5%.</p></>}
    >
      <Stats>
        <Stat label="PÁS" value={"⛏".repeat(v ? v.left : 3) || "—"} tone="gold" />
        <Stat label="CHANCE" value={v ? `${Math.round((v.left / (9 - v.opened.length)) * 100)}%` : "33%"} />
        <Stat label="BAÚ" value={v?.prize ? fmtMult(v.prize) : "2x – 50x"} tone="win" />
      </Stats>
      <div className="flex-1 min-h-0 flex items-center justify-center px-4">
        <div className="relative w-full max-w-[380px] aspect-square rounded-3xl p-5" style={{ background: "radial-gradient(circle at 50% 40%, #fef3c7, #fcd34d 55%, #b45309 100%)", boxShadow: "inset 0 0 50px rgba(120,53,15,0.6), 0 20px 50px rgba(0,0,0,0.5)" }}>
          <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M8 90 C 25 70, 20 50, 40 45 S 70 30, 92 10" stroke="#7c2d12" strokeWidth=".8" strokeDasharray="2 2" fill="none" />
            <circle cx="88" cy="88" r="7" fill="none" stroke="#7c2d12" strokeWidth=".6" />
            <path d="M88 81 V95 M81 88 H95" stroke="#7c2d12" strokeWidth=".6" />
          </svg>
          <div className="relative grid grid-cols-3 gap-3 h-full">
            {Array.from({ length: 9 }).map((_, i) => {
              const dug = v?.opened.includes(i);
              const isChest = v?.pos === i;
              return (
                <button key={i} onClick={() => dig(i)} disabled={!active || S.busy || dug} className="relative grid place-items-center press">
                  <AnimatePresence mode="wait">
                    {isChest ? (
                      <motion.div key="c" initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 10 }} className={cls("w-full h-full grid place-items-center", !dug && "opacity-50")}>
                        <ChestArt open={dug} prize={v?.prize} />
                      </motion.div>
                    ) : dug ? (
                      <motion.div key="h" initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-[70%] h-[50%] rounded-[50%] bg-amber-900/80 shadow-[inset_0_6px_10px_rgba(0,0,0,0.6)] grid place-items-center text-[10px] font-black text-amber-200/60">
                        nada
                      </motion.div>
                    ) : (
                      <motion.div key="x" className={cls("text-4xl font-black select-none", active ? "text-red-700" : "text-red-900/50")} animate={active ? { scale: [1, 1.12, 1] } : {}} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.1 }}>
                        ✕
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
            {v && (v.found ? <div className="text-center font-display font-black text-gold-300 text-lg">Baú encontrado! {fmtMult(v.prize ?? 0)}</div> : <div className="text-center font-black text-white/60 text-sm">O baú estava em outra marca…</div>)}
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse disabled={S.busy} onClick={() => S.start(bet)}>NOVO MAPA</Btn>
            <ShareLink id={S.lastWin} />
          </>
        ) : (
          <div className="glass rounded-2xl h-14 grid place-items-center text-sm font-black text-white/70">ESCOLHA ONDE CAVAR · {v!.left} {v!.left === 1 ? "tentativa" : "tentativas"}</div>
        )}
      </Footer>
    </GameShell>
  );
}
