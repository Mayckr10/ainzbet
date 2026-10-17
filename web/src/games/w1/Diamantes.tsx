import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, Hist, ShareLink, useHist } from "./common";

const GEMS = [
  { a: "#fda4af", b: "#e11d48", shape: "M50 8 L88 38 L50 92 L12 38 Z" },
  { a: "#93c5fd", b: "#1d4ed8", shape: "M30 10 H70 L90 40 L50 92 L10 40 Z" },
  { a: "#86efac", b: "#15803d", shape: "M50 6 L90 50 L50 94 L10 50 Z" },
  { a: "#fde68a", b: "#ca8a04", shape: "M50 8 L62 36 L92 38 L68 58 L76 90 L50 72 L24 90 L32 58 L8 38 L38 36 Z" },
  { a: "#d8b4fe", b: "#7e22ce", shape: "M50 8 L86 28 L86 72 L50 92 L14 72 L14 28 Z" },
  { a: "#a5f3fc", b: "#0e7490", shape: "M20 30 L50 8 L80 30 L80 70 L50 92 L20 70 Z" },
  { a: "#fdba74", b: "#c2410c", shape: "M50 6 C 80 30, 90 60, 50 94 C 10 60, 20 30, 50 6 Z" },
];
const PAYS: { key: string; label: string; m: number; dots: number[] }[] = [
  { key: "five", label: "Quina", m: 50, dots: [5] },
  { key: "four", label: "Quadra", m: 5, dots: [4, 1] },
  { key: "full", label: "Full House", m: 4, dots: [3, 2] },
  { key: "three", label: "Trinca", m: 3, dots: [3, 1, 1] },
  { key: "twopair", label: "Dois pares", m: 2, dots: [2, 2, 1] },
  { key: "pair", label: "Par", m: 0.1, dots: [2, 1, 1, 1] },
];

function GemArt({ g, glow }: { g: number; glow?: boolean }) {
  const G = GEMS[g];
  return (
    <svg viewBox="0 0 100 100" className={cls("w-[78%] h-[78%]", glow && "drop-shadow-[0_0_14px_rgba(255,255,255,0.8)]")}>
      <defs>
        <linearGradient id={`dg${g}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".25" stopColor={G.a} />
          <stop offset="1" stopColor={G.b} />
        </linearGradient>
      </defs>
      <path d={G.shape} fill={`url(#dg${g})`} stroke="#fff" strokeOpacity=".7" strokeWidth="2.5" strokeLinejoin="round" />
      <path d={G.shape} fill="#000" opacity=".12" transform="translate(50 50) scale(.55) translate(-50 -40)" />
      <ellipse cx="38" cy="32" rx="9" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 38 32)" />
    </svg>
  );
}

export default function Diamantes() {
  const [bet, setBet] = useBet("diamantes");
  const [gems, setGems] = useState<(number | null)[]>([null, null, null, null, null]);
  const [win, setWin] = useState<boolean[]>([]);
  const [kind, setKind] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastId, setLastId] = useState<number | null>(null);
  const [hist, push] = useHist("diamantes");

  async function play() {
    if (busy) return;
    setBusy(true);
    setKind(null);
    setWin([]);
    setGems([null, null, null, null, null]);
    haptic.impact("medium");
    const r = await playInstant<{ gems: number[]; kind: string; win: boolean[]; multiplier: number }>("diamantes", bet, {});
    if (!r) return setBusy(false);
    for (let i = 0; i < 5; i++) {
      await sleep(160 * speedFactor());
      setGems((g) => g.map((x, j) => (j === i ? r.result.gems[i] : x)));
      sfx.gem();
    }
    await sleep(150);
    setWin(r.result.win);
    setKind(r.result.kind);
    push(r.result.multiplier, r.result.multiplier >= 1);
    if (r.payout > bet) setLastId(r.roundId);
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  return (
    <GameShell
      title="Diamantes 5"
      game="diamantes"
      bg="radial-gradient(70% 45% at 50% 30%, rgba(56,189,248,0.3), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(236,72,153,0.25), transparent 70%), linear-gradient(180deg,#080a1c,#03040c)"
      info={<><p>Cinco gemas são sorteadas entre 7 tipos. Combinações iguais pagam como no pôquer: quina, quadra, full house, trinca, dois pares e par.</p><p>Quina 50x · Quadra 5x · Full House 4x · Trinca 3x · Dois pares 2x · Par 0,1x. RTP 98,3%.</p></>}
    >
      <Hist items={hist} />
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6 px-3">
        <div className="grid grid-cols-5 gap-2 w-full max-w-[420px]">
          {gems.map((g, i) => (
            <div key={i} className={cls("aspect-[3/4] rounded-2xl grid place-items-center border transition-colors", win[i] ? "border-gold-300 bg-gold-400/15 shadow-[0_0_18px_rgba(250,204,21,0.45)]" : "border-white/10 bg-white/[0.04]", kind && !win[i] && "opacity-40")}>
              <AnimatePresence>
                {g != null && (
                  <motion.div initial={{ y: -60, scale: 0.3, rotate: -40, opacity: 0 }} animate={{ y: 0, scale: win[i] ? 1.12 : 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", damping: 11 }} className="w-full h-full grid place-items-center">
                    <GemArt g={g} glow={win[i]} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="h-10">
          {kind && (
            <motion.div initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cls("font-display font-black text-2xl", kind === "none" ? "text-white/40" : kind === "pair" ? "text-white/80" : "text-gold-300")}>
              {kind === "none" ? "Nada desta vez" : `${PAYS.find((p) => p.key === kind)!.label} · ${fmtMult(PAYS.find((p) => p.key === kind)!.m)}`}
            </motion.div>
          )}
        </div>
        <div className="w-full max-w-[420px] grid grid-cols-2 gap-1.5">
          {PAYS.map((p) => (
            <div key={p.key} className={cls("flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-black", kind === p.key ? "bg-gold-400/25 text-gold-200" : "bg-white/5 text-white/60")}>
              <span className="flex gap-0.5">
                {p.dots.map((d, i) => (
                  <span key={i} className="flex gap-px mr-1">
                    {Array.from({ length: d }).map((_, j) => <span key={j} className="w-1.5 h-1.5 rotate-45" style={{ background: GEMS[i].b }} />)}
                  </span>
                ))}
              </span>
              <span>{p.label}</span>
              <span className="tabular">{fmtMult(p.m)}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={play}>SORTEAR GEMAS · {fmt(bet)}</Btn>
        <ShareLink id={lastId} />
      </Footer>
    </GameShell>
  );
}
